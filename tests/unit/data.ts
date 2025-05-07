/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
import { createActor, Snapshot } from 'xstate';
import { JobOperationStatus, TaskOperationStatus, TaskType } from '@prismaClient';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { createJobEntity, createStageEntity } from './generator';

const deleteActor = createActor(jobStateMachine).start();
deleteActor.send({ type: 'abort' });

const abortedStageActor = createActor(stageStateMachine).start();
abortedStageActor.send({ type: 'abort' });

const runningStageActor = createActor(stageStateMachine).start();
runningStageActor.send({ type: 'pend' });
runningStageActor.send({ type: 'process' });

export const jobId = faker.string.uuid();
export const stageId = faker.string.uuid();
export const anotherStageId = faker.string.uuid();

export const jobEntityWithoutStages = createJobEntity({ id: jobId });
export const jobEntityWithEmptyStagesArr = createJobEntity({ id: jobId, stage: [] });
export const stageEntity = createStageEntity({ id: stageId, jobId, data: { name: 'someStage' } });

export const jobEntityWithStages = createJobEntity({
  id: jobId,
  data: {},
  stage: [stageEntity],
});

export const abortedXstatePersistentSnapshot = deleteActor.getPersistedSnapshot();
export const inProgressStageXstatePersistentSnapshot = runningStageActor.getPersistedSnapshot();
export const abortedStageXstatePersistentSnapshot = abortedStageActor.getPersistedSnapshot();

export const jobEntityWithAbortStatus = createJobEntity({
  xstate: abortedXstatePersistentSnapshot,
  status: JobOperationStatus.ABORTED,
});

export const singleStageSummaryCompleted = {
  _count: { _all: 5 },
  status: TaskOperationStatus.COMPLETED,
  id: faker.string.uuid(),
  data: {},
  xstate: {} as unknown as Snapshot<unknown>,
  type: TaskType.DEFAULT,
  userMetadata: {},
  stageId: 'jjj',
  attempts: 0,
  maxAttempts: 0,
  creationTime: new Date(),
  updateTime: new Date(),
  _avg: { attempts: null, maxAttempts: null },
  _max: { attempts: null, maxAttempts: null },
  _min: { attempts: null, maxAttempts: null },
  _sum: { attempts: null, maxAttempts: null },
};

export const singleStageSummaryInProgress = {
  _count: { _all: 5 },
  status: TaskOperationStatus.IN_PROGRESS,
  id: faker.string.uuid(),
  data: {},
  xstate: {} as unknown as Snapshot<unknown>,
  type: TaskType.DEFAULT,
  userMetadata: {},
  stageId: faker.string.uuid(),
  attempts: 0,
  maxAttempts: 0,
  creationTime: new Date(),
  updateTime: new Date(),
  _avg: { attempts: null, maxAttempts: null },
  _max: { attempts: null, maxAttempts: null },
  _min: { attempts: null, maxAttempts: null },
  _sum: { attempts: null, maxAttempts: null },
};
