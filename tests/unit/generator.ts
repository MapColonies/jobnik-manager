import { faker } from '@faker-js/faker';
import { createActor } from 'xstate';
import { JobName, JobOperationStatus, Priority, Prisma, Stage, StageOperationStatus, Task, TaskOperationStatus } from '@prismaClient';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobCreateModel } from '@src/jobs/models/models';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { TaskPrismaObject } from '@src/tasks/models/models';
import { taskStateMachine } from '@src/tasks/models/taskStateMachine';
import { defaultStatusCounts } from '@src/stages/models/helper';

const stageInitializedPersistedSnapshot = createActor(stageStateMachine).start().getPersistedSnapshot();
const taskInitializedPersistedSnapshot = createActor(taskStateMachine).start().getPersistedSnapshot();

export const randomUuid = faker.string.uuid();
export interface JobWithStages extends Prisma.JobGetPayload<Record<string, unknown>> {
  stage?: Stage[];
}
export interface StageWithTasks extends Prisma.StageGetPayload<Record<string, unknown>> {
  task?: Task[];
}

export const createJobParams = {
  name: JobName.DEFAULT,
  data: { stages: [] },
  userMetadata: {},
} satisfies JobCreateModel;

export function createJobEntity(override: Partial<JobWithStages>): JobWithStages {
  const jobEntity = {
    creationTime: new Date(),
    data: {},
    id: randomUuid,
    name: JobName.DEFAULT,
    percentage: 0,
    priority: Priority.HIGH,
    status: JobOperationStatus.PENDING,
    updateTime: new Date(),
    userMetadata: {},
    xstate: createActor(jobStateMachine).start().getPersistedSnapshot(),
  } satisfies JobWithStages;
  return { ...jobEntity, ...override };
}
export const createStageEntity = (override: Partial<StageWithTasks>): StageWithTasks => {
  const stageEntity = {
    data: {},
    name: 'DEFAULT_TEST_STAGE_NAME',
    summary: defaultStatusCounts,
    jobId: faker.string.uuid(),
    id: faker.string.uuid(),
    status: StageOperationStatus.CREATED,
    userMetadata: {},
    percentage: 0,
    xstate: stageInitializedPersistedSnapshot,
    task: undefined,
  } satisfies StageWithTasks;

  return { ...stageEntity, ...override };
};

export const createTaskEntity = (override: Partial<TaskPrismaObject>): TaskPrismaObject => {
  const taskEntity = {
    data: {},
    stageId: faker.string.uuid(),
    id: faker.string.uuid(),
    status: TaskOperationStatus.CREATED,
    userMetadata: {},
    attempts: 0,
    maxAttempts: 0,
    creationTime: new Date(),
    updateTime: new Date(),
    xstate: taskInitializedPersistedSnapshot,
  } satisfies TaskPrismaObject;
  return { ...taskEntity, ...override };
};
