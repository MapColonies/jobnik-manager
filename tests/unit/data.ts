/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
import { createActor } from 'xstate';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { JobOperationStatus } from '@prisma/client';
import { createJobEntity, createStageEntity } from './generator';

const deleteActor = createActor(jobStateMachine).start();
deleteActor.send({ type: 'abort' });

export const jobId = faker.string.uuid();
export const stageId = faker.string.uuid();
export const anotherStageId = faker.string.uuid();

export const jobEntityWithoutStages = createJobEntity({ id: jobId });
export const jobEntityWithEmptyStagesArr = createJobEntity({ id: jobId, Stage: [] });
export const stageEntity = createStageEntity({ id: stageId, job_id: jobId, data: { name: 'someStage' } });

export const jobEntityWithStages = createJobEntity({
  id: jobId,
  data: {},
  Stage: [stageEntity],
});

export const abortedXstatePersistentSnapshot = deleteActor.getPersistedSnapshot();
export const jobEntityWithAbortStatus = createJobEntity({
  xstate: abortedXstatePersistentSnapshot,
  status: JobOperationStatus.ABORTED,
});
