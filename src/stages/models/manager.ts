import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createActor } from 'xstate';
import type { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import type { PrismaClient } from '@prismaClient';
import { JobOperationStatus, Prisma, StageOperationStatus } from '@prismaClient';
import { JobManager } from '@src/jobs/models/manager';
import { SERVICES, XSTATE_DONE_STATE } from '@common/constants';
import { resolveTraceContext } from '@src/common/utils/tracingHelpers';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { illegalStatusTransitionErrorMessage, prismaKnownErrors } from '@src/common/errors';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { IllegalStageStatusTransitionError, JobInFiniteStateError, JobNotFoundError, StageNotFoundError } from '@src/common/generated/errors';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import type { PrismaTransaction } from '@src/db/types';
import { StageRepository } from '../DAL/stageRepository';
import type {
  StageCreateModel,
  StageEntityOptions,
  StageFindCriteriaArg,
  StageIncludingJob,
  StageModel,
  StageSummary,
  UpdateSummaryCount,
} from './models';
import {
  convertArrayPrismaStageToStageResponse,
  convertPrismaToStageResponse,
  defaultStatusCounts,
  getCurrentPercentage,
  getInitialXstate,
} from './helper';
import { OperationStatusMapper, stageStateMachine } from './stageStateMachine';

type GetStageEntityByIdReturnType<TOptions extends StageEntityOptions> = TOptions extends { includeTasks: true; includeJob: true }
  ? Prisma.StageGetPayload<{ include: { task: true; job: true } }>
  : TOptions extends { includeTasks: true }
    ? Prisma.StageGetPayload<{ include: { task: true } }>
    : TOptions extends { includeJob: true }
      ? Prisma.StageGetPayload<{ include: { job: true } }>
      : Prisma.StageGetPayload<Record<string, never>>;
@injectable()
export class StageManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(StageRepository) private readonly stageRepository: StageRepository,
    @inject(JobManager) private readonly jobManager: JobManager
  ) {}

  @withSpanAsyncV4
  public async addStage(jobId: string, stagePayload: StageCreateModel): Promise<StageModel> {
    const stagePersistenceSnapshot = getInitialXstate(stagePayload);

    const job = await this.jobManager.getJobEntityById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobsErrorMessages.jobNotFound);
    }

    const checkJobStatus = createActor(jobStateMachine, { snapshot: job.xstate }).start();

    // can't add stages to finite jobs (final states)
    if (checkJobStatus.getSnapshot().status === XSTATE_DONE_STATE) {
      throw new JobInFiniteStateError(jobsErrorMessages.jobAlreadyFinishedStagesError);
    }

    const { startAsWaiting, ...bodyInput } = stagePayload;
    const { traceparent, tracestate } = resolveTraceContext(stagePayload);

    const nextOrder = await this.getNextStageOrder(jobId);

    const input: Prisma.StageCreateInput = {
      ...bodyInput,
      order: nextOrder,
      summary: defaultStatusCounts,
      status: startAsWaiting === true ? StageOperationStatus.WAITING : StageOperationStatus.CREATED,
      job: {
        connect: {
          id: jobId,
        },
      },
      xstate: stagePersistenceSnapshot,
      traceparent,
      tracestate,
    };

    const queryBody: Prisma.StageCreateArgs = {
      data: input,
    };

    try {
      const stage = await this.prisma.stage.create(queryBody);

      return convertPrismaToStageResponse(stage);
    } catch (error) {
      this.logger.error(`Failed adding stage to job with error: ${(error as Error).message}`);

      throw error;
    }
  }

  @withSpanAsyncV4
  public async getStages(params: StageFindCriteriaArg): Promise<StageModel[]> {
    let queryBody = undefined;
    if (params !== undefined) {
      queryBody = {
        where: {
          AND: {
            jobId: { equals: params.job_id },
            type: { equals: params.stage_type },
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

  @withSpanAsyncV4
  public async getStageById(stageId: string, includeTasks?: boolean): Promise<StageModel> {
    const stage = await this.getStageEntityById(stageId, { includeTasks });

    if (!stage) {
      throw new StageNotFoundError(stagesErrorMessages.stageNotFound);
    }

    return convertPrismaToStageResponse(stage);
  }

  @withSpanAsyncV4
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
      orderBy: {
        order: 'asc' as const,
      },
    };

    const stages = await this.prisma.stage.findMany(queryBody);
    const result = stages.map((stage) => convertPrismaToStageResponse(stage));
    return result;
  }

  @withSpanAsyncV4
  public async getSummaryByStageId(stageId: string): Promise<StageSummary> {
    const stage = await this.getStageById(stageId);

    const summary = stage.summary;

    return summary;
  }

  @withSpanAsyncV4
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

  @withSpanAsyncV4
  public async updateStatus(stageId: string, status: StageOperationStatus, tx?: PrismaTransaction): Promise<void> {
    const prisma = tx ?? this.prisma;

    const stage = await this.getStageEntityById(stageId, { includeJob: true, tx });

    if (!stage) {
      throw new StageNotFoundError(stagesErrorMessages.stageNotFound);
    }

    const previousStageOrder = stage.order - 1;

    // can't move to PENDING if previous stage is not COMPLETED
    if (status === StageOperationStatus.PENDING && previousStageOrder > 0) {
      const previousStage = await prisma.stage.findFirst({
        where: {
          jobId: stage.jobId,
          order: previousStageOrder,
        },
      });

      if (previousStage!.status !== StageOperationStatus.COMPLETED) {
        throw new IllegalStageStatusTransitionError(`Previous stage is not ${StageOperationStatus.COMPLETED}`);
      }
    }

    const nextStatusChange = OperationStatusMapper[status];
    const updateActor = createActor(stageStateMachine, { snapshot: stage.xstate }).start();
    const isValidStatus = updateActor.getSnapshot().can({ type: nextStatusChange });

    if (!isValidStatus) {
      throw new IllegalStageStatusTransitionError(illegalStatusTransitionErrorMessage(stage.status, status));
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

    await prisma.stage.update(updateQueryBody);

    const nextStageOrder = stage.order + 1;
    // If the stage is marked as completed, and there is a next stage in the job, update the next stage status to PENDING
    if (status === StageOperationStatus.COMPLETED) {
      const nextStage = await prisma.stage.findFirst({
        where: {
          jobId: stage.jobId,
          order: nextStageOrder,
        },
      });

      /* istanbul ignore if */
      if (nextStage && nextStage.status === StageOperationStatus.CREATED) {
        await this.updateStatus(nextStage.id, StageOperationStatus.PENDING, tx);
      }
    }

    if (stage.job.status === JobOperationStatus.PENDING && status === StageOperationStatus.IN_PROGRESS) {
      // Update job status to IN_PROGRESS

      await this.jobManager.updateStatus(stage.job.id, JobOperationStatus.IN_PROGRESS, tx);
    }
  }

  /**
   * This method is used to get a stage entity by its id from the database.
   * @param stageId unique identifier of the stage.
   * @param options options for including related entities.
   * @returns The stage entity if found, otherwise null.
   *
   */
  @withSpanAsyncV4
  public async getStageEntityById<T extends StageEntityOptions>(
    stageId: string,
    options: T = {} as T
  ): Promise<null | GetStageEntityByIdReturnType<T>> {
    const prisma = options.tx ?? this.prisma;

    const queryBody = {
      where: {
        id: stageId,
      },
      include: {
        job: options.includeJob,
        task: options.includeTasks,
      },
    };

    const stage = await prisma.stage.findUnique(queryBody);
    return stage as null | GetStageEntityByIdReturnType<T>;
  }

  /**
   * This method is used to update the related columns of stage progressing .
   * @param stageId unique identifier of the stage.
   * @param summary summary object containing the current progress aggregated task data of the stage.
   */
  @withSpanAsyncV4
  public async updateStageProgressFromTaskChanges(stageId: string, summaryUpdatePayload: UpdateSummaryCount, tx: PrismaTransaction): Promise<void> {
    const stage = (await this.getStageEntityById(stageId, { includeJob: true, tx })) as StageIncludingJob;

    // update stage summary aggregated task data
    const updatedSummary = await this.stageRepository.updateStageSummary(stageId, summaryUpdatePayload, tx);

    // update stage progress percentage
    await this.updateStageProgress(stage, updatedSummary, tx);

    // update stage status if it was initialized by first task
    // and the stage is not already in progress
    if (updatedSummary.inProgress > 0 && stage.status === StageOperationStatus.PENDING) {
      await this.updateStatus(stageId, StageOperationStatus.IN_PROGRESS, tx);
    }
  }

  /**
   * This method is used to update the progress of a stage according tasks metrics.
   * @param stageId unique identifier of the stage.
   * @param summary summary object containing the current progress aggregated task data of the stage.
   */
  @withSpanAsyncV4
  private async updateStageProgress(stage: StageIncludingJob, summary: StageSummary, tx: PrismaTransaction): Promise<void> {
    const completionPercentage = getCurrentPercentage(summary);
    const stageUpdatedData: Prisma.StageUpdateInput = { percentage: completionPercentage };

    await tx.stage.update({ where: { id: stage.id }, data: stageUpdatedData });

    if (summary.total === summary.completed) {
      await this.updateStatus(stage.id, StageOperationStatus.COMPLETED, tx);
    }
  }

  /**
   *
   * @param jobId unique identifier of the job. This method retrieves the next order number for a new stage in a job.
   * It checks the maximum order number of existing stages in the job and increments it by one.
   * If no stages exist, it returns 1 as the first order number.
   * @returns The next order number for a new stage in the job.
   */
  @withSpanAsyncV4
  private async getNextStageOrder(jobId: string): Promise<number> {
    const lastStageResult = await this.prisma.stage.aggregate({
      where: { jobId },
      _max: { order: true },
    });

    if (lastStageResult._max.order === null) {
      return 1;
    }
    return lastStageResult._max.order + 1;
  }
}
