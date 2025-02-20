import jsLogger from '@map-colonies/js-logger';
import { PrismaClient, Prisma } from '@prisma/client';
import { JobManager } from '@src/jobs/models/manager';
import { jobStateMachine } from '@src/jobs/models/statusStateMachine';
import { components } from '@src/openapi';
import { createActor } from 'xstate';

let jobManager: JobManager;
const prisma = new PrismaClient();

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
    status: 'PENDING',
    ttl: new Date(),
    type: 'PRE_DEFINED',
    updateTime: new Date(),
    userMetadata: {},
    xstate: createActor(jobStateMachine).start().getPersistedSnapshot(),
  } satisfies Prisma.JobGetPayload<Record<string, never>>;
  return { ...jobEntity, ...override };
}

const jobNotFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: 'P2025', clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    jobManager = new JobManager(jsLogger({ enabled: false }), prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('#Jobs', () => {
    describe('#createJob', () => {
      describe('#HappyPath', () => {
        it('should return created job formatted', async function () {
          const jobEntity = createJobEntity({ data: { stages: [] } });
          const prismaCreateJobMock = jest.spyOn(prisma.job, 'create').mockResolvedValue(jobEntity);
          const createJobParams = {
            name: 'DEFAULT',
            creator: 'UNKNOWN',
            data: { stages: [] },
            type: 'PRE_DEFINED',
            notifications: {},
            userMetadata: {},
          } satisfies components['schemas']['createJobPayload'];

          const job = await jobManager.createJob(createJobParams);

          expect(prismaCreateJobMock).toHaveBeenCalledTimes(1);
          expect(job).toMatchObject(createJobParams);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when creating job', async function () {
          const prismaCreateJobMock = jest.spyOn(prisma.job, 'create').mockRejectedValueOnce(new Error('db connection error'));

          const createJobParams = {
            name: 'DEFAULT',
            creator: 'UNKNOWN',
            data: { stages: [] },
            type: 'PRE_DEFINED',
            notifications: {},
            userMetadata: {},
          } satisfies components['schemas']['createJobPayload'];

          await expect(jobManager.createJob(createJobParams)).rejects.toThrow('db connection error');

          expect(prismaCreateJobMock).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('#findJobs', () => {
      describe('#HappyPath', () => {
        it('should return array with single job formatted object by criteria', async function () {
          const jobEntity = createJobEntity({ expirationTime: undefined, ttl: undefined });
          jest.spyOn(prisma.job, 'findMany').mockResolvedValue([jobEntity]);

          const jobs = await jobManager.getJobs({ creator: 'UNKNOWN' });

          const { status: jobOperationStatus, xstate, ...rest } = jobEntity;
          const jobObject = { jobOperationStatus, ...rest };
          const expectedJob = [{ ...jobObject, creationTime: jobObject.creationTime.toISOString(), updateTime: jobObject.updateTime.toISOString() }];
          // delete jobEntity.xstate;
          // const expectedJob = [{ ...jobEntity, creationTime: jobEntity.creationTime.toISOString(), updateTime: jobEntity.updateTime.toISOString() }];

          expect(jobs).toMatchObject(expectedJob);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when find jobs', async function () {
          const prismaCreateJobMock = jest.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.getJobs({ creator: 'UNKNOWN' })).rejects.toThrow('db connection error');

          expect(prismaCreateJobMock).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('#getJobById', () => {
      describe('#HappyPath', () => {
        it('should return job object by provided id', async function () {
          const jobEntity = createJobEntity({ expirationTime: undefined, ttl: undefined });
          const jobId = jobEntity.id;
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);

          const jobs = await jobManager.getJobById(jobId);

          const { status: jobOperationStatus, xstate, ...rest } = jobEntity;
          const jobObject = { jobOperationStatus, ...rest };
          const expectedJob = { ...jobObject, creationTime: jobObject.creationTime.toISOString(), updateTime: jobObject.updateTime.toISOString() };

          expect(jobs).toMatchObject(expectedJob);
        });
      });

      describe('#BadPath', () => {
        it('should failed on not founded job when getting desired job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.getJobById('some_id')).rejects.toThrow('JOB_NOT_FOUND');
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when getting desired job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.getJobById('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateUserMetadata', () => {
      describe('#HappyPath', () => {
        it("should update successfully job' metadata object by provided id", async function () {
          const jobEntity = createJobEntity({});
          const jobId = jobEntity.id;
          const prismaUpdateJobMock = jest.spyOn(prisma.job, 'update').mockResolvedValue(jobEntity);

          await jobManager.updateUserMetadata(jobId, { newData: 'test' });

          expect(prismaUpdateJobMock).toHaveBeenCalledTimes(1);
        });
      });

      describe('#BadPath', () => {
        it('should failed on for not exists job when update user metadata of desired job', async function () {
          jest.spyOn(prisma.job, 'update').mockRejectedValue(jobNotFoundError);

          await expect(jobManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow('JOB_NOT_FOUND');
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when update user metadata of desired job', async function () {
          jest.spyOn(prisma.job, 'update').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updatePriority', () => {
      describe('#HappyPath', () => {
        it("should update successfully job' priority by provided id", async function () {
          const jobEntity = createJobEntity({});
          const jobId = jobEntity.id;
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);
          const prismaUpdateJobMock = jest.spyOn(prisma.job, 'update').mockResolvedValue(jobEntity);

          await jobManager.updatePriority(jobId, 'MEDIUM');

          expect(prismaUpdateJobMock).toHaveBeenCalledTimes(1);
        });

        it('should not update priority of job, because already set to provided priority', async function () {
          const jobEntity = createJobEntity({ priority: 'HIGH' });
          const jobId = jobEntity.id;
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);

          await expect(jobManager.updatePriority(jobId, 'HIGH')).rejects.toThrow('Priority cannot be updated to the same value.');
        });
      });

      describe('#BadPath', () => {
        it('should failed on for not exists job when update priority of desired job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.updatePriority('someId', 'MEDIUM')).rejects.toThrow('JOB_NOT_FOUND');
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when update priority of desired job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updatePriority('someId', 'MEDIUM')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateStatus', () => {
      describe('#HappyPath', () => {
        it("should update successfully job' status by provided id", async function () {
          const jobEntity = createJobEntity({});
          const jobId = jobEntity.id;
          const prismaUpdateJobMock = jest.spyOn(prisma.job, 'update').mockResolvedValue(jobEntity);

          await jobManager.updateStatus(jobId, 'COMPLETED');

          expect(prismaUpdateJobMock).toHaveBeenCalledTimes(1);
        });
      });

      describe('#BadPath', () => {
        it('should failed on for not exists job when update status of desired job', async function () {
          jest.spyOn(prisma.job, 'update').mockRejectedValue(jobNotFoundError);

          await expect(jobManager.updateStatus('someId', 'COMPLETED')).rejects.toThrow('JOB_NOT_FOUND');
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when update status of desired job', async function () {
          jest.spyOn(prisma.job, 'update').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updateStatus('someId', 'COMPLETED')).rejects.toThrow('db connection error');
        });
      });
    });
  });
});
