/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
import { JobOperationStatus, Prisma, Stage, StageOperationStatus, TaskOperationStatus, TaskType } from '@prisma/client';
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
  name: 'DEFAULT',
  creator: 'UNKNOWN',
  data: { stages: [] },
  jobMode: 'PRE_DEFINED',
  notifications: {},
  userMetadata: {},
} satisfies JobCreateModel;

export function createJobEntity(override: Partial<JobWithStages>): JobWithStages {
  const jobEntity = {
    creationTime: new Date(),
    creator: 'UNKNOWN',
    data: {},
    expirationTime: new Date(),
    id: randomUuid,
    name: 'DEFAULT',
    notifications: {},
    percentage: 0,
    priority: 'HIGH',
    status: JobOperationStatus.PENDING,
    ttl: new Date(),
    jobMode: 'DYNAMIC',
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
    name: 'DEFAULT',
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
