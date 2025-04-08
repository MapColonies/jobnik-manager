import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Prisma, type PrismaClient } from '@prisma/client';
import { SERVICES } from '@common/constants';
import { StageManager } from '@src/stages/models/manager';
import { prismaKnownErrors } from '@src/common/errors';
import type { TasksFindCriteriaArg, TaskModel, TaskPrismaObject } from './models';
import { TaskNotFoundError, errorMessages as tasksErrorMessages } from './errors';
import { convertArrayPrismaTaskToStageResponse, convertPrismaToTaskResponse } from './helper';

@injectable()
export class TaskManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(StageManager) private readonly stageManager: StageManager
  ) {}

  public async getTasks(params: TasksFindCriteriaArg): Promise<TaskModel[]> {
    let queryBody = undefined;

    if (params !== undefined) {
      queryBody = {
        where: {
          AND: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            stage_id: { equals: params.stage_id },
            type: { equals: params.task_type },
            status: { equals: params.status },
            creationTime: { gte: params.from_date, lte: params.till_date },
          },
        },
      };
    }

    const tasks = await this.prisma.task.findMany(queryBody);

    const result = convertArrayPrismaTaskToStageResponse(tasks);
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        stage_id: stageId,
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
