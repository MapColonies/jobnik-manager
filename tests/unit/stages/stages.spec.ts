/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { faker } from '@faker-js/faker';
import { trace } from '@opentelemetry/api';
import { PrismaClient, Prisma, StageOperationStatus, JobOperationStatus } from '@prismaClient';
import { StageManager } from '@src/stages/models/manager';
import { JobManager } from '@src/jobs/models/manager';
import { JobMetrics } from '@src/jobs/models/metrics';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { illegalStatusTransitionErrorMessage, prismaKnownErrors } from '@src/common/errors';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { StageCreateModel, StageIncludingJob, UpdateSummaryCount } from '@src/stages/models/models';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { StageRepository } from '@src/stages/DAL/stageRepository';
import { JobPrismaObject } from '@src/jobs/models/models';
import { SERVICE_NAME } from '@src/common/constants';
import { JobInFiniteStateError } from '@src/common/generated/errors';
import { jobEntityWithAbortStatus, jobEntityWithStages, jobId, pendingStageXstatePersistentSnapshot, stageEntity } from '../data';
import { createStageEntity, createJobEntity, createTaskEntity, StageWithTasks } from '../generator';

let jobManager: JobManager;
let stageManager: StageManager;
let stageRepository: StageRepository;
const tracer = trace.getTracer(SERVICE_NAME);
const prisma = new PrismaClient();
type StageAggregateResult = Prisma.GetStageAggregateType<Prisma.StageAggregateArgs>;

// Create mock metrics
const mockJobMetrics = {
  recordJobCompletionMetrics: jest.fn(),
  recordJobStatusTransition: jest.fn(),
} as unknown as JobMetrics;

const notFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: prismaKnownErrors.recordNotFound, clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    jobManager = new JobManager(jsLogger({ enabled: false }), prisma, tracer, mockJobMetrics);
    stageRepository = new StageRepository(jsLogger({ enabled: false }), prisma);
    stageManager = new StageManager(jsLogger({ enabled: false }), prisma, tracer, stageRepository, jobManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#Stages', () => {
    describe('#getStages', () => {
      describe('#HappyPath', () => {
        it('should return array with single stage formatted object by criteria without tasks', async function () {
          const stageEntity = createStageEntity({ type: 'SOME_STAGE_TYPE' });
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stages = await stageManager.getStages({ stage_type: 'SOME_STAGE_TYPE' });
          const { xstate, task, tracestate, ...rest } = stageEntity;

          const expectedStage = [rest];

          expect(stages).toMatchObject(expectedStage);
          expect(stages[0]?.tasks).toBeUndefined();
        });

        it('should return array with single stage formatted object by criteria with related tasks', async function () {
          const stageId = faker.string.uuid();
          const taskEntity = createTaskEntity({ stageId });
          const stageEntity = createStageEntity({ id: stageId, task: [taskEntity], type: 'SOME_STAGE_TYPE' });
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stages = await stageManager.getStages({ stage_type: 'SOME_STAGE_TYPE', should_return_tasks: true });
          const { xstate, task, tracestate, ...rest } = stageEntity;

          const expectedStage = [rest];

          expect(stages).toMatchObject(expectedStage);
          expect(stages[0]?.tasks).toMatchObject([{ id: taskEntity.id }]);
        });

        it('should return array with all stages when no criteria is provided', async function () {
          const stageEntity = createStageEntity({});
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stages = await stageManager.getStages(undefined);
          const { xstate, task, tracestate, ...rest } = stageEntity;

          const expectedStage = [rest];

          expect(stages).toMatchObject(expectedStage);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when find stages', async function () {
          const prismaCreateJobMock = jest.spyOn(prisma.stage, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.getStages({ stage_type: 'SOME_STAGE_TYPE' })).rejects.toThrow('db connection error');

          expect(prismaCreateJobMock).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('#getStageById', () => {
      describe('#HappyPath', () => {
        it('should return stage object by provided id', async function () {
          const stageEntity = createStageEntity({});
          const stageId = stageEntity.id;
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

          const stage = await stageManager.getStageById(stageId);

          const { xstate, task, tracestate, ...rest } = stageEntity;

          const expectedStage = rest;

          expect(stage).toMatchObject(expectedStage);
          expect(stage.tasks).toBeUndefined();
        });

        it('should return stage object by provided id with related tasks', async function () {
          const stageId = faker.string.uuid();
          const taskEntity = createTaskEntity({ stageId });
          const stageEntity = createStageEntity({ id: stageId, task: [taskEntity] });

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

          const stage = await stageManager.getStageById(stageId);

          const { xstate, task, tracestate, ...rest } = stageEntity;

          const expectedStage = rest;

          expect(stage).toMatchObject(expectedStage);
          expect(stage.tasks).toMatchObject([{ id: taskEntity.id }]);
        });
      });

      describe('#BadPath', () => {
        it('should result in failure when attempting to retrieve a job with a non-existent stage', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.getStageById('some_id')).rejects.toThrow(stagesErrorMessages.stageNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail and throw an error if prisma throws an error', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.getStageById('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#getStagesByJobId', () => {
      describe('#HappyPath', () => {
        it('should return stage object by provided job id', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithStages);
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stage = await stageManager.getStagesByJobId(stageEntity.jobId);

          const { xstate, task, tracestate, ...rest } = stageEntity;
          const expectedStage = [rest];

          expect(stage).toMatchObject(expectedStage);
          expect(stage[0]?.tasks).toBeUndefined();
        });

        it('should return stage object by provided job id with related tasks', async function () {
          const stageId = faker.string.uuid();
          const taskEntity = createTaskEntity({ stageId });
          const stageEntity = createStageEntity({ id: stageId, task: [taskEntity] });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithStages);
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stage = await stageManager.getStagesByJobId(stageEntity.jobId);

          const { xstate, task, tracestate, ...rest } = stageEntity;

          const expectedStage = [rest];

          expect(stage).toMatchObject(expectedStage);
          expect(stage[0]?.tasks).toMatchObject([{ id: taskEntity.id }]);
        });

        it('should return stages ordered by order field', async function () {
          const jobId = faker.string.uuid();
          const stage1 = createStageEntity({ jobId, order: 1, type: 'FIRST_STAGE' });
          const stage2 = createStageEntity({ jobId, order: 2, type: 'SECOND_STAGE' });
          const stage3 = createStageEntity({ jobId, order: 3, type: 'THIRD_STAGE' });

          // Mock database to return stages in correct order (simulating orderBy)
          const orderedStages = [stage1, stage2, stage3];

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithStages);
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue(orderedStages);

          const stages = await stageManager.getStagesByJobId(jobId);

          expect(stages).toMatchObject([
            { id: stage1.id, order: 1 },
            { id: stage2.id, order: 2 },
            { id: stage3.id, order: 3 },
          ]);
        });
      });

      describe('#BadPath', () => {
        it('should failed on not founded stage when getting by non exists job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.getStagesByJobId('some_id')).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when getting desired stage', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.getStagesByJobId('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#getSummaryByStageId', () => {
      describe('#HappyPath', () => {
        it("should return stage's summary object by provided stage id", async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

          const stage = await stageManager.getSummaryByStageId(stageEntity.id);

          expect(stage).toMatchObject({});
        });
      });

      describe('#BadPath', () => {
        it('should failed on not founded stage when getting by non exists job', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.getSummaryByStageId('some_id')).rejects.toThrow(stagesErrorMessages.stageNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when getting desired stage', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.getSummaryByStageId('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateUserMetadata', () => {
      describe('#HappyPath', () => {
        it("should update successfully stage's metadata object by provided id", async function () {
          const stageEntity = createStageEntity({});
          const stageId = stageEntity.id;
          const prismaUpdateStageMock = jest.spyOn(prisma.stage, 'update').mockResolvedValue(stageEntity);

          await stageManager.updateUserMetadata(stageId, { newData: 'test' });

          expect(prismaUpdateStageMock).toHaveBeenCalledTimes(1);
        });
      });

      describe('#BadPath', () => {
        it('should failed on for not exists stage when update user metadata of desired stage', async function () {
          jest.spyOn(prisma.stage, 'update').mockRejectedValue(notFoundError);

          await expect(stageManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow(stagesErrorMessages.stageNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when update user metadata of desired stage', async function () {
          jest.spyOn(prisma.stage, 'update').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#addStage', () => {
      describe('#HappyPath', () => {
        it('should add new stage to existing job stage', async function () {
          const uniqueJobId = faker.string.uuid();
          const uniqueStageId = faker.string.uuid();
          const jobWithOneStageEntity = createJobEntity({ id: uniqueJobId, data: {} });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);
          jest.spyOn(prisma.stage, 'aggregate').mockResolvedValue({ _max: { order: 1 } } as StageAggregateResult);

          const anotherStagePayload = {
            data: {},
            type: 'SOME_STAGE_TYPE',
            userMetadata: { someData: '123' },
          } satisfies StageCreateModel;

          const anotherStageEntity = createStageEntity({
            jobId: uniqueJobId,
            id: uniqueStageId,
            userMetadata: anotherStagePayload.userMetadata,
            type: anotherStagePayload.type,
            order: 2,
          });

          jest.spyOn(prisma.stage, 'create').mockResolvedValue(anotherStageEntity);

          const stagesResponse = await stageManager.addStage(uniqueJobId, anotherStagePayload);

          // Extract unnecessary fields from the stage object and assemble the expected result
          const { xstate, task, tracestate, ...rest } = anotherStageEntity;

          expect(stagesResponse).toMatchObject(rest);
        });

        it('should add stage with WAITING status when startAsWaiting flag is true', async function () {
          const uniqueJobId = faker.string.uuid();
          const uniqueStageId = faker.string.uuid();
          const jobWithOneStageEntity = createJobEntity({ id: uniqueJobId, data: {} });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);
          jest.spyOn(prisma.stage, 'aggregate').mockResolvedValue({ _max: { order: null } } as StageAggregateResult);

          const anotherStagePayload = {
            data: {},
            type: 'SOME_STAGE_TYPE',
            userMetadata: { someData: '123' },
            startAsWaiting: true,
          } satisfies StageCreateModel;

          const anotherStageEntity = createStageEntity({
            jobId: uniqueJobId,
            id: uniqueStageId,
            userMetadata: anotherStagePayload.userMetadata,
            type: anotherStagePayload.type,
            order: 1,
          });

          jest.spyOn(prisma.stage, 'create').mockResolvedValue(anotherStageEntity);

          const stagesResponse = await stageManager.addStage(uniqueJobId, anotherStagePayload);

          // Extract unnecessary fields from the stage object and assemble the expected result
          const { xstate, task, tracestate, ...rest } = anotherStageEntity;

          expect(stagesResponse).toMatchObject(rest);
        });

        it('should assign order 1 to the first stage in a job (internal logic)', async function () {
          const uniqueJobId = faker.string.uuid();
          const uniqueStageId = faker.string.uuid();
          const jobEntity = createJobEntity({ id: uniqueJobId, data: {} });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);
          jest.spyOn(prisma.stage, 'aggregate').mockResolvedValue({ _max: { order: null } } as StageAggregateResult);

          const stagePayload = {
            data: {},
            type: 'SOME_STAGE_TYPE',
            userMetadata: { testData: 'first' },
          } satisfies StageCreateModel;

          const expectedStageEntity = createStageEntity({
            jobId: uniqueJobId,
            id: uniqueStageId,
            userMetadata: stagePayload.userMetadata,
            type: stagePayload.type,
            order: 1,
          });

          jest.spyOn(prisma.stage, 'create').mockResolvedValue(expectedStageEntity);

          const result = await stageManager.addStage(uniqueJobId, stagePayload);

          expect(result).toMatchObject({
            id: expectedStageEntity.id,
            order: 1,
          });
        });

        it('should assign incremental order numbers for multiple stages in the same job (internal logic)', async function () {
          const uniqueJobId = faker.string.uuid();
          const uniqueStageId = faker.string.uuid();
          const jobEntity = createJobEntity({ id: uniqueJobId, data: {} });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);
          jest.spyOn(prisma.stage, 'aggregate').mockResolvedValue({ _max: { order: 3 } } as StageAggregateResult);

          const stagePayload = {
            data: {},
            type: 'FOURTH_STAGE_TYPE',
            userMetadata: { testData: 'fourth' },
          } satisfies StageCreateModel;

          const expectedStageEntity = createStageEntity({
            jobId: uniqueJobId,
            id: uniqueStageId,
            userMetadata: stagePayload.userMetadata,
            type: stagePayload.type,
            order: 4,
          });

          jest.spyOn(prisma.stage, 'create').mockResolvedValue(expectedStageEntity);

          const result = await stageManager.addStage(uniqueJobId, stagePayload);

          expect(result).toMatchObject({
            id: expectedStageEntity.id,
            order: 4,
          });
        });

        it('should assign independent order numbers for stages in different jobs (internal logic)', async function () {
          const jobId1 = faker.string.uuid();
          const jobId2 = faker.string.uuid();
          const stageId1 = faker.string.uuid();
          const stageId2 = faker.string.uuid();

          const jobEntity1 = createJobEntity({ id: jobId1, data: {} });
          const jobEntity2 = createJobEntity({ id: jobId2, data: {} });

          // For job1: already has 2 stages
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValueOnce(jobEntity1).mockResolvedValueOnce(jobEntity2);
          jest
            .spyOn(prisma.stage, 'aggregate')
            .mockResolvedValueOnce({ _max: { order: 2 } } as StageAggregateResult)
            .mockResolvedValueOnce({ _max: { order: null } } as StageAggregateResult);

          const stagePayload1 = {
            data: {},
            type: 'JOB1_STAGE',
            userMetadata: { job: 'job1' },
          } satisfies StageCreateModel;

          const stagePayload2 = {
            data: {},
            type: 'JOB2_STAGE',
            userMetadata: { job: 'job2' },
          } satisfies StageCreateModel;

          const expectedStageEntity1 = createStageEntity({
            jobId: jobId1,
            id: stageId1,
            order: 3, // Should be 3 for job1
          });

          const expectedStageEntity2 = createStageEntity({
            jobId: jobId2,
            id: stageId2,
            order: 1, // Should be 1 for job2
          });

          jest.spyOn(prisma.stage, 'create').mockResolvedValueOnce(expectedStageEntity1).mockResolvedValueOnce(expectedStageEntity2);

          const result1 = await stageManager.addStage(jobId1, stagePayload1);
          const result2 = await stageManager.addStage(jobId2, stagePayload2);

          expect(result1).toMatchObject({
            id: expectedStageEntity1.id,
            order: 3,
          });
          expect(result2).toMatchObject({
            id: expectedStageEntity2.id,
            order: 1,
          });
        });
      });

      describe('#BadPath', () => {
        it('should reject adding stage to a non-existent job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.addStage('someId', {} as unknown as StageCreateModel)).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });

        it('should reject adding stage to a finite job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithAbortStatus });

          await expect(stageManager.addStage('someId', {} as unknown as StageCreateModel)).rejects.toThrow(
            new JobInFiniteStateError(jobsErrorMessages.jobAlreadyFinishedStagesError)
          );
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when adding stage', async function () {
          const jobEntity = createJobEntity({});
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValueOnce(jobEntity);
          jest.spyOn(prisma.stage, 'aggregate').mockResolvedValueOnce({ _max: { order: null } } as StageAggregateResult); // No existing stages
          jest.spyOn(prisma.stage, 'create').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.addStage(jobEntity.id, {} as unknown as StageCreateModel)).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateStatus', () => {
      describe('#HappyPath', () => {
        it('should successfully update stage status by id', async function () {
          const stageId = faker.string.uuid();
          const stageEntityResult = { ...stageEntity, id: stageId, job: { status: JobOperationStatus.IN_PROGRESS } } as unknown as StageWithTasks;

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntityResult);
          jest.spyOn(prisma.stage, 'update').mockResolvedValue({ ...stageEntity, id: stageId });

          await expect(stageManager.updateStatus(stageEntity.id, StageOperationStatus.PENDING)).toResolve();
        });

        it('should successfully update stage to IN_PROGRESS and move also the PENDING job to IN_PROGRESS', async function () {
          const stageId = faker.string.uuid();
          const stageEntityResult = {
            ...stageEntity,
            id: stageId,
            status: StageOperationStatus.PENDING,
            xstate: pendingStageXstatePersistentSnapshot,
            job: { status: JobOperationStatus.PENDING, id: jobId },
          } as unknown as StageWithTasks;

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntityResult);
          jest.spyOn(prisma.stage, 'update').mockResolvedValue({ ...stageEntity, id: stageId });
          jest
            .spyOn(prisma.job, 'findUnique')
            .mockResolvedValue({ ...jobEntityWithStages, status: JobOperationStatus.PENDING, xstate: pendingStageXstatePersistentSnapshot });

          jest.spyOn(prisma.job, 'update').mockResolvedValue(jobEntityWithStages);
          await expect(stageManager.updateStatus(stageEntity.id, StageOperationStatus.IN_PROGRESS)).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating status for a state that does not exist', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.updateStatus('someId', StageOperationStatus.PENDING)).rejects.toThrow(stagesErrorMessages.stageNotFound);
        });

        it('should fail on invalid status transition', async function () {
          jest
            .spyOn(prisma.stage, 'findUnique')
            .mockResolvedValue({ ...stageEntity, job: { status: JobOperationStatus.IN_PROGRESS } } as unknown as StageWithTasks);

          await expect(stageManager.updateStatus(stageEntity.id, StageOperationStatus.COMPLETED)).rejects.toThrow(
            illegalStatusTransitionErrorMessage(stageEntity.status, StageOperationStatus.COMPLETED)
          );
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating status', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.updateStatus('someId', StageOperationStatus.COMPLETED)).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateStageProgressFromTaskChanges', () => {
      describe('#HappyPath', () => {
        it('should update stage data according task progressing', async function () {
          const updateSummaryCount = {} as unknown as UpdateSummaryCount;

          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();
          const jobEntity = createJobEntity({ id: jobId }) as unknown as JobPrismaObject;
          const stageEntity = createStageEntity({
            jobId: jobEntity.id,
            id: stageId,
            status: StageOperationStatus.PENDING,
            xstate: pendingStageXstatePersistentSnapshot,
            summary: { ...defaultStatusCounts, total: 2, inProgress: 1 },
          }) as StageIncludingJob;

          const mockTx = {
            stage: {
              findUnique: jest.fn().mockResolvedValue({
                ...stageEntity,
                job: { ...jobEntity, status: JobOperationStatus.PENDING, xstate: pendingStageXstatePersistentSnapshot },
              }),
              update: jest.fn().mockResolvedValueOnce(null),
            },
          } as unknown as Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

          jest.spyOn(stageRepository, 'updateStageSummary').mockResolvedValueOnce({ ...defaultStatusCounts, total: 2, inProgress: 1 });
          jest.spyOn(stageManager, 'updateStatus').mockResolvedValueOnce(undefined);

          await expect(stageManager.updateStageProgressFromTaskChanges(stageId, updateSummaryCount, mockTx)).toResolve();
        });

        it('should update stage data according with auto completed', async function () {
          const updateSummaryCount = {} as unknown as UpdateSummaryCount;

          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();
          const jobEntity = createJobEntity({ id: jobId }) as unknown as JobPrismaObject;
          const stageEntity = createStageEntity({
            jobId: jobEntity.id,
            id: stageId,
            summary: { ...defaultStatusCounts, total: 2, inProgress: 1 },
          }) as StageIncludingJob;

          const mockTx = {
            stage: {
              findUnique: jest.fn().mockResolvedValue({
                ...stageEntity,
                job: { ...jobEntity, status: JobOperationStatus.PENDING, xstate: pendingStageXstatePersistentSnapshot },
              }),
              update: jest.fn().mockResolvedValueOnce(null),
            },
          } as unknown as Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

          jest.spyOn(stageRepository, 'updateStageSummary').mockResolvedValueOnce({ ...defaultStatusCounts, total: 2, completed: 2 });
          jest.spyOn(stageManager, 'updateStatus').mockResolvedValueOnce(undefined);

          await expect(stageManager.updateStageProgressFromTaskChanges(stageId, updateSummaryCount, mockTx)).toResolve();
        });
      });
    });
  });
});
