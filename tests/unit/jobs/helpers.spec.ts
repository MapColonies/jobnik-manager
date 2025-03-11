import { PrismaClient, Prisma, JobOperationStatus } from '@prisma/client';
import { jobStateMachine } from '@src/jobs/models/jobStateMachine';
import { createActor } from 'xstate';
import { findJobById } from '@src/jobs/models/helpers';

const prisma = new PrismaClient();

describe('JobManager', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('#Helpers', () => {
    describe('#findJobById', () => {
      describe('#HappyPath', () => {
        it('should return job entity by provided id', async function () {
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

          const jobId = jobEntity.id;
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);

          const job = await findJobById(jobId, prisma);

          expect(job).toMatchObject(jobEntity);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when getting desired job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(findJobById('some_id', prisma)).rejects.toThrow('db connection error');
        });
      });
    });
  });
});
