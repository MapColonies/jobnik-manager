import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createActor } from 'xstate';
import type { PrismaClient } from '@prismaClient';
import { JobMode, JobOperationStatus, Prisma, StageOperationStatus, TaskOperationStatus } from '@prismaClient';
import { JobManager } from '@src/jobs/models/manager';
import { SERVICES, XSTATE_DONE_STATE } from '@common/constants';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { InvalidUpdateError, errorMessages as commonErrorMessages, prismaKnownErrors } from '@src/common/errors';
import { JobNotFoundError, errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { StageNotFoundError, errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { TaskCreateModel } from '@src/tasks/models/models';
import { taskStateMachine } from '@src/tasks/models/taskStateMachine';
import { PrismaTransaction } from '@src/db/types';
import { StageRepository } from '../DAL/stageRepository';
import type {
  StageCreateWithTasksModel,
  StageFindCriteriaArg,
  StageIncludingJob,
  StageModel,
  StagePrismaObject,
  StageSummary,
  UpdateSummaryCount,
} from './models';
import {
  convertArrayPrismaStageToStageResponse,
  convertPrismaToStageResponse,
  defaultStatusCounts,
  getCurrentPercentage,
  summaryCountsMapper,
  taskOperationStatusWithTotal,
} from './helper';
import { OperationStatusMapper, stageStateMachine } from './stageStateMachine';

@injectable()
export class StageManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(StageRepository) private readonly stageRepository: StageRepository,
    @inject(JobManager) private readonly jobManager: JobManager
  ) {}

  public async addStage(jobId: string, stagePayload: StageCreateWithTasksModel): Promise<StageModel> {
    const createStageActor = createActor(stageStateMachine).start();
    const stagePersistenceSnapshot = createStageActor.getPersistedSnapshot();

    const createTaskActor = createActor(taskStateMachine).start();
    const taskPersistenceSnapshot = createTaskActor.getPersistedSnapshot();

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
    if (checkJobStatus.getSnapshot().status === XSTATE_DONE_STATE) {
      throw new InvalidUpdateError(jobsErrorMessages.jobAlreadyFinishedStagesError);
    }

    const { tasks: taskReq, type, ...bodyInput } = stagePayload;

    let input: Prisma.StageCreateInput = {
      ...bodyInput,
      name: type,
      summary: {
        ...defaultStatusCounts,
        [summaryCountsMapper[taskOperationStatusWithTotal.CREATED]]: taskReq?.length ?? 0,
        [summaryCountsMapper[taskOperationStatusWithTotal.TOTAL]]: taskReq?.length ?? 0,
      },
      status: StageOperationStatus.CREATED,
      job: {
        connect: {
          id: jobId,
        },
      },
      xstate: stagePersistenceSnapshot,
    };

    // will add also task creation, if exists in request
    if (taskReq !== undefined && taskReq.length > 0) {
      const tasks: TaskCreateModel[] = taskReq;
      const tasksInput = tasks.map((task) => {
        const taskFull = { ...task, xstate: taskPersistenceSnapshot, status: TaskOperationStatus.CREATED };

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
    const stage = await this.getStageEntityById(stageId, { includeTasks });

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

  public async updateStatus(stageId: string, status: StageOperationStatus, tx?: PrismaTransaction): Promise<void> {
    const prisma = tx ?? this.prisma;

    const stage = await this.getStageEntityById(stageId, { includeJob: true, tx });

    if (!stage) {
      throw new StageNotFoundError(stagesErrorMessages.stageNotFound);
    }

    if (!stage.job) {
      throw new StageNotFoundError(stagesErrorMessages.missingJobProperty);
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

    await prisma.stage.update(updateQueryBody);

    if (stage.job.status === JobOperationStatus.PENDING && status === StageOperationStatus.IN_PROGRESS) {
      // Update job status to IN_PROGRESS
      await this.jobManager.updateStatus(stage.job.id, JobOperationStatus.IN_PROGRESS, tx);
    }
  }

  /**
   * This method is used to get a stage entity by its id from the database.
   * @param stageId unique identifier of the stage.
   * @returns The stage entity if found, otherwise null.
   */
  public async getStageEntityById(
    stageId: string,
    options: { includeTasks?: boolean; includeJob?: boolean; tx?: PrismaTransaction } = {}
  ): Promise<StagePrismaObject | null> {
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
    return stage;
  }

  /**
   * This method is used to update the related columns of stage progressing .
   * @param stageId unique identifier of the stage.
   * @param summary summary object containing the current progress aggregated task data of the stage.
   */
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
  private async updateStageProgress(stage: StageIncludingJob, summary: StageSummary, tx: PrismaTransaction): Promise<void> {
    const completionPercentage = getCurrentPercentage(summary);
    const stageUpdatedData: Prisma.StageUpdateInput = { percentage: completionPercentage };

    await tx.stage.update({ where: { id: stage.id }, data: stageUpdatedData });

    if (summary.total === summary.completed && stage.job.jobMode === JobMode.PRE_DEFINED) {
      await this.updateStatus(stage.id, StageOperationStatus.COMPLETED, tx);
    }
  }
}
