import { createActor } from 'xstate';
import { faker } from '@faker-js/faker';
import { Creator, JobMode, JobName, StageName, StageOperationStatus, type Prisma, type PrismaClient } from '@prismaClient';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { StageCreateModel } from '@src/stages/models/models';
import { JobCreateModel, JobPrismaObject } from '@src/jobs/models/models';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';

export const createJobRecord = async (body: JobCreateModel, prisma: PrismaClient): Promise<JobPrismaObject> => {
  const persistedSnapshot = createActor(jobStateMachine).start().getPersistedSnapshot();
  const stagesPersistedSnapshot = createActor(stageStateMachine).start().getPersistedSnapshot();

  let input = undefined;
  const { stages: stagesReq, ...bodyInput } = body;

  if (stagesReq !== undefined && stagesReq.length > 0) {
    const stages: StageCreateModel[] = stagesReq;
    const stagesInput = stages.map((stage) => {
      const { type, ...rest } = stage;

      const stageFull = Object.assign(rest, { xstate: stagesPersistedSnapshot, name: type, status: StageOperationStatus.CREATED });
      return stageFull;
    });
    input = { ...bodyInput, xstate: persistedSnapshot, stage: { create: stagesInput } } satisfies Prisma.JobCreateInput;
  } else {
    input = { ...bodyInput, xstate: persistedSnapshot } satisfies Prisma.JobCreateInput;
  }

  const res = await prisma.job.create({ data: input, include: { stage: true } });
  return res;
};

export const createJobRequestBody = {
  name: JobName.DEFAULT,
  creator: Creator.UNKNOWN,
  data: {},
  jobMode: JobMode.DYNAMIC,
  notifications: {},
  userMetadata: {},
} satisfies JobCreateModel;

export const createJobRequestWithStagesBody = {
  name: JobName.DEFAULT,
  creator: Creator.UNKNOWN,
  data: {},
  jobMode: JobMode.DYNAMIC,
  notifications: {},
  userMetadata: {},
  stages: [
    {
      type: StageName.DEFAULT,
      data: {},
      userMetadata: {},
    },
  ],
} satisfies JobCreateModel;

export const testJobId = faker.string.uuid();
export const testStageId = faker.string.uuid();
