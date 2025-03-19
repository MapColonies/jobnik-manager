/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
import { createActor } from 'xstate';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobOperationStatus } from '@prisma/client';
import { createJobEntity, createStageEntity } from './helpers';

const deleteActor = createActor(jobStateMachine).start();
deleteActor.send({ type: 'abort' });

export const jobId = faker.string.uuid();
export const stageId = faker.string.uuid();
export const anotherStageId = faker.string.uuid();

export const jobEntityWithoutStages = createJobEntity({ id: jobId });
export const stageEntity = createStageEntity({ id: stageId, job_id: jobId, data: { name: 'someStage' } });

export const jobEntityWithStages = createJobEntity({
  id: jobId,
  data: { stages: [{ data: stageEntity.data, type: stageEntity.name, userMetadata: stageEntity.userMetadata }] },
  Stage: [stageEntity],
});

export const abortedXstatePersistentSnapshot = deleteActor.getPersistedSnapshot();
export const jobEntityWithAbortStatus = createJobEntity({
  xstate: abortedXstatePersistentSnapshot,
  status: JobOperationStatus.ABORTED,
});
