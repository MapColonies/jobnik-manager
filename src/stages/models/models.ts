import { Prisma } from '@prisma/client';
import { Snapshot } from 'xstate';
import type { components, operations } from '@src/openapi';

type StageModel = components['schemas']['stageResponse'];
type StageCreateModel = components['schemas']['createStagePayload'];
// eslint-disable-next-line @typescript-eslint/naming-convention
type StageCreateBody = StageCreateModel & { job_id: string; xstate: Snapshot<unknown> };
type StageSummary = components['schemas']['summary'];
type StageFindCriteriaArg = operations['getStages']['parameters']['query'];
type StagePrismaObject = Prisma.StageGetPayload<Prisma.StageDefaultArgs>;

export type { StageSummary, StageModel, StageFindCriteriaArg, StageCreateModel, StagePrismaObject, StageCreateBody };
