import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createActor } from 'xstate';
import { JobMode, Prisma, StageOperationStatus, TaskOperationStatus, type PrismaClient } from '@prismaClient';
import { SERVICES } from '@common/constants';
import { StageManager } from '@src/stages/models/manager';
import { InvalidUpdateError, prismaKnownErrors } from '@src/common/errors';
import { StageNotFoundError, errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { taskStateMachine, OperationStatusMapper as TaskOperationStatusMapper } from '@src/tasks/models/taskStateMachine';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobManager } from '@src/jobs/models/manager';
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

    const checkStageStatus = createActor(jobStateMachine, { snapshot: stage.xstate }).start();

    // can't add tasks to finite stages (final states)
    if (checkStageStatus.getSnapshot().status === 'done') {
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
