import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import type { PrismaClient, Priority, JobOperationStatus } from '@prisma/client';
import { Prisma, StageOperationStatus } from '@prisma/client';
import { createActor } from 'xstate';
import { SERVICES } from '@common/constants';
import { StageCreateModel } from '@src/stages/models/models';
import { convertArrayPrismaStageToStageResponse } from '@src/stages/models/helper';
import { errorMessages as commonErrorMessages, InvalidDeletionError, InvalidUpdateError, prismaKnownErrors } from '@common/errors';
import { JobNotFoundError, errorMessages as jobsErrorMessages } from './errors';
import type { JobCreateModel, JobCreateResponse, JobModel, JobFindCriteriaArg, jobPrismaObject } from './models';
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
            jobMode: { equals: params.job_mode },
            name: { equals: params.job_name },
            priority: { equals: params.priority },
            creator: { equals: params.creator },
            creationTime: { gte: params.from_date, lte: params.till_date },
          },
        },
        include: { Stage: params.should_return_stages },
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

      let input = undefined;
      let stagesInput = undefined;
      const { stages: stagesReq, ...bodyInput } = body;

      if (stagesReq !== undefined && stagesReq.length > 0) {
        const stages: StageCreateModel[] = stagesReq;
        stagesInput = stages.map((stage) => {
          const { type, ...rest } = stage;
          const stageFull = Object.assign(rest, { xstate: persistenceSnapshot, name: type, status: StageOperationStatus.CREATED });
          return stageFull;
        });

        input = { ...bodyInput, xstate: persistenceSnapshot, Stage: { create: stagesInput } } satisfies Prisma.JobCreateInput;
      } else {
        input = { ...bodyInput, xstate: persistenceSnapshot } satisfies Prisma.JobCreateInput;
      }

      const res = this.convertPrismaToJobResponse(await this.prisma.job.create({ data: input, include: { Stage: true } }));

      // todo - will added logic that extract stages on predefined and generated also stages + tasks
      this.logger.debug({ msg: 'Created new job successfully', response: res });
      return res;
    } catch (error) {
      this.logger.error(`Failed creating job with error: ${(error as Error).message}`);
      throw error;
    }
  }

  public async getJobById(jobId: string, includeStages?: boolean): Promise<JobModel> {
    const job = await this.getJobEntityById(jobId, includeStages);

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
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
        throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
      }
      throw err;
    }
  }

  public async updatePriority(jobId: string, priority: Priority): Promise<void> {
    const job = await this.getJobEntityById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
    }

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
    const job = await this.getJobEntityById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
    }

    const nextStatusChange = OperationStatusMapper[status];
    const updateActor = createActor(jobStateMachine, { snapshot: job.xstate }).start();
    const isValidStatus = updateActor.getSnapshot().can({ type: nextStatusChange });

    if (!isValidStatus) {
      throw new InvalidUpdateError(commonErrorMessages.invalidStatusChange);
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

  public async deleteJob(jobId: string): Promise<void> {
    const job = await this.getJobEntityById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
    }

    const checkJobStatus = createActor(jobStateMachine, { snapshot: job.xstate }).start();

    if (checkJobStatus.getSnapshot().status !== 'done') {
      throw new InvalidDeletionError(jobsErrorMessages.jobNotInFiniteState);
    }

    const deleteQueryBody = {
      where: {
        id: jobId,
      },
    };

    await this.prisma.job.delete(deleteQueryBody);
  }

  /**
   * This method is used to get a job entity by its id from the database.
   * @param jobId unique identifier of the job.
   * @returns The job entity if found, otherwise null.
   */
  public async getJobEntityById(jobId: string, includeStages?: boolean): Promise<jobPrismaObject | null> {
    const queryBody = {
      where: {
        id: jobId,
      },
      include: { Stage: includeStages },
    };

    const job = await this.prisma.job.findUnique(queryBody);

    return job;
  }

  private convertPrismaToJobResponse(prismaObjects: jobPrismaObject): JobModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { data, creationTime, userMetadata, expirationTime, notifications, updateTime, ttl, xstate, Stage, ...rest } = prismaObjects;
    const transformedFields = {
      data: data as Record<string, never>,
      creationTime: creationTime.toISOString(),
      userMetadata: userMetadata as { [key: string]: unknown },
      expirationTime: expirationTime ? expirationTime.toISOString() : undefined,
      notifications: notifications as Record<string, never>,
      updateTime: updateTime.toISOString(),
      ttl: ttl ? ttl.toISOString() : undefined,
      stages: Array.isArray(Stage) ? convertArrayPrismaStageToStageResponse(Stage) : undefined,
    };

    return Object.assign(rest, transformedFields);
  }
}
