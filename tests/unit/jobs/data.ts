/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
import { createJobEntity, createStageEntity } from './helpers';

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
