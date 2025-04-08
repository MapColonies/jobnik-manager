/* eslint-disable @typescript-eslint/naming-convention */
import { TaskType, type Prisma, type PrismaClient } from '@prisma/client';
import { createActor } from 'xstate';
import { faker } from '@faker-js/faker';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { TaskPrismaObject } from '@src/tasks/models/models';

const testStageId = faker.string.uuid();
const persistedSnapshot = createActor(stageStateMachine).start().getPersistedSnapshot();

export const createTaskRecord = async (body: Prisma.TaskCreateManyInput[], prisma: PrismaClient): Promise<TaskPrismaObject[]> => {
  const res = await prisma.task.createManyAndReturn({ data: body });
  return res;
};

export const createTaskBody = {
  stage_id: testStageId,
  type: 'DEFAULT' as TaskType,
  data: {},
  xstate: persistedSnapshot,
  userMetadata: {},
};
