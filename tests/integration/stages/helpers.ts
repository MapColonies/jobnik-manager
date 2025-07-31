import { createActor } from 'xstate';
import { faker } from '@faker-js/faker';
import { type Prisma, type PrismaClient } from '@prismaClient';
import { StagePrismaObject } from '@src/stages/models/models';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { JobPrismaObject } from '@src/jobs/models/models';

const persistedSnapshot = createActor(stageStateMachine).start().getPersistedSnapshot();

/**
 * Adding job record
 * @param body - prisma job create body
 * @param prisma - prisma client
 * @returns job record with related stages
 */
export const addJobRecord = async (body: Prisma.JobCreateInput, prisma: PrismaClient): Promise<JobPrismaObject> => {
  const res = await prisma.job.create({
    data: body,
    include: { stage: true },
  });
  return res;
};

/**
 * adding stage record to exists job
 * @param body prisma stage create body
 * @param prisma prisma client
 * @returns
 */
export const addStageRecord = async (body: Prisma.StageCreateManyInput, prisma: PrismaClient): Promise<StagePrismaObject> => {
  const res = await prisma.stage.create({ data: body });
  return res;
};

export const createStageBody = {
  jobId: faker.string.uuid(),
  type: 'UNKNOWN',
  data: {},
  summary: defaultStatusCounts,
  xstate: persistedSnapshot,
  userMetadata: {},
  order: 1,
  traceparent: '00-00000000000000000000000000000000-0000000000000000-00',
  tracestate: null,
} satisfies Prisma.StageCreateManyInput;
