import { createActor } from 'xstate';
import { faker } from '@faker-js/faker';
import { JobMode, StageName, StageOperationStatus, TaskOperationStatus, type Prisma, type PrismaClient } from '@prismaClient';
import { StageCreateWithTasksModel, StageModel, StagePrismaObject } from '@src/stages/models/models';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { TaskCreateModel } from '@src/tasks/models/models';
import { convertPrismaToStageResponse } from '@src/stages/models/helper';
import { createJobRecord, createJobRequestBody } from '../jobs/helpers';

const persistedSnapshot = createActor(stageStateMachine).start().getPersistedSnapshot();

/**
 * Creates a stage with the given payload and auto generate a job record.
 * Also support tasks creation as part of the stage creation payload.
 */
export const createStageWithJob = async (stagePayload: StageCreateWithTasksModel, prisma: PrismaClient): Promise<StageModel> => {
  const createStageActor = createActor(stageStateMachine).start();
  const persistenceSnapshot = createStageActor.getPersistedSnapshot();

  const job = await createJobRecord({ ...createJobRequestBody, jobMode: JobMode.DYNAMIC }, prisma);

  let input = undefined;
  let tasksInput = undefined;
  const { tasks: taskReq, type, ...bodyInput } = stagePayload;

  input = {
    ...bodyInput,
    name: type,
    status: StageOperationStatus.CREATED,
    job: {
      connect: {
        id: job.id,
      },
    },
    xstate: persistenceSnapshot,
  } satisfies Prisma.StageCreateInput;

  // will add also task creation, if exists in request
  if (taskReq !== undefined && taskReq.length > 0) {
    const tasks: TaskCreateModel[] = taskReq;
    tasksInput = tasks.map((task) => {
      const taskFull = Object.assign(task, { xstate: persistenceSnapshot, status: TaskOperationStatus.CREATED });
      return taskFull;
    });

    input = { ...input, task: { create: tasksInput } } satisfies Prisma.StageCreateInput;
  }

  const queryBody: Prisma.StageCreateArgs = {
    data: input,
    include: {
      task: true,
    },
  };

  const stage = await prisma.stage.create(queryBody);
  return convertPrismaToStageResponse(stage);
};

/**
 * adding stage record to exists job
 * @param body prisma stage create body
 * @param prisma prisma client
 * @returns
 */
export const addStageRecord = async (body: Prisma.StageCreateManyInput, prisma: PrismaClient): Promise<StagePrismaObject> => {
  const res = await prisma.stage.create({ data: body });
  return res;
};

export const createStageWithoutTaskBody = {
  jobId: faker.string.uuid(),
  name: StageName.DEFAULT,
  data: {},
  xstate: persistedSnapshot,
  userMetadata: {},
} satisfies Prisma.StageCreateManyInput;
