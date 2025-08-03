import { createActor } from 'xstate';
import { faker } from '@faker-js/faker';
import { type Prisma, type PrismaClient } from '@prismaClient';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobCreateModel, JobPrismaObject } from '@src/jobs/models/models';
import { DEFAULT_TRACEPARENT } from '@src/common/utils/tracingHelpers';

type JobTestCreateModel = JobCreateModel & { id?: string };

export const createJobRecord = async (body: JobTestCreateModel, prisma: PrismaClient): Promise<JobPrismaObject> => {
  const persistedSnapshot = createActor(jobStateMachine).start().getPersistedSnapshot();

  const traceparent = body.traceparent ?? DEFAULT_TRACEPARENT;
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
