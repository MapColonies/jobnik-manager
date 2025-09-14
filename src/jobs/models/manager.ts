import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createActor } from 'xstate';
import type { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { Gauge } from 'prom-client';
import type { Registry } from 'prom-client';
import type { PrismaClient, Priority } from '@prismaClient';
import { Prisma, JobOperationStatus } from '@prismaClient';
import { SERVICES } from '@common/constants';
import { convertArrayPrismaStageToStageResponse } from '@src/stages/models/helper';
import { illegalStatusTransitionErrorMessage, prismaKnownErrors } from '@common/errors';
import { type PrismaTransaction } from '@src/db/types';
import { resolveTraceContext } from '@src/common/utils/tracingHelpers';
import { IllegalJobStatusTransitionError, JobNotInFiniteStateError, JobNotFoundError } from '@src/common/generated/errors';
import { errorMessages as jobsErrorMessages, SamePriorityChangeError } from './errors';
import type { JobCreateModel, JobModel, JobFindCriteriaArg, JobPrismaObject } from './models';
import { jobStateMachine, OperationStatusMapper } from './jobStateMachine';

@injectable()
export class JobManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    // Initialize the in-progress jobs gauge metric
    /* istanbul ignore next */
    this.initializeInProgressJobsGauge();
  }

  @withSpanAsyncV4
  public async getJobs(params: JobFindCriteriaArg): Promise<JobModel[]> {
    let queryBody = undefined;

    if (params !== undefined) {
      queryBody = {
        where: {
          AND: {
            name: { equals: params.job_name },
            priority: { equals: params.priority },
            creationTime: { gte: params.from_date, lte: params.end_date },
          },
        },
        include: { stage: params.should_return_stages },
      };
    }

    const jobs = await this.prisma.job.findMany(queryBody);

    const result = jobs.map((job) => this.convertPrismaToJobResponse(job));
    return result;
  }

  @withSpanAsyncV4
  public async createJob(body: JobCreateModel): Promise<JobModel> {
    try {
      const createJobActor = createActor(jobStateMachine).start();
      const persistenceSnapshot = createJobActor.getPersistedSnapshot();

      const { traceparent, tracestate } = resolveTraceContext(body);

      const input = {
        ...body,
        xstate: persistenceSnapshot,
        traceparent,
        tracestate,
      } satisfies Prisma.JobCreateInput;
      const createdJob = await this.prisma.job.create({ data: input, include: { stage: false } });
      const res = this.convertPrismaToJobResponse(createdJob);

      this.logger.debug({ msg: 'Created new job successfully', response: res });
      return res;
    } catch (error) {
      this.logger.error(`Failed creating job with error: ${(error as Error).message}`);
      throw error;
    }
  }

  @withSpanAsyncV4
  public async getJobById(jobId: string, includeStages?: boolean): Promise<JobModel> {
    const job = await this.getJobEntityById(jobId, { includeStages });

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
    }

    return this.convertPrismaToJobResponse(job);
  }

  @withSpanAsyncV4
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

  @withSpanAsyncV4
  public async updatePriority(jobId: string, priority: Priority): Promise<void> {
    const job = await this.getJobEntityById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
    }

    if (job.priority === priority) {
      throw new SamePriorityChangeError(jobsErrorMessages.priorityCannotBeUpdatedToSameValue);
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

  @withSpanAsyncV4
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
      throw new IllegalJobStatusTransitionError(illegalStatusTransitionErrorMessage(job.status, status));
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

  @withSpanAsyncV4
  public async deleteJob(jobId: string): Promise<void> {
    const job = await this.getJobEntityById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
    }

    const checkJobStatus = createActor(jobStateMachine, { snapshot: job.xstate }).start();

    if (checkJobStatus.getSnapshot().status !== 'done') {
      throw new JobNotInFiniteStateError(jobsErrorMessages.jobNotInFiniteState);
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
   * @param options Configuration options for the query
   * @returns The job entity if found, otherwise null.
   */
  @withSpanAsyncV4
  public async getJobEntityById<IncludeStages extends boolean = false>(
    jobId: string,
    options: { includeStages?: IncludeStages; tx?: PrismaTransaction } = {}
  ): Promise<JobPrismaObject<IncludeStages> | null> {
    const prisma = options.tx ?? this.prisma;
    const queryBody = {
      where: {
        id: jobId,
      },
      include: { stage: options.includeStages },
    };

    const job = await prisma.job.findUnique(queryBody);

    return job as JobPrismaObject<IncludeStages> | null;
  }

  /**
   * Gets the count of in-progress jobs
   * @returns Promise<number> - The number of jobs currently in progress
   */
  @withSpanAsyncV4
  private async getInProgressJobsCount(): Promise<number> {
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test') return 0;

    /* istanbul ignore next */
    const count = await this.prisma.job.count({
      /* istanbul ignore next */
      where: {
        /* istanbul ignore next */
        status: JobOperationStatus.IN_PROGRESS,
      },
    });
    /* istanbul ignore next */
    return count;
  }

  /**
   * Initializes and registers a gauge metric for tracking in-progress jobs count
   */
  /* istanbul ignore next */
  private initializeInProgressJobsGauge(): void {
    // Check if the gauge already exists to prevent duplicate registration
    const existingGauge = this.metricsRegistry.getSingleMetric('jobs_running_states');
    if (existingGauge) {
      // Gauge already registered, no need to create another one
      return;
    }

    const self = this; // eslint-disable-line @typescript-eslint/no-this-alias

    new Gauge({
      name: 'jobs_running_states',
      help: 'Current number of jobs in running states',
      labelNames: ['status'],
      registers: [this.metricsRegistry],
      async collect(this: Gauge): Promise<void> {
        const startTime = Date.now();
        try {
          // Get the count of in-progress jobs
          const count = await self.getInProgressJobsCount();
          this.set({ status: 'IN_PROGRESS' }, count);

          self.logger.debug({
            msg: 'In-progress jobs gauge updated successfully',
            count,
            executionTimeMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          // Log errors to help with debugging
          self.logger.error({
            msg: 'Failed to update in-progress jobs gauge',
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTimeMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
          // Set to 0 on error to avoid completely breaking metrics
          this.set({ status: 'IN_PROGRESS' }, 0);
        }
      },
    });
  }
  /**
   * Converts a Prisma job object to a job response model
   * @param prismaObjects - The Prisma job object with or without stages
   * @returns The converted job model
   */
  private convertPrismaToJobResponse(prismaObjects: JobPrismaObject<true>): JobModel;
  private convertPrismaToJobResponse(prismaObjects: JobPrismaObject<false>): JobModel;
  private convertPrismaToJobResponse(prismaObjects: JobPrismaObject): JobModel {
    const { data, creationTime, userMetadata, updateTime, tracestate, xstate, stage, ...rest } = prismaObjects;

    const transformedFields = {
      data: data as Record<string, never>,
      creationTime: creationTime.toISOString(),
      userMetadata: userMetadata as { [key: string]: unknown },
      updateTime: updateTime.toISOString(),
      tracestate: tracestate ?? undefined,
      stages: Array.isArray(stage) ? convertArrayPrismaStageToStageResponse(stage) : undefined,
    };

    return Object.assign(rest, transformedFields);
  }
}
