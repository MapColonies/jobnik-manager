import { createActor } from 'xstate';
import { faker } from '@faker-js/faker';
import { type Prisma, type PrismaClient } from '@prismaClient';
import {} from '@src/stages/models/stageStateMachine';
import { TaskPrismaObject } from '@src/tasks/models/models';
import { taskStateMachine } from '@src/tasks/models/taskStateMachine';

const persistedSnapshot = createActor(taskStateMachine).start().getPersistedSnapshot();

export const createTaskRecords = async (body: Prisma.TaskCreateManyInput[], prisma: PrismaClient): Promise<TaskPrismaObject[]> => {
  const res = await prisma.task.createManyAndReturn({ data: body });
  return res;
};

export const createTaskBody = {
  stageId: faker.string.uuid(),
  data: {},
  xstate: persistedSnapshot,
  userMetadata: {},
} satisfies Prisma.TaskCreateManyInput;
