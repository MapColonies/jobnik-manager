import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createActor } from 'xstate';
import type { PrismaClient, Priority, JobOperationStatus } from '@prismaClient';
import { Prisma, StageOperationStatus } from '@prismaClient';
import { SERVICES } from '@common/constants';
import { StageCreateModel } from '@src/stages/models/models';
import { convertArrayPrismaStageToStageResponse, defaultStatusCounts, getInitialXstate } from '@src/stages/models/helper';
import { errorMessages as commonErrorMessages, InvalidDeletionError, InvalidUpdateError, prismaKnownErrors } from '@common/errors';
import { PrismaTransaction } from '@src/db/types';
import { JobNotFoundError, errorMessages as jobsErrorMessages } from './errors';
import type { JobCreateModel, JobCreateResponse, JobModel, JobFindCriteriaArg, JobPrismaObject } from './models';
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
            name: { equals: params.job_name },
            priority: { equals: params.priority },
            creationTime: { gte: params.from_date, lte: params.till_date },
          },
        },
        include: { stage: params.should_return_stages },
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
          const { type, startAsWaiting, ...rest } = stage;
          const stageFull = Object.assign(rest, {
            xstate: getInitialXstate(stage),
            name: type,
            status: startAsWaiting === true ? StageOperationStatus.WAITING : StageOperationStatus.CREATED,
            summary: defaultStatusCounts,
          });
          return stageFull;
        });

        input = { ...bodyInput, xstate: persistenceSnapshot, stage: { create: stagesInput } } satisfies Prisma.JobCreateInput;
      } else {
        input = { ...bodyInput, xstate: persistenceSnapshot } satisfies Prisma.JobCreateInput;
      }

      const res = this.convertPrismaToJobResponse(await this.prisma.job.create({ data: input, include: { stage: true } }));

      // todo - will added logic that extract stages on predefined and generated also stages + tasks
      this.logger.debug({ msg: 'Created new job successfully', response: res });
      return res;
    } catch (error) {
      this.logger.error(`Failed creating job with error: ${(error as Error).message}`);
      throw error;
    }
  }

  public async getJobById(jobId: string, includeStages?: boolean): Promise<JobModel> {
    const job = await this.getJobEntityById(jobId, { includeStages });

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

  public async updateStatus(jobId: string, status: JobOperationStatus, tx?: PrismaTransaction): Promise<void> {
    const prisma = tx ?? this.prisma;

    const job = await this.getJobEntityById(jobId, { tx });

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

    await prisma.job.update(updateQueryBody);
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
  public async getJobEntityById(jobId: string, options: { includeStages?: boolean; tx?: PrismaTransaction } = {}): Promise<JobPrismaObject | null> {
    const prisma = options.tx ?? this.prisma;
    const queryBody = {
      where: {
        id: jobId,
      },
      include: { stage: options.includeStages },
    };

    const job = await prisma.job.findUnique(queryBody);

    return job;
  }

  private convertPrismaToJobResponse(prismaObjects: JobPrismaObject): JobModel {
    const { data, creationTime, userMetadata, updateTime, xstate, stage, ...rest } = prismaObjects;
    const transformedFields = {
      data: data as Record<string, never>,
      creationTime: creationTime.toISOString(),
      userMetadata: userMetadata as { [key: string]: unknown },
      updateTime: updateTime.toISOString(),
      stages: Array.isArray(stage) ? convertArrayPrismaStageToStageResponse(stage) : undefined,
    };

    return Object.assign(rest, transformedFields);
  }
}
