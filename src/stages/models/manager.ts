import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '@common/constants';
import type { PrismaClient } from '@prisma/client';
import { JobMode, Prisma, StageOperationStatus } from '@prisma/client';
import { JobManager } from '@src/jobs/models/manager';
import { createActor } from 'xstate';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { InvalidUpdateError } from '@src/common/errors';
import { PRE_DEFINED_JOB_VIOLATION } from '@src/jobs/models/errors';
import type { StageCreateModel, StageFindCriteriaArg, StageModel, StageSummary } from './models';
import { prismaKnownErrors, StageNotFoundError } from './errors';
import { convertArrayPrismaStageToStageResponse, convertPrismaToStageResponse } from './helper';

@injectable()
export class StageManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(JobManager) private readonly jobManager: JobManager
  ) {}

  public async addStages(jobId: string, stagesPayload: StageCreateModel[]): Promise<StageModel[]> {
    // todo - use stages machine on next phase when will be implemented
    const createJobActor = createActor(jobStateMachine).start();
    const persistenceSnapshot = createJobActor.getPersistedSnapshot();

    const job = await this.jobManager.getJobById(jobId, false);

    if (job.type !== JobMode.DYNAMIC) {
      throw new InvalidUpdateError(PRE_DEFINED_JOB_VIOLATION);
    }

    const stageInput = stagesPayload.map(
      (stageData) =>
        ({
          data: stageData.data,
          name: stageData.type,
          xstate: persistenceSnapshot,
          userMetadata: stageData.userMetadata,
          status: StageOperationStatus.CREATED,
          job_id: jobId,
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
            job_id: { equals: params.job_id },
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
    const queryBody = {
      where: {
        id: stageId,
      },
    };

    const stage = await this.prisma.stage.findUnique(queryBody);

    if (!stage) {
      throw new StageNotFoundError('STAGE_NOT_FOUND');
    }

    return convertPrismaToStageResponse(stage);
  }

  public async getStagesByJobId(jobId: string): Promise<StageModel[]> {
    // To validate existence of job, if not will throw JobNotFoundError
    await this.jobManager.getJobById(jobId, false);

    const queryBody = {
      where: {
        job_id: jobId,
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
        throw new StageNotFoundError('STAGE_NOT_FOUND');
      }
      throw err;
    }
  }
}
