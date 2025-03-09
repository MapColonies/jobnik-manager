import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '@common/constants';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { JobNotFoundError } from '@src/jobs/models/errors';
import type { StageFindCriteriaArg, StageModel, StageSummary } from './models';
import { prismaKnownErrors, StageNotFoundError } from './errors';

@injectable()
export class StageManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient
  ) {}

  public async getStages(params: StageFindCriteriaArg): Promise<StageModel[]> {
    let queryBody = undefined;
    if (params !== undefined) {
      queryBody = {
        where: {
          AND: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            job_id: { equals: params.job_id },
            name: { equals: params.stage_type },
            status: { equals: params.stage_operation_status },
          },
        },
      };
    }

    const stages = await this.prisma.stage.findMany(queryBody);

    const result = stages.map((stage) => this.convertPrismaToStageResponse(stage));
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

    return this.convertPrismaToStageResponse(stage);
  }

  public async getStagesByJobId(jobId: string): Promise<StageModel[]> {
    const queryBody = {
      where: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        job_id: jobId,
      },
    };

    const job = await this.prisma.job.findUnique({
      where: {
        id: jobId,
      },
    });

    if (!job) {
      throw new JobNotFoundError('JOB_NOT_FOUND');
    }

    const stages = await this.prisma.stage.findMany(queryBody);
    const result = stages.map((stage) => this.convertPrismaToStageResponse(stage));
    return result;
  }

  public async getSummaryByStageId(stageId: string): Promise<StageSummary> {
    const queryBody = {
      where: {
        id: stageId,
      },
    };

    const stage = await this.prisma.stage.findUnique(queryBody);

    if (!stage) {
      throw new StageNotFoundError('STAGE_NOT_FOUND');
    }

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

  private convertPrismaToStageResponse(prismaObjects: Prisma.StageGetPayload<Record<string, never>>): StageModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { data, job_id, userMetadata, summary, xstate, name, ...rest } = prismaObjects;
    const transformedFields = {
      data: data as Record<string, unknown>,
      userMetadata: userMetadata as Record<string, never>,
      summary: summary as Record<string, never>,
      type: name,
      jobId: job_id,
    };
    return Object.assign(rest, transformedFields);
  }
}
