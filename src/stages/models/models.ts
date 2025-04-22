import { Prisma } from '@prisma/client';
import { Snapshot } from 'xstate';
import type { components, operations } from '@src/openapi';

type StageModel = components['schemas']['stageResponse'];
type StageCreateModel = components['schemas']['createStagePayload'];
type StageCreateWithTasksModel = components['schemas']['createStageWithTasksPayload'];
// eslint-disable-next-line @typescript-eslint/naming-convention
type StageCreateBody = StageCreateModel & { job_id: string; xstate: Snapshot<unknown> };
type StageSummary = components['schemas']['summary'];
type StageFindCriteriaArg = operations['getStages']['parameters']['query'];
/**
 * Type definition for Stage with optional Task inclusion
 * @interface StagePrismaObject
 */
interface StagePrismaObjectBase extends Prisma.StageGetPayload<object> {
  task?: Prisma.TaskGetPayload<object>[];
}

type StagePrismaObject = StagePrismaObjectBase;
export type { StageSummary, StageModel, StageFindCriteriaArg, StageCreateModel, StageCreateWithTasksModel, StagePrismaObject, StageCreateBody };
