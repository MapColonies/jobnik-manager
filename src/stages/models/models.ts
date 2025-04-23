import { Snapshot } from 'xstate';
import { Prisma } from '@prismaClient';
import type { components, operations } from '@src/openapi';

type StageModel = components['schemas']['stageResponse'];
type StageCreateModel = components['schemas']['createStagePayload'];
type StageCreateBody = StageCreateModel & { jobId: string; xstate: Snapshot<unknown> };
type StageSummary = components['schemas']['summary'];
type StageFindCriteriaArg = operations['getStages']['parameters']['query'];
type StagePrismaObject = Prisma.StageGetPayload<Prisma.StageDefaultArgs>;

export type { StageSummary, StageModel, StageFindCriteriaArg, StageCreateModel, StagePrismaObject, StageCreateBody };
