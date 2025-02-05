import jsLogger from '@map-colonies/js-logger';
import type { Creator, JobMode, JobName, Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { JobManager } from '@src/jobs/models/jobManager';

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
  } satisfies Prisma.JobGetPayload<Record<string, never>>;
  return { ...jobEntity, ...override };
}

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
            name: 'DEFAULT' as JobName,
            creator: 'UNKNOWN' as Creator,
            data: { stages: [] },
            type: 'PRE_DEFINED' as JobMode,
            notifications: {},
            userMetadata: {},
          };

          const job = await jobManager.createJob(createJobParams);

          expect(prismaCreateJobMock).toHaveBeenCalledTimes(1);
          expect(job).toMatchObject(createJobParams);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when creating job', async function () {
          const prismaCreateJobMock = jest.spyOn(prisma.job, 'create').mockRejectedValueOnce(new Error('db connection error'));

          const createJobParams = {
            name: 'DEFAULT' as JobName,
            creator: 'UNKNOWN' as Creator,
            data: { stages: [] },
            type: 'PRE_DEFINED' as JobMode,
            notifications: {},
            userMetadata: {},
          };

          await expect(jobManager.createJob(createJobParams)).rejects.toThrow('db connection error');

          expect(prismaCreateJobMock).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('#findJobs', () => {
      describe('#HappyPath', () => {
        it('should return array with single job formatted object by criteria', async function () {
          const jobEntity = createJobEntity({ expirationTime: undefined, ttl: undefined });
          const prismaCreateJobMock = jest.spyOn(prisma.job, 'findMany').mockResolvedValue([jobEntity]);

          const jobs = await jobManager.getJobs({ creator: 'UNKNOWN' });
          const expectedJob = [{ ...jobEntity, creationTime: jobEntity.creationTime.toISOString(), updateTime: jobEntity.updateTime.toISOString() }];

          expect(prismaCreateJobMock).toHaveBeenCalledTimes(1);
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
  });
});
