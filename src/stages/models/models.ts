import { Snapshot } from 'xstate';
import { Prisma, TaskOperationStatus } from '@prismaClient';
import type { components, operations } from '@src/openapi';
import { JobPrismaObject } from '@src/jobs/models/models';

type StageModel = components['schemas']['getStageResponse'];
type StageCreateModel = components['schemas']['createStagePayload'];
type StageCreateWithTasksModel = components['schemas']['createStageWithTasksPayload'];
type StageCreateBody = StageCreateModel & { jobId: string; xstate: Snapshot<unknown> };
type StageSummary = components['schemas']['summary'];
type StageFindCriteriaArg = operations['getStages']['parameters']['query'];
type StageIncludeJob = StagePrismaObject & { job: JobPrismaObject };
interface UpdateSummaryCount {
  add: { status: TaskOperationStatus; count: number };
  remove?: { status: TaskOperationStatus; count: number };
}

/**
 * Type definition for Stage with optional Task inclusion
 * @interface StagePrismaObject
 */
interface StagePrismaObjectBase extends Prisma.StageGetPayload<object> {
  task?: Prisma.TaskGetPayload<object>[];
  job?: Prisma.JobGetPayload<object>;
}

type StagePrismaObject = StagePrismaObjectBase;

export type {
  StageSummary,
  StageModel,
  StageFindCriteriaArg,
  StageCreateModel,
  StageCreateWithTasksModel,
  StagePrismaObject,
  StageCreateBody,
  UpdateSummaryCount,
  StageIncludeJob,
};
