import { faker } from '@faker-js/faker';
import { createActor } from 'xstate';
import {
  Creator,
  JobMode,
  JobName,
  JobOperationStatus,
  Priority,
  Prisma,
  Stage,
  StageName,
  StageOperationStatus,
  TaskOperationStatus,
  TaskType,
} from '@prismaClient';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobCreateModel } from '@src/jobs/models/models';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { TaskPrismaObject } from '@src/tasks/models/models';
import { StagePrismaObject } from '@src/stages/models/models';

const stageInitializedPersistedSnapshot = createActor(stageStateMachine).start().getPersistedSnapshot();

export const randomUuid = faker.string.uuid();
export interface JobWithStages extends Prisma.JobGetPayload<Record<string, unknown>> {
  stage?: Stage[];
}

export const createJobParams = {
  name: JobName.DEFAULT,
  creator: Creator.UNKNOWN,
  data: { stages: [] },
  jobMode: JobMode.PRE_DEFINED,
  notifications: {},
  userMetadata: {},
} satisfies JobCreateModel;

export function createJobEntity(override: Partial<JobWithStages>): JobWithStages {
  const jobEntity = {
    creationTime: new Date(),
    creator: Creator.UNKNOWN,
    data: {},
    expirationTime: new Date(),
    id: randomUuid,
    name: JobName.DEFAULT,
    notifications: {},
    percentage: 0,
    priority: Priority.HIGH,
    status: JobOperationStatus.PENDING,
    ttl: new Date(),
    jobMode: JobMode.DYNAMIC,
    updateTime: new Date(),
    userMetadata: {},
    xstate: createActor(jobStateMachine).start().getPersistedSnapshot(),
  } satisfies JobWithStages;
  return { ...jobEntity, ...override };
}

export const createStageEntity = (override: Partial<StagePrismaObject>): StagePrismaObject => {
  const stageEntity = {
    data: {},
    name: StageName.DEFAULT,
    summary: {},
    jobId: faker.string.uuid(),
    id: faker.string.uuid(),
    status: StageOperationStatus.CREATED,
    userMetadata: {},
    percentage: 0,
    xstate: stageInitializedPersistedSnapshot,
  } satisfies StagePrismaObject;
  return { ...stageEntity, ...override };
};

export const createTaskEntity = (override: Partial<TaskPrismaObject>): TaskPrismaObject => {
  const taskEntity = {
    data: {},
    type: TaskType.DEFAULT,
    stageId: faker.string.uuid(),
    id: faker.string.uuid(),
    status: TaskOperationStatus.CREATED,
    userMetadata: {},
    attempts: 0,
    creationTime: new Date(),
    updateTime: new Date(),
    //replace with task xstate machine once implemented
    xstate: stageInitializedPersistedSnapshot,
  } satisfies TaskPrismaObject;
  return { ...taskEntity, ...override };
};
