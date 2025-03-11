/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { PrismaClient, Prisma, JobOperationStatus } from '@prisma/client';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { StageManager } from '@src/stages/models/manager';
import { createActor, Snapshot } from 'xstate';

let stageManager: StageManager;
const prisma = new PrismaClient();
const dumpUuid = '54314600-c247-441b-b7ef-3066c57f0989';

function createJobEntity(override: Partial<Prisma.JobGetPayload<Record<string, never>>>) {
  const jobEntity = {
    creationTime: new Date(),
    creator: 'UNKNOWN',
    data: {},
    expirationTime: new Date(),
    id: 'SOME_ID',
    name: 'DEFAULT',
    notifications: {},
    percentage: 0,
    priority: 'HIGH',
    status: JobOperationStatus.PENDING,
    ttl: new Date(),
    type: 'PRE_DEFINED',
    updateTime: new Date(),
    userMetadata: {},
    xstate: createActor(jobStateMachine).start().getPersistedSnapshot(),
  } satisfies Prisma.JobGetPayload<Record<string, never>>;
  return { ...jobEntity, ...override };
}

function createStageEntity(override: Partial<Prisma.StageGetPayload<Record<string, never>>>) {
  const jobEntity = {
    data: {},
    // eslint-disable-next-line @typescript-eslint/naming-convention
    job_id: dumpUuid,
    id: 'SOME_ID',
    name: 'DEFAULT',
    percentage: 0,
    status: JobOperationStatus.PENDING,
    userMetadata: {},
    summary: {},
    xstate: { status: 'active', error: undefined, output: undefined } as Snapshot<unknown>,
  } satisfies Prisma.StageGetPayload<Record<string, never>>;
  return { ...jobEntity, ...override };
}

const notFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: 'P2025', clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    stageManager = new StageManager(jsLogger({ enabled: false }), prisma);
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

          const stages = await stageManager.getStages({ stage_type: 'DEFAULT' });

          const { job_id: jobId, name: type, xstate, ...rest } = stageEntity;
          const expectedStage = [rest];

          expect(stages).toMatchObject(expectedStage);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when find stages', async function () {
          const prismaCreateJobMock = jest.spyOn(prisma.stage, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.getStages({ stage_type: 'DEFAULT' })).rejects.toThrow('db connection error');

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

          const { job_id: jobId, name: type, xstate, ...rest } = stageEntity;
          const expectedStage = { jobId, ...rest };

          expect(stage).toMatchObject(expectedStage);
        });
      });

      describe('#BadPath', () => {
        it('should failed on not founded stage when getting desired job', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.getStageById('some_id')).rejects.toThrow('STAGE_NOT_FOUND');
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when getting desired STAGE', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.getStageById('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#getStageByJobId', () => {
      describe('#HappyPath', () => {
        it('should return stage object by provided job id', async function () {
          const stageEntity = createStageEntity({});
          const stageId = stageEntity.id;
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(createJobEntity({}));
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

          const stage = await stageManager.getStagesByJobId(stageId);

          const { job_id: jobId, name: type, xstate, ...rest } = stageEntity;
          const expectedStage = [{ jobId, ...rest }];

          expect(stage).toMatchObject(expectedStage);
        });
      });

      describe('#BadPath', () => {
        it('should failed on not founded stage when getting by non exists job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.getStagesByJobId('some_id')).rejects.toThrow('JOB_NOT_FOUND');
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
          const stageEntity = createStageEntity({});
          const stageId = stageEntity.id;

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

          const stage = await stageManager.getSummaryByStageId(stageId);

          expect(stage).toMatchObject({});
        });
      });

      describe('#BadPath', () => {
        it('should failed on not founded stage when getting by non exists job', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(null);

          await expect(stageManager.getSummaryByStageId('some_id')).rejects.toThrow('STAGE_NOT_FOUND');
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

          await expect(stageManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow('STAGE_NOT_FOUND');
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when update user metadata of desired stage', async function () {
          jest.spyOn(prisma.stage, 'update').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow('db connection error');
        });
      });
    });
  });
});
