/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
import { JobOperationStatus, Prisma, Stage, StageOperationStatus } from '@prisma/client';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobCreateModel } from '@src/jobs/models/models';
import { createActor } from 'xstate';

const randomUuid = faker.string.uuid();

export interface JobWithStages extends Prisma.JobGetPayload<Record<string, unknown>> {
  Stage?: Stage[];
}

export const createJobParams = {
  name: 'DEFAULT',
  creator: 'UNKNOWN',
  data: { stages: [] },
  type: 'PRE_DEFINED',
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
    type: 'PRE_DEFINED',
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
    xstate: {
      status: 'active',
      output: undefined,
      error: undefined,
    },
  } satisfies Prisma.StageGetPayload<Record<string, never>>;
  return { ...stageEntity, ...override };
};
