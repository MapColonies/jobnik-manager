import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '@common/constants';
import type { PrismaClient, Priority, JobOperationStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { createActor } from 'xstate';
import { BAD_STATUS_CHANGE, InvalidUpdateError, prismaKnownErrors } from '../../common/errors';
import { JOB_NOT_FOUND_MSG, JobNotFoundError } from './errors';
import type { JobCreateModel, JobCreateResponse, JobModel, JobFindCriteriaArg } from './models';
import { jobStateMachine, OperationStatusMapper } from './jobStateMachine';

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
      const createJobActor = createActor(jobStateMachine).start();
      const persistenceSnapshot = createJobActor.getPersistedSnapshot();
      const input = { ...body, xstate: persistenceSnapshot } satisfies Prisma.JobCreateInput;

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
      throw new JobNotFoundError(JOB_NOT_FOUND_MSG);
    }

    return this.convertPrismaToJobResponse(job);
  }

  public async updateUserMetadata(jobId: string, userMetadata: Record<string, unknown>): Promise<void> {
    const updateQueryBody = {
      where: {
        id: jobId,
      },
      data: {
        userMetadata,
      },
    };

    try {
      await this.prisma.job.update(updateQueryBody);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === prismaKnownErrors.recordNotFound) {
        throw new JobNotFoundError(JOB_NOT_FOUND_MSG);
      }
      throw err;
    }
  }

  public async updatePriority(jobId: string, priority: Priority): Promise<void> {
    const job = await this.getJobById(jobId);

    if (job.priority === priority) {
      throw new InvalidUpdateError('Priority cannot be updated to the same value.');
    }

    const updateQueryBody = {
      where: {
        id: jobId,
      },
      data: {
        priority,
      },
    };

    await this.prisma.job.update(updateQueryBody);
  }

  public async updateStatus(jobId: string, status: JobOperationStatus): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: {
        id: jobId,
      },
    });

    if (!job) {
      throw new JobNotFoundError(JOB_NOT_FOUND_MSG);
    }

    const nextStatusChange = OperationStatusMapper[status];
    const updateActor = createActor(jobStateMachine, { snapshot: job.xstate }).start();
    const isValidStatus = updateActor.getSnapshot().can({ type: nextStatusChange });

    if (!isValidStatus) {
      throw new InvalidUpdateError(BAD_STATUS_CHANGE);
    }

    updateActor.send({ type: nextStatusChange });
    const newPersistedSnapshot = updateActor.getPersistedSnapshot();

    const updateQueryBody = {
      where: {
        id: jobId,
      },
      data: {
        status,
        xstate: newPersistedSnapshot,
      },
    };

    await this.prisma.job.update(updateQueryBody);
  }

  private convertPrismaToJobResponse(prismaObjects: Prisma.JobGetPayload<Record<string, never>>): JobModel {
    const { data, creationTime, userMetadata, expirationTime, notifications, updateTime, ttl, xstate, ...rest } = prismaObjects;

    const transformedFields = {
      data: data as Record<string, never>,
      creationTime: creationTime.toISOString(),
      userMetadata: userMetadata as Record<string, never>,
      expirationTime: expirationTime ? expirationTime.toISOString() : undefined,
      notifications: notifications as Record<string, never>,
      updateTime: updateTime.toISOString(),
      ttl: ttl ? ttl.toISOString() : undefined,
    };

    return Object.assign(rest, transformedFields);
  }
}
