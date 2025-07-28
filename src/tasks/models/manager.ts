import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createActor } from 'xstate';
import type { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { JobOperationStatus, Prisma, StageOperationStatus, TaskOperationStatus, type PrismaClient } from '@prismaClient';
import { SERVICES, XSTATE_DONE_STATE } from '@common/constants';
import { StageManager } from '@src/stages/models/manager';
import { InvalidUpdateError, prismaKnownErrors } from '@src/common/errors';
import { StageNotFoundError, errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { taskStateMachine, updateTaskMachineState } from '@src/tasks/models/taskStateMachine';
import { JobManager } from '@src/jobs/models/manager';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import type { UpdateSummaryCount } from '@src/stages/models/models';
import type { PrismaTransaction } from '@src/db/types';
import type { TasksFindCriteriaArg, TaskModel, TaskPrismaObject, TaskCreateModel } from './models';
import { TaskNotFoundError, errorMessages as tasksErrorMessages } from './errors';
import { convertArrayPrismaTaskToTaskResponse, convertPrismaToTaskResponse } from './helper';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function generatePrioritizedTaskQuery(stageType: string) {
  // Define valid states for filtering
  const validTaskStatuses = [TaskOperationStatus.PENDING, TaskOperationStatus.RETRIED];
  const validStageStatuses = [StageOperationStatus.PENDING, StageOperationStatus.IN_PROGRESS];
  const validJobStatuses = [JobOperationStatus.PENDING, JobOperationStatus.IN_PROGRESS];

  const queryBody = {
    where: {
      stage: {
        type: stageType,
        status: {
          in: validStageStatuses,
        },
        job: {
          status: {
            in: validJobStatuses,
          },
        },
      },
      status: {
        in: validTaskStatuses,
      },
    },
    include: {
      stage: {
        include: {
          job: {
            select: {
              priority: true,
              id: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: {
      stage: {
        job: {
          priority: Prisma.SortOrder.asc,
        },
      },
    },
  } satisfies Prisma.TaskFindFirstArgs;

  return queryBody;
}
@injectable()
export class TaskManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(StageManager) private readonly stageManager: StageManager,
    @inject(JobManager) private readonly jobManager: JobManager
  ) {}

  @withSpanAsyncV4
  public async addTasks(stageId: string, tasksPayload: TaskCreateModel[]): Promise<TaskModel[]> {
    const createTaskActor = createActor(taskStateMachine).start();
    const persistenceSnapshot = createTaskActor.getPersistedSnapshot();

    const stage = await this.stageManager.getStageEntityById(stageId);

    if (!stage) {
      this.logger.error(`Failed adding tasks to stage, stage not exists`);
      throw new StageNotFoundError(stagesErrorMessages.stageNotFound);
    }

    const checkStageStatus = createActor(stageStateMachine, { snapshot: stage.xstate }).start();

    // can't add tasks to finite stages (final states)
    if (checkStageStatus.getSnapshot().status === XSTATE_DONE_STATE) {
      this.logger.error(`Failed adding tasks to stage, not allowed on finite state of stage`);
      throw new InvalidUpdateError(stagesErrorMessages.stageAlreadyFinishedTasksError);
    }

    if (checkStageStatus.getSnapshot().value === StageOperationStatus.IN_PROGRESS) {
      this.logger.error(`Failed adding tasks to stage, not allowed on running stage`);
      throw new InvalidUpdateError(tasksErrorMessages.addTaskNotAllowed);
    }

    const taskInput = tasksPayload.map(
      (taskData) =>
        ({
          attempts: 0,
          maxAttempts: taskData.maxAttempts,
          data: taskData.data,
          xstate: persistenceSnapshot,
          userMetadata: taskData.userMetadata,
          status: TaskOperationStatus.CREATED,
          stageId,
        }) satisfies Prisma.TaskCreateManyInput
    );

    const queryBody = {
      data: taskInput,
    };

    try {
      const tasks = await this.prisma.$transaction(async (tx) => {
        const tasks = await tx.task.createManyAndReturn(queryBody);

        const updateSummaryPayload: UpdateSummaryCount = {
          add: { status: TaskOperationStatus.CREATED, count: tasks.length },
        };

        await this.stageManager.updateStageProgressFromTaskChanges(stageId, updateSummaryPayload, tx);
        return tasks;
      });

      return convertArrayPrismaTaskToTaskResponse(tasks);
    } catch (error) {
      this.logger.error(`Failed adding tasks to stage with error: ${(error as Error).message}`);

      throw error;
    }
  }

  /**
   * Retrieves tasks based on filtering criteria
   * @param params - Optional filtering parameters for tasks
   * @returns Promise resolving to array of task models
   */
  @withSpanAsyncV4
  public async getTasks(params: TasksFindCriteriaArg): Promise<TaskModel[]> {
    const hasNoParams = params === undefined || Object.keys(params).length === 0;

    const queryBody: Prisma.TaskFindManyArgs = {
      where: hasNoParams
        ? undefined
        : {
            AND: {
              stageId: { equals: params.stage_id },
              stage: { type: { equals: params.stage_type } },
              status: { equals: params.status },
              creationTime: { gte: params.from_date, lte: params.end_date },
            },
          },
    };

    const tasks = await this.prisma.task.findMany(queryBody);
    return convertArrayPrismaTaskToTaskResponse(tasks);
  }

  @withSpanAsyncV4
  public async getTaskById(taskId: string): Promise<TaskModel> {
    const task = await this.getTaskEntityById(taskId);

    if (!task) {
      throw new TaskNotFoundError(tasksErrorMessages.taskNotFound);
    }

    return convertPrismaToTaskResponse(task);
  }

  @withSpanAsyncV4
  public async getTasksByStageId(stageId: string): Promise<TaskModel[]> {
    // To validate existence of stage, if not will throw StageNotFoundError
    await this.stageManager.getStageById(stageId);

    const queryBody = {
      where: {
        stageId,
      },
    };

    const stages = await this.prisma.task.findMany(queryBody);
    const result = stages.map((stage) => convertPrismaToTaskResponse(stage));
    return result;
  }

  @withSpanAsyncV4
  public async updateUserMetadata(taskId: string, userMetadata: Record<string, unknown>): Promise<void> {
    const updateQueryBody = {
      where: {
        id: taskId,
      },
      data: {
        userMetadata,
      },
    };

    try {
      await this.prisma.task.update(updateQueryBody);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === prismaKnownErrors.recordNotFound) {
        throw new TaskNotFoundError(tasksErrorMessages.taskNotFound);
      }
      throw err;
    }
  }

  @withSpanAsyncV4
  public async updateStatus(taskId: string, status: TaskOperationStatus): Promise<TaskModel> {
    const task = await this.getTaskEntityById(taskId);

    if (!task) {
      throw new TaskNotFoundError(tasksErrorMessages.taskNotFound);
    }
    const updatedTask = await this.updateAndValidateStatus(task, status);

    return convertPrismaToTaskResponse(updatedTask);
  }

  /**
   * Dequeues a task of the specified type with highest priority
   * @param taskType - The type of task to dequeue
   * @returns The dequeued task model with updated status
   * @throws TaskNotFoundError when no suitable task is found
   */
  @withSpanAsyncV4
  public async dequeue(stageType: string): Promise<TaskModel> {
    const queryBody = generatePrioritizedTaskQuery(stageType);

    const task = await this.prisma.task.findFirst(queryBody);

    if (!task) {
      throw new TaskNotFoundError(tasksErrorMessages.taskNotFound);
    }

    const dequeuedTask = await this.updateAndValidateStatus(task, TaskOperationStatus.IN_PROGRESS);
    return convertPrismaToTaskResponse(dequeuedTask);
  }

  /**
   * This method is used to get a task entity by its id from the database.
   * @param taskId unique identifier of the task.
   * @returns The task entity if found, otherwise null.
   */
  @withSpanAsyncV4
  public async getTaskEntityById(taskId: string, tx?: PrismaTransaction): Promise<TaskPrismaObject | null> {
    const prisma = tx ?? this.prisma;
    const queryBody = {
      where: {
        id: taskId,
      },
    };

    const task = await prisma.task.findUnique(queryBody);
    return task;
  }

  /**
   * Updates a task's status with validation, handling edge cases like failures and retries.
   * @param task - The task to update
   * @param status - The target status to set
   * @returns The updated task object
   * @throws InvalidUpdateError when the status transition is invalid or update fails
   */
  @withSpanAsyncV4
  private async updateAndValidateStatus(task: TaskPrismaObject, status: TaskOperationStatus): Promise<TaskPrismaObject> {
    return this.prisma.$transaction(async (tx) => {
      const previousStatus = task.status;

      const { nextStatus, taskDataToUpdate } = this.determineNextStatus(task, status);

      const newPersistedSnapshot = updateTaskMachineState(nextStatus, task.xstate);

      // Create update query with race condition protection for IN_PROGRESS
      const updateQueryBody = {
        where: this.createUpdateWhereClause(task.id, nextStatus, previousStatus),
        data: { ...taskDataToUpdate, status: nextStatus, xstate: newPersistedSnapshot },
      };

      const updatedTasks = await tx.task.updateManyAndReturn(updateQueryBody);

      if (updatedTasks[0] === undefined) {
        throw new InvalidUpdateError(tasksErrorMessages.taskStatusUpdateFailed);
      }

      await this.updateStageSummary(task.stageId, previousStatus, nextStatus, tx);

      return updatedTasks[0];
    });
  }

  /**
   * Determines the next status for a task, handling retry logic for failed tasks.
   * @param task - The task being updated
   * @param requestedStatus - The requested status to set
   * @returns Object containing the actual next status and any data updates needed
   */
  private determineNextStatus(
    task: TaskPrismaObject,
    requestedStatus: TaskOperationStatus
  ): {
    nextStatus: TaskOperationStatus;
    taskDataToUpdate?: Record<string, unknown>;
  } {
    // Only special handling needed for FAILED status
    if (requestedStatus !== TaskOperationStatus.FAILED) {
      return { nextStatus: requestedStatus };
    }

    // Handle retry logic for failed tasks
    const shouldRetry = task.attempts < task.maxAttempts;
    const nextStatus = shouldRetry ? TaskOperationStatus.RETRIED : TaskOperationStatus.FAILED;
    const taskDataToUpdate = shouldRetry ? { attempts: task.attempts + 1 } : {};

    return { nextStatus, taskDataToUpdate };
  }

  /**
   * Creates the where clause for task updates, with race condition protection.
   * @param taskId - The ID of the task to update
   * @param nextStatus - The target status
   * @param previousStatus - The current status
   * @returns The where clause object for the update query
   */
  private createUpdateWhereClause(
    taskId: string,
    nextStatus: TaskOperationStatus,
    previousStatus: TaskOperationStatus
  ): {
    id: string;
    status?: TaskOperationStatus;
  } {
    const whereClause = { id: taskId };

    // Add status check to prevent race conditions when setting to IN_PROGRESS
    if (nextStatus === TaskOperationStatus.IN_PROGRESS) {
      return { ...whereClause, status: previousStatus };
    }

    return whereClause;
  }

  /**
   * Updates the parent stage's summary based on a task status change.
   * @param stageId - The ID of the stage containing the task
   * @param previousStatus - The previous task status
   * @param nextStatus - The new task status
   * @param tx - The transaction to use
   */
  private async updateStageSummary(
    stageId: string,
    previousStatus: TaskOperationStatus,
    nextStatus: TaskOperationStatus,
    tx: PrismaTransaction
  ): Promise<void> {
    const updateSummaryPayload: UpdateSummaryCount = {
      add: { status: nextStatus, count: 1 },
      remove: { status: previousStatus, count: 1 },
    };

    await this.stageManager.updateStageProgressFromTaskChanges(stageId, updateSummaryPayload, tx);
  }
}
