import { createActor } from 'xstate';
import { faker } from '@faker-js/faker';
import { type Prisma, type PrismaClient } from '@prismaClient';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobCreateModel, JobPrismaObject } from '@src/jobs/models/models';

type JobTestCreateModel = JobCreateModel & { id?: string };

export const createJobRecord = async (body: JobTestCreateModel, prisma: PrismaClient): Promise<JobPrismaObject> => {
  const persistedSnapshot = createActor(jobStateMachine).start().getPersistedSnapshot();

  const traceparent = body.traceparent ?? '00-00000000000000000000000000000000-0000000000000000-00';
  const input = {
    ...body,
    xstate: persistedSnapshot,
    traceparent,
    tracestate: body.tracestate ?? null,
  } satisfies Prisma.JobCreateInput;

  const res = await prisma.job.create({ data: input, include: { stage: true } });
  return res;
};

export const createJobRequestBody = {
  name: 'DEFAULT',
  data: {},
  userMetadata: {},
} satisfies JobCreateModel;

export const testJobId = faker.string.uuid();
export const testStageId = faker.string.uuid();
