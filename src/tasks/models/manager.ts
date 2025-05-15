import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createActor } from 'xstate';
import { JobMode, Prisma, StageOperationStatus, TaskOperationStatus, type PrismaClient } from '@prismaClient';
import { SERVICES, XSTATE_DONE_STATE } from '@common/constants';
import { StageManager } from '@src/stages/models/manager';
import { InvalidUpdateError, prismaKnownErrors } from '@src/common/errors';
import { StageNotFoundError, errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { taskStateMachine, updateTaskMachineState } from '@src/tasks/models/taskStateMachine';
import { JobManager } from '@src/jobs/models/manager';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { UpdateSummaryCount } from '@src/stages/models/models';
import type { TasksFindCriteriaArg, TaskModel, TaskPrismaObject, TaskCreateModel } from './models';
import { TaskNotFoundError, errorMessages as tasksErrorMessages } from './errors';
import { convertArrayPrismaTaskToTaskResponse, convertPrismaToTaskResponse } from './helper';

@injectable()
export class TaskManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(StageManager) private readonly stageManager: StageManager,
    @inject(JobManager) private readonly jobManager: JobManager
  ) {}

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

    // can't add tasks on running stage of pre-defined job
    const job = await this.jobManager.getJobById(stage.jobId);

    if (job.jobMode === JobMode.PRE_DEFINED && checkStageStatus.getSnapshot().value === StageOperationStatus.IN_PROGRESS) {
      this.logger.error(`Failed adding tasks to stage, not allowed on running stage of pre-defined job`);
      throw new InvalidUpdateError(tasksErrorMessages.addTaskNotAllowed);
    }

    const taskInput = tasksPayload.map(
      (taskData) =>
        ({
          attempts: 0,
          maxAttempts: taskData.maxAttempts,
          data: taskData.data,
          type: taskData.type,
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
      const tasks = await this.prisma.task.createManyAndReturn(queryBody);

      const updateSummaryPayload: UpdateSummaryCount = {
        add: { status: TaskOperationStatus.CREATED, count: tasks.length },
      };

      const updatedSummary = await this.stageManager.updateStageSummary(stageId, updateSummaryPayload);

      await this.stageManager.updateStageProgress(stageId, job.id, updatedSummary);

      return convertArrayPrismaTaskToTaskResponse(tasks);
    } catch (error) {
      this.logger.error(`Failed adding tasks to stage with error: ${(error as Error).message}`);

      throw error;
    }
  }

  public async getTasks(params: TasksFindCriteriaArg): Promise<TaskModel[]> {
    let queryBody = undefined;

    if (params !== undefined) {
      queryBody = {
        where: {
          AND: {
            stageId: { equals: params.stage_id },
            type: { equals: params.task_type },
            status: { equals: params.status },
            creationTime: { gte: params.from_date, lte: params.till_date },
          },
        },
      };
    }

    const tasks = await this.prisma.task.findMany(queryBody);

    const result = convertArrayPrismaTaskToTaskResponse(tasks);
    return result;
  }

  public async getTaskById(taskId: string): Promise<TaskModel> {
    const task = await this.getTaskEntityById(taskId);

    if (!task) {
      throw new TaskNotFoundError(tasksErrorMessages.taskNotFound);
    }

    return convertPrismaToTaskResponse(task);
  }

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

  public async updateStatus(taskId: string, status: TaskOperationStatus): Promise<void> {
    let nextStatus: TaskOperationStatus = status;
    let dataToUpdate = undefined;

    const task = await this.getTaskEntityById(taskId);
    if (!task) {
      throw new TaskNotFoundError(tasksErrorMessages.taskNotFound);
    }

    const previousStatus = task.status;

    if (nextStatus === TaskOperationStatus.FAILED) {
      nextStatus = task.attempts < task.maxAttempts ? TaskOperationStatus.RETRIED : TaskOperationStatus.FAILED;
      dataToUpdate = nextStatus === TaskOperationStatus.FAILED ? {} : { attempts: task.attempts + 1 };
    }

    const newPersistedSnapshot = updateTaskMachineState(nextStatus, task.xstate);

    const updateQueryBody = {
      where: {
        id: taskId,
      },
      data: { ...dataToUpdate, status: nextStatus, xstate: newPersistedSnapshot },
    };

    // update task current status
    await this.prisma.task.update(updateQueryBody);

    // update stage progress data
    const stage = await this.stageManager.getStageById(task.stageId);

    const updateSummaryPayload: UpdateSummaryCount = {
      add: { status: nextStatus, count: 1 },
      remove: { status: previousStatus, count: 1 },
    };

    const updatedSummary = await this.stageManager.updateStageSummary(task.stageId, updateSummaryPayload);

    await this.stageManager.updateStageProgress(task.stageId, stage.jobId, updatedSummary);
  }

  /**
   * This method is used to get a task entity by its id from the database.
   * @param taskId unique identifier of the task.
   * @returns The task entity if found, otherwise null.
   */
  public async getTaskEntityById(taskId: string): Promise<TaskPrismaObject | null> {
    const queryBody = {
      where: {
        id: taskId,
      },
    };

    const task = await this.prisma.task.findUnique(queryBody);

    return task;
  }
}
