import { Snapshot } from 'xstate';
import { Prisma, TaskOperationStatus } from '@prismaClient';
import type { components, operations } from '@src/openapi';
import { JobPrismaObject } from '@src/jobs/models/models';
import { PrismaTransaction } from '@src/db/types';

type StageModel = components['schemas']['getStageResponse'];
type StageCreateModel = components['schemas']['createStagePayloadRequest'];
type StageCreateBody = StageCreateModel & { jobId: string; xstate: Snapshot<unknown> };
type StageSummary = components['schemas']['summary'];
type StageFindCriteriaArg = operations['getStages']['parameters']['query'];
type StageIncludingJob = StagePrismaObject & { job: JobPrismaObject };
interface UpdateSummaryCount {
  add: { status: TaskOperationStatus; count: number };
  remove?: { status: TaskOperationStatus; count: number };
}

/**
 * Options for retrieving a stage entity
 * @interface StageEntityOptions
 */
interface StageEntityOptions {
  includeTasks?: boolean;
  includeJob?: boolean;
  tx?: PrismaTransaction;
}

/**
 * Type definition for Stage with optional Task and Job inclusion
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
  StagePrismaObject,
  StageCreateBody,
  UpdateSummaryCount,
  StageIncludingJob,
  StageEntityOptions,
};
