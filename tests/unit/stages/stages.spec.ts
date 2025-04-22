/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { PrismaClient, Prisma, StageName, JobMode, StageOperationStatus } from '@prisma/client';
import { StageManager } from '@src/stages/models/manager';
import { JobManager } from '@src/jobs/models/manager';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { errorMessages as commonErrorMessages, InvalidUpdateError, prismaKnownErrors } from '@src/common/errors';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { anotherStageId, jobEntityWithAbortStatus, jobEntityWithStages, jobId, stageEntity } from '../data';
import { createStageEntity, createJobEntity, randomUuid } from '../generator';

let jobManager: JobManager;
let stageManager: StageManager;
const prisma = new PrismaClient();

const notFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: prismaKnownErrors.recordNotFound, clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    jobManager = new JobManager(jsLogger({ enabled: false }), prisma);
    stageManager = new StageManager(jsLogger({ enabled: false }), prisma, jobManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#Stages', () => {
    describe('#getStages', () => {
      describe('#HappyPath', () => {
        it('should return array with single stage formatted object by criteria', async function () {
          const stageEntity = createStageEntity({});
          jest.spyOn(prisma.stage, 'findMany').mockResolvedValue([stageEntity]);

          const stages = await stageManager.getStages({ stage_type: StageName.DEFAULT });

          const { name: type, xstate, ...rest } = stageEntity;
          const expectedStage = [rest];

          expect(stages).toMatchObject(expectedStage);
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

          const { name: type, xstate, ...rest } = stageEntity;
          const expectedStage = rest;

          expect(stage).toMatchObject(expectedStage);
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

          const { name: type, xstate, ...rest } = stageEntity;
          const expectedStage = [rest];

          expect(stage).toMatchObject(expectedStage);
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

    describe('#addStages', () => {
      describe('#HappyPath', () => {
        it('should add new stages to existing job stages', async function () {
          const jobWithOneStageEntity = createJobEntity({ id: jobId, data: {}, jobMode: JobMode.DYNAMIC });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);

          const anotherStagePayload = {
            data: {},
            type: StageName.DEFAULT,
            userMetadata: { someData: '123' },
          };

          const anotherStageEntity = createStageEntity({ jobId, id: anotherStageId, userMetadata: { someData: '123' } });

          jest.spyOn(prisma.stage, 'createManyAndReturn').mockResolvedValue([anotherStageEntity]);

          const stagesResponse = await stageManager.addStages(jobId, [anotherStagePayload]);

          // Extract unnecessary fields from the job object and assemble the expected result
          const { xstate, name, ...rest } = anotherStageEntity;

          expect(stagesResponse).toMatchObject([Object.assign(rest, { type: name })]);
        });
      });

      describe('#BadPath', () => {
        it('should reject adding stages to a non-existent job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.addStages('someId', [])).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      it('should reject adding stages to a PRE-DEFINED type job', async function () {
        const jobWithOneStageEntity = createJobEntity({ id: jobId, data: {}, jobMode: JobMode.PRE_DEFINED });

        jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);

        await expect(stageManager.addStages('someId', [])).rejects.toThrow(
          new InvalidUpdateError(jobsErrorMessages.preDefinedJobStageModificationError)
        );
      });

      it('should reject adding stages to a finite job', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithAbortStatus, jobMode: JobMode.DYNAMIC });

        await expect(stageManager.addStages('someId', [])).rejects.toThrow(new InvalidUpdateError(jobsErrorMessages.jobAlreadyFinishedStagesError));
      });

      describe('#SadPath', () => {
        it('should fail with a database error when adding stages', async function () {
          const jobEntity = createJobEntity({ jobMode: JobMode.DYNAMIC });
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValueOnce(jobEntity);
          jest.spyOn(prisma.stage, 'createManyAndReturn').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.addStages(jobEntity.id, [])).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateStatus', () => {
      describe('#HappyPath', () => {
        it('should successfully update stage status by id', async function () {
          const stageId = randomUuid;

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue({ ...stageEntity, id: stageId });
          jest.spyOn(prisma.stage, 'update').mockResolvedValue({ ...stageEntity, id: stageId });

          await expect(stageManager.updateStatus(stageEntity.id, StageOperationStatus.PENDING)).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating status for a state that does not exist', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.updateStatus('someId', StageOperationStatus.PENDING)).rejects.toThrow(stagesErrorMessages.stageNotFound);
        });

        it('should fail on invalid status transition', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

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
      });
    });
  });
});
