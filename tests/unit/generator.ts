/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
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
} from '@prisma/client';
import { createActor } from 'xstate';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobCreateModel } from '@src/jobs/models/models';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { TaskPrismaObject } from '@src/tasks/models/models';

const stageInitializedPersistedSnapshot = createActor(stageStateMachine).start().getPersistedSnapshot();

export const randomUuid = faker.string.uuid();
export interface JobWithStages extends Prisma.JobGetPayload<Record<string, unknown>> {
  Stage?: Stage[];
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

export const createStageEntity = (
  override: Partial<Prisma.StageGetPayload<Record<string, unknown>>>
): Prisma.StageGetPayload<Record<string, unknown>> => {
  const stageEntity = {
    data: {},
    name: StageName.DEFAULT,
    summary: {},
    job_id: faker.string.uuid(),
    id: faker.string.uuid(),
    status: StageOperationStatus.CREATED,
    userMetadata: {},
    percentage: 0,
    xstate: stageInitializedPersistedSnapshot,
  } satisfies Prisma.StageGetPayload<Record<string, never>>;
  return { ...stageEntity, ...override };
};

export const createTaskEntity = (override: Partial<TaskPrismaObject>): TaskPrismaObject => {
  const taskEntity = {
    data: {},
    type: TaskType.DEFAULT,
    stage_id: faker.string.uuid(),
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
