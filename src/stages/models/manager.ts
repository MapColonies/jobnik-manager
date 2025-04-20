import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import type { PrismaClient } from '@prisma/client';
import { JobMode, Prisma, StageOperationStatus } from '@prisma/client';
import { createActor } from 'xstate';
import { JobManager } from '@src/jobs/models/manager';
import { SERVICES } from '@common/constants';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { InvalidUpdateError, errorMessages as commonErrorMessages, prismaKnownErrors } from '@src/common/errors';
import { JobNotFoundError, errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { StageNotFoundError, errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import type { StageCreateModel, StageFindCriteriaArg, StageModel, StagePrismaObject, StageSummary } from './models';
import { convertArrayPrismaStageToStageResponse, convertPrismaToStageResponse } from './helper';
import { OperationStatusMapper, stageStateMachine } from './stageStateMachine';

@injectable()
export class StageManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(JobManager) private readonly jobManager: JobManager
  ) {}

  public async addStages(jobId: string, stagesPayload: StageCreateModel[]): Promise<StageModel[]> {
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

    const stageInput = stagesPayload.map(
      (stageData) =>
        ({
          data: stageData.data,
          name: stageData.type,
          xstate: persistenceSnapshot,
          userMetadata: stageData.userMetadata,
          status: StageOperationStatus.CREATED,
          jobId,
        }) satisfies Prisma.StageCreateManyInput
    );

    const queryBody = {
      data: stageInput,
    };

    try {
      const stages = await this.prisma.stage.createManyAndReturn(queryBody);

      return convertArrayPrismaStageToStageResponse(stages);
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
      };
    }

    const stages = await this.prisma.stage.findMany(queryBody);

    const result = convertArrayPrismaStageToStageResponse(stages);
    return result;
  }

  public async getStageById(stageId: string): Promise<StageModel> {
    const stage = await this.getStageEntityById(stageId);

    if (!stage) {
      throw new StageNotFoundError(stagesErrorMessages.stageNotFound);
    }

    return convertPrismaToStageResponse(stage);
  }

  public async getStagesByJobId(jobId: string): Promise<StageModel[]> {
    // To validate existence of job, if not will throw JobNotFoundError
    await this.jobManager.getJobById(jobId);

    const queryBody = {
      where: {
        jobId,
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

  /**
   * This method is used to get a stage entity by its id from the database.
   * @param stageId unique identifier of the stage.
   * @returns The stage entity if found, otherwise null.
   */
  public async getStageEntityById(stageId: string): Promise<StagePrismaObject | null> {
    const queryBody = {
      where: {
        id: stageId,
      },
    };

    const stage = await this.prisma.stage.findUnique(queryBody);

    return stage;
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
}
