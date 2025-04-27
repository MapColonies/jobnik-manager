import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createActor } from 'xstate';
import type { PrismaClient } from '@prismaClient';
import { JobMode, Prisma, StageOperationStatus, TaskOperationStatus } from '@prismaClient';
import { JobManager } from '@src/jobs/models/manager';
import { SERVICES } from '@common/constants';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { InvalidUpdateError, errorMessages as commonErrorMessages, prismaKnownErrors } from '@src/common/errors';
import { JobNotFoundError, errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { StageNotFoundError, errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { TaskCreateModel } from '@src/tasks/models/models';
import type { StageCreateWithTasksModel, StageFindCriteriaArg, StageModel, StagePrismaObject, StageSummary } from './models';
import { convertArrayPrismaStageToStageResponse, convertPrismaToStageResponse } from './helper';
import { OperationStatusMapper, stageStateMachine } from './stageStateMachine';

@injectable()
export class StageManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(JobManager) private readonly jobManager: JobManager
  ) {}

  public async addStage(jobId: string, stagePayload: StageCreateWithTasksModel): Promise<StageModel> {
    const createStageActor = createActor(stageStateMachine).start();
    const persistenceSnapshot = createStageActor.getPersistedSnapshot();

    const job = await this.jobManager.getJobEntityById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
    }

    // can add stages only on dynamic jobs
    if (job.jobMode !== JobMode.DYNAMIC) {
      throw new InvalidUpdateError(jobsErrorMessages.preDefinedJobStageModificationError);
    }

    const checkJobStatus = createActor(jobStateMachine, { snapshot: job.xstate }).start();

    // can't add stages to finite jobs (final states)
    if (checkJobStatus.getSnapshot().status === 'done') {
      throw new InvalidUpdateError(jobsErrorMessages.jobAlreadyFinishedStagesError);
    }

    const { tasks: taskReq, type, ...bodyInput } = stagePayload;

    let input: Prisma.StageCreateInput = {
      ...bodyInput,
      name: type,
      status: StageOperationStatus.CREATED,
      job: {
        connect: {
          id: jobId,
        },
      },
      xstate: persistenceSnapshot,
    };

    // will add also task creation, if exists in request
    if (taskReq !== undefined && taskReq.length > 0) {
      const tasks: TaskCreateModel[] = taskReq;
      const tasksInput = tasks.map((task) => {
        const taskFull = Object.assign(task, { xstate: persistenceSnapshot, status: TaskOperationStatus.CREATED });
        return taskFull;
      });

      input = { ...input, task: { create: tasksInput } } satisfies Prisma.StageCreateInput;
    }

    const queryBody: Prisma.StageCreateArgs = {
      data: input,
      include: {
        task: false,
      },
    };

    try {
      const stage = await this.prisma.stage.create(queryBody);

      return convertPrismaToStageResponse(stage);
    } catch (error) {
      this.logger.error(`Failed adding stage to job with error: ${(error as Error).message}`);

      throw error;
    }
  }

  public async getStages(params: StageFindCriteriaArg): Promise<StageModel[]> {
    let queryBody = undefined;
    if (params !== undefined) {
      queryBody = {
        where: {
          AND: {
            jobId: { equals: params.job_id },
            name: { equals: params.stage_type },
            status: { equals: params.stage_operation_status },
          },
        },
        include: { task: params.should_return_tasks },
      };
    }

    const stages = await this.prisma.stage.findMany(queryBody);

    const result = convertArrayPrismaStageToStageResponse(stages);
    return result;
  }

  public async getStageById(stageId: string, includeTasks?: boolean): Promise<StageModel> {
    const stage = await this.getStageEntityById(stageId, includeTasks);

    if (!stage) {
      throw new StageNotFoundError(stagesErrorMessages.stageNotFound);
    }

    return convertPrismaToStageResponse(stage);
  }

  public async getStagesByJobId(jobId: string, includeTasks?: boolean): Promise<StageModel[]> {
    // To validate existence of job, if not will throw JobNotFoundError
    await this.jobManager.getJobById(jobId);

    const queryBody = {
      where: {
        jobId,
      },
      include: {
        task: includeTasks,
      },
    };

    const stages = await this.prisma.stage.findMany(queryBody);
    const result = stages.map((stage) => convertPrismaToStageResponse(stage));
    return result;
  }

  public async getSummaryByStageId(stageId: string): Promise<StageSummary> {
    const stage = await this.getStageById(stageId);

    const summary = stage.summary;

    return summary;
  }

  public async updateUserMetadata(stageId: string, userMetadata: Record<string, unknown>): Promise<void> {
    const updateQueryBody = {
      where: {
        id: stageId,
      },
      data: {
        userMetadata,
      },
    };

    try {
      await this.prisma.stage.update(updateQueryBody);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === prismaKnownErrors.recordNotFound) {
        throw new StageNotFoundError(stagesErrorMessages.stageNotFound);
      }
      throw err;
    }
  }

  public async updateStatus(stageId: string, status: StageOperationStatus): Promise<void> {
    const stage = await this.getStageEntityById(stageId);

    if (!stage) {
      throw new StageNotFoundError(stagesErrorMessages.stageNotFound);
    }

    const nextStatusChange = OperationStatusMapper[status];
    const updateActor = createActor(stageStateMachine, { snapshot: stage.xstate }).start();
    const isValidStatus = updateActor.getSnapshot().can({ type: nextStatusChange });

    if (!isValidStatus) {
      throw new InvalidUpdateError(commonErrorMessages.invalidStatusChange);
    }

    updateActor.send({ type: nextStatusChange });
    const newPersistedSnapshot = updateActor.getPersistedSnapshot();

    const updateQueryBody = {
      where: {
        id: stageId,
      },
      data: {
        status,
        xstate: newPersistedSnapshot,
      },
    };

    await this.prisma.stage.update(updateQueryBody);
  }

  /**
   * This method is used to get a stage entity by its id from the database.
   * @param stageId unique identifier of the stage.
   * @returns The stage entity if found, otherwise null.
   */
  public async getStageEntityById(stageId: string, includeTasks?: boolean): Promise<StagePrismaObject | null> {
    const queryBody = {
      where: {
        id: stageId,
      },
      include: {
        task: includeTasks,
      },
    };

    const stage = await this.prisma.stage.findUnique(queryBody);

    return stage;
  }
}
