import { faker } from '@faker-js/faker';
import { createActor } from 'xstate';
import { JobOperationStatus } from '@prismaClient';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { stageStateMachine } from '@src/stages/models/stageStateMachine';
import { createJobEntity, createStageEntity } from './generator';

const deleteActor = createActor(jobStateMachine).start();
deleteActor.send({ type: 'abort' });

const abortedStageActor = createActor(stageStateMachine).start();
abortedStageActor.send({ type: 'abort' });

const pendingStageActor = createActor(stageStateMachine).start();
pendingStageActor.send({ type: 'pend' });

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
export const pendingStageXstatePersistentSnapshot = pendingStageActor.getPersistedSnapshot();

export const jobEntityWithAbortStatus = createJobEntity({
  xstate: abortedXstatePersistentSnapshot,
  status: JobOperationStatus.ABORTED,
});
