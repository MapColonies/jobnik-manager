import jsLogger from '@map-colonies/js-logger';
import { Creator, JobMode, JobName, Prisma, PrismaClient } from '@prisma/client';
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
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TTL: new Date(),
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
  describe('#DB connection', () => {
    describe('#createJob', () => {
      it('should return created job formatted', async function () {
        const jobEntity = createJobEntity({});
        const prismaCreateJobMock = jest.spyOn(prisma.job, 'create').mockResolvedValue(jobEntity);
        const convertPrismaToJobResponseStub = jest.spyOn(jobManager, 'convertPrismaToJobResponse');

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
        expect(convertPrismaToJobResponseStub).toHaveBeenCalledTimes(1);
        expect(job).toStrictEqual(jobManager.convertPrismaToJobResponse(jobEntity));
      });
    });
  });
});
