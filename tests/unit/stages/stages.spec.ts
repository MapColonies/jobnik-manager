/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { faker } from '@faker-js/faker';
import { PrismaClient, Prisma, StageName, JobMode, StageOperationStatus, TaskType, JobOperationStatus } from '@prismaClient';
import { StageManager } from '@src/stages/models/manager';
import { JobManager } from '@src/jobs/models/manager';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { errorMessages as commonErrorMessages, InvalidUpdateError, prismaKnownErrors } from '@src/common/errors';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { StageCreateWithTasksModel, StageIncludingJob, UpdateSummaryCount } from '@src/stages/models/models';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { StageRepository } from '@src/stages/DAL/stageRepository';
import { JobPrismaObject } from '@src/jobs/models/models';
import { jobEntityWithAbortStatus, jobEntityWithStages, jobId, pendingStageXstatePersistentSnapshot, stageEntity } from '../data';
import { createStageEntity, createJobEntity, createTaskEntity, StageWithTasks } from '../generator';

let jobManager: JobManager;
let stageManager: StageManager;
let stageRepository: StageRepository;
const prisma = new PrismaClient();

const notFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: prismaKnownErrors.recordNotFound, clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    jobManager = new JobManager(jsLogger({ enabled: false }), prisma);
    stageRepository = new StageRepository(jsLogger({ enabled: false }), prisma);
    stageManager = new StageManager(jsLogger({ enabled: false }), prisma, stageRepository, jobManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#Stages', () => {
    describe('#getStages', () => {
      describe('#HappyPath', () => {
        it('should return array with single stage formatted object by criteria without tasks', async function () {
          const stageEntity = createStageEntity({});
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stages = await stageManager.getStages({ stage_type: StageName.DEFAULT });

          const { name: type, xstate, task, ...rest } = stageEntity;

          const expectedStage = [rest];

          expect(stages).toMatchObject(expectedStage);
          expect(stages[0]?.tasks).toBeUndefined();
        });

        it('should return array with single stage formatted object by criteria with related tasks', async function () {
          const stageId = faker.string.uuid();
          const taskEntity = createTaskEntity({ stageId, type: TaskType.DEFAULT });
          const stageEntity = createStageEntity({ id: stageId, task: [taskEntity] });
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stages = await stageManager.getStages({ stage_type: StageName.DEFAULT, should_return_tasks: true });

          const { name: type, xstate, task, ...rest } = stageEntity;

          const expectedStage = [rest];

          expect(stages).toMatchObject(expectedStage);
          expect(stages[0]?.tasks).toMatchObject([{ id: taskEntity.id }]);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when find stages', async function () {
          const prismaCreateJobMock = jest.spyOn(prisma.stage, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.getStages({ stage_type: StageName.DEFAULT })).rejects.toThrow('db connection error');

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

          const { name: type, xstate, task, ...rest } = stageEntity;

          const expectedStage = rest;

          expect(stage).toMatchObject(expectedStage);
          expect(stage.tasks).toBeUndefined();
        });

        it('should return stage object by provided id with related tasks', async function () {
          const stageId = faker.string.uuid();
          const taskEntity = createTaskEntity({ stageId, type: TaskType.DEFAULT });
          const stageEntity = createStageEntity({ id: stageId, task: [taskEntity] });

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

          const stage = await stageManager.getStageById(stageId);

          const { name: type, xstate, task, ...rest } = stageEntity;

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

    describe('#getStageByJobId', () => {
      describe('#HappyPath', () => {
        it('should return stage object by provided job id', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithStages);
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stage = await stageManager.getStagesByJobId(stageEntity.jobId);

          const { name: type, xstate, task, ...rest } = stageEntity;
          const expectedStage = [rest];

          expect(stage).toMatchObject(expectedStage);
          expect(stage[0]?.tasks).toBeUndefined();
        });

        it('should return stage object by provided job id with related tasks', async function () {
          const stageId = faker.string.uuid();
          const taskEntity = createTaskEntity({ stageId, type: TaskType.DEFAULT });
          const stageEntity = createStageEntity({ id: stageId, task: [taskEntity] });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithStages);
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stage = await stageManager.getStagesByJobId(stageEntity.jobId);

          const { name: type, xstate, task, ...rest } = stageEntity;

          const expectedStage = [rest];

          expect(stage).toMatchObject(expectedStage);
          expect(stage[0]?.tasks).toMatchObject([{ id: taskEntity.id }]);
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
          const jobWithOneStageEntity = createJobEntity({ id: uniqueJobId, data: {}, jobMode: JobMode.DYNAMIC });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);

          const anotherStagePayload = {
            data: {},
            type: StageName.DEFAULT,
            userMetadata: { someData: '123' },
          } satisfies StageCreateWithTasksModel;

          const anotherStageEntity = createStageEntity({
            jobId: uniqueJobId,
            id: uniqueStageId,
            userMetadata: anotherStagePayload.userMetadata,
            name: anotherStagePayload.type,
          });

          jest.spyOn(prisma.stage, 'create').mockResolvedValue(anotherStageEntity);

          const stagesResponse = await stageManager.addStage(uniqueJobId, anotherStagePayload);

          // Extract unnecessary fields from the stage object and assemble the expected result
          const { xstate, name, task, ...rest } = anotherStageEntity;

          expect(stagesResponse).toMatchObject(Object.assign(rest, { type: name }));
        });

        it('should add new stage with included tasks to existing job stage', async function () {
          const uniqueJobId = faker.string.uuid();
          const uniqueStageId = faker.string.uuid();

          const jobWithOneStageEntity = createJobEntity({ id: uniqueJobId, data: {}, jobMode: JobMode.DYNAMIC });
          const taskEntity = createTaskEntity({ id: uniqueStageId, type: TaskType.DEFAULT });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);

          const anotherStagePayload = {
            data: {},
            type: StageName.DEFAULT,
            userMetadata: { someData: '123' },
            tasks: [{ data: {}, type: StageName.DEFAULT, userMetadata: { someData: '123' } }],
          } satisfies StageCreateWithTasksModel;

          const anotherStageEntity = createStageEntity({
            jobId: uniqueJobId,
            id: uniqueStageId,
            userMetadata: anotherStagePayload.userMetadata,
            name: anotherStagePayload.type,
            data: anotherStagePayload.data,
            task: [taskEntity],
          });
          jest.spyOn(prisma.stage, 'create').mockResolvedValue(anotherStageEntity);

          const stagesResponse = await stageManager.addStage(jobId, anotherStagePayload);

          // Extract unnecessary fields from the stage object and assemble the expected result
          const { xstate, name, task, ...rest } = anotherStageEntity;

          expect(stagesResponse).toMatchObject(Object.assign(rest, { type: name }));
        });

        it('should add new stage with included empty tasks array to existing job stage', async function () {
          const uniqueJobId = faker.string.uuid();
          const uniqueStageId = faker.string.uuid();

          const jobWithOneStageEntity = createJobEntity({ id: uniqueJobId, data: {}, jobMode: JobMode.DYNAMIC });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);

          const anotherStagePayload = {
            data: {},
            type: StageName.DEFAULT,
            userMetadata: { someData: '123' },
            tasks: [],
          } satisfies StageCreateWithTasksModel;

          const anotherStageEntity = createStageEntity({
            jobId: uniqueJobId,
            id: uniqueStageId,
            userMetadata: anotherStagePayload.userMetadata,
            name: anotherStagePayload.type,
            data: anotherStagePayload.data,
            task: [],
          });
          jest.spyOn(prisma.stage, 'create').mockResolvedValue(anotherStageEntity);

          const stagesResponse = await stageManager.addStage(uniqueJobId, anotherStagePayload);

          // Extract unnecessary fields from the stage object and assemble the expected result
          const { xstate, name, task, ...rest } = anotherStageEntity;

          expect(stagesResponse).toMatchObject(Object.assign(rest, { type: name }));
        });
      });

      describe('#BadPath', () => {
        it('should reject adding stage to a non-existent job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.addStage('someId', {} as unknown as StageCreateWithTasksModel)).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });

        it('should reject adding stage to a PRE-DEFINED type job', async function () {
          const jobWithOneStageEntity = createJobEntity({ id: jobId, data: {}, jobMode: JobMode.PRE_DEFINED });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);

          await expect(stageManager.addStage('someId', {} as unknown as StageCreateWithTasksModel)).rejects.toThrow(
            new InvalidUpdateError(jobsErrorMessages.preDefinedJobStageModificationError)
          );
        });

        it('should reject adding stage to a finite job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithAbortStatus, jobMode: JobMode.DYNAMIC });

          await expect(stageManager.addStage('someId', {} as unknown as StageCreateWithTasksModel)).rejects.toThrow(
            new InvalidUpdateError(jobsErrorMessages.jobAlreadyFinishedStagesError)
          );
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when adding stage', async function () {
          const jobEntity = createJobEntity({ jobMode: JobMode.DYNAMIC });
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValueOnce(jobEntity);
          jest.spyOn(prisma.stage, 'create').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.addStage(jobEntity.id, {} as unknown as StageCreateWithTasksModel)).rejects.toThrow('db connection error');
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
            commonErrorMessages.invalidStatusChange
          );
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating status', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.updateStatus('someId', StageOperationStatus.COMPLETED)).rejects.toThrow('db connection error');
        });

        it('should fail on invalid stage structure return - missing job property', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

          await expect(stageManager.updateStatus(stageEntity.id, StageOperationStatus.COMPLETED)).rejects.toThrow(
            stagesErrorMessages.missingJobProperty
          );
        });
      });
    });

    describe('#updateStageProgressFromTaskChanges', () => {
      describe('#HappyPath', () => {
        it('should update stage data according task progressing', async function () {
          const updateSummaryCount = {} as unknown as UpdateSummaryCount;

          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();
          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.PRE_DEFINED }) as unknown as JobPrismaObject;
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
          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.PRE_DEFINED }) as unknown as JobPrismaObject;
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
