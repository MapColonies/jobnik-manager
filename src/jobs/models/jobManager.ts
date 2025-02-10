import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '@common/constants';
import type { PrismaClient, Priority, OperationStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { JobCreateModel, JobCreateResponse, JobModel, JobFindCriteriaArg } from './models';
import { JobNotFoundError } from './errors';

@injectable()
export class JobManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient
  ) {}

  public async getJobs(params: JobFindCriteriaArg): Promise<JobModel[]> {
    let queryBody = undefined;
    if (params !== undefined) {
      queryBody = {
        where: {
          AND: {
            type: { equals: params.job_mode },
            name: { equals: params.job_name },
            priority: { equals: params.priority },
            creator: { equals: params.creator },
            creationTime: { gte: params.from_date, lte: params.till_date },
          },
        },
      };
    }

    const jobs = await this.prisma.job.findMany(queryBody);
    const result = jobs.map((job) => this.convertPrismaToJobResponse(job));
    return result;
  }

  public async createJob(body: JobCreateModel): Promise<JobCreateResponse> {
    try {
      const input: Prisma.JobCreateInput = { data: body.data };
      const res = this.convertPrismaToJobResponse(await this.prisma.job.create({ data: input }));

      // todo - will added logic that extract stages on predefined and generated also stages + tasks
      this.logger.debug({ msg: 'Created new job successfully', response: res });
      return res;
    } catch (error) {
      this.logger.error(`Failed creating job with error: ${(error as Error).message}`);
      throw error;
    }
  }

  public async getJobById(jobId: string): Promise<JobModel> {
    const queryBody = {
      where: {
        id: jobId,
      },
    };

    const job = await this.prisma.job.findUnique(queryBody);

    if (!job) {
      throw new JobNotFoundError('JOB_NOT_FOUND');
    }

    return this.convertPrismaToJobResponse(job);
  }

  public async updateUserMetadata(jobId: string, userMetadata: Record<string, unknown>): Promise<void> {
    const updateQueryBody = {
      where: {
        id: jobId,
      },
      data: {
        userMetadata: userMetadata,
      },
    };

    try {
      await this.prisma.job.update(updateQueryBody);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new JobNotFoundError('JOB_NOT_FOUND');
      }
      throw err;
    }
  }

  public async updatePriority(jobId: string, priority: Priority): Promise<void> {
    const updateQueryBody = {
      where: {
        id: jobId,
      },
      data: {
        priority,
      },
    };

    try {
      await this.prisma.job.update(updateQueryBody);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new JobNotFoundError('JOB_NOT_FOUND');
      }
      throw err;
    }
  }

  public async updateStatus(jobId: string, status: OperationStatus): Promise<void> {
    const updateQueryBody = {
      where: {
        id: jobId,
      },
      data: {
        status,
      },
    };

    try {
      await this.prisma.job.update(updateQueryBody);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new JobNotFoundError('JOB_NOT_FOUND');
      }
      throw err;
    }
  }

  private convertPrismaToJobResponse(prismaObjects: Prisma.JobGetPayload<Record<string, never>>): JobModel {
    const jobObject: JobModel = {
      type: prismaObjects.type,
      creator: prismaObjects.creator,
      data: prismaObjects.data as Record<string, never>,
      id: prismaObjects.id,
      creationTime: prismaObjects.creationTime.toISOString(),
      userMetadata: prismaObjects.userMetadata as Record<string, never>,
      expirationTime: prismaObjects.expirationTime ? prismaObjects.expirationTime.toISOString() : undefined,
      name: prismaObjects.name,
      notifications: prismaObjects.notifications as Record<string, never>,
      percentage: prismaObjects.percentage,
      updateTime: prismaObjects.updateTime.toISOString(),
      priority: prismaObjects.priority,
      status: prismaObjects.status,
      ttl: prismaObjects.ttl ? prismaObjects.ttl.toISOString() : undefined,
    };

    return jobObject;
  }
}
