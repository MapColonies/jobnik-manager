/* eslint-disable @typescript-eslint/naming-convention */
import { StageOperationStatus, type Prisma, type PrismaClient } from '@prisma/client';
import { createActor } from 'xstate';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { StageCreateModel } from '@src/stages/models/models';
import { JobCreateModel } from '@src/jobs/models/models';
import { faker } from '@faker-js/faker';

export const createJobRecord = async (body: JobCreateModel, prisma: PrismaClient): Promise<Prisma.JobGetPayload<Record<string, never>>> => {
  const persistedSnapshot = createActor(jobStateMachine).start().getPersistedSnapshot();

  let input = undefined;
  let stagesInput = undefined;

  if (body.data.stages !== undefined && body.data.stages.length > 0) {
    const stages: StageCreateModel[] = body.data.stages;
    stagesInput = stages.map((stage) => {
      const { type, ...rest } = stage;

      const stageFull = Object.assign(rest, { xstate: persistedSnapshot, name: type, status: StageOperationStatus.CREATED });
      return stageFull;
    });
    input = { ...body, xstate: persistedSnapshot, Stage: { create: stagesInput } } satisfies Prisma.JobCreateInput;
  } else {
    input = { ...body, xstate: persistedSnapshot } satisfies Prisma.JobCreateInput;
  }

  const res = await prisma.job.create({ data: input, include: { Stage: true } });
  return res;
};

export const createJobRequestBody = {
  name: 'DEFAULT',
  creator: 'UNKNOWN',
  data: { stages: [] },
  type: 'DYNAMIC',
  notifications: {},
  userMetadata: {},
} satisfies JobCreateModel;

export const testJobId = faker.string.uuid();
