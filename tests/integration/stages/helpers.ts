import { StageName, type Prisma, type PrismaClient } from '@prisma/client';
import { createActor } from 'xstate';
import { faker } from '@faker-js/faker';
import { StagePrismaObject } from '@src/stages/models/models';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';

const persistedSnapshot = createActor(stageStateMachine).start().getPersistedSnapshot();

export const createStageRecord = async (body: Prisma.StageCreateManyInput, prisma: PrismaClient): Promise<StagePrismaObject> => {
  const res = await prisma.stage.create({ data: body });
  return res;
};

export const createStageWithoutTaskBody = {
  jobId: faker.string.uuid(),
  name: StageName.DEFAULT,
  data: {},
  xstate: persistedSnapshot,
  userMetadata: {},
} satisfies Prisma.StageCreateManyInput;
