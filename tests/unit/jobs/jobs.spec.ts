import jsLogger from '@map-colonies/js-logger';
import { PrismaClient, Prisma, JobOperationStatus, Priority } from '@prismaClient';
import { errorMessages as commonErrorMessages, prismaKnownErrors } from '@src/common/errors';
import { JobManager } from '@src/jobs/models/manager';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { JobCreateModel } from '@src/jobs/models/models';
import { StageCreateModel } from '@src/stages/models/models';
import { randomUuid } from '@tests/unit/generator';
import { jobEntityWithAbortStatus, jobEntityWithEmptyStagesArr, jobEntityWithoutStages, jobEntityWithStages, stageEntity } from '../data';

let jobManager: JobManager;
const prisma = new PrismaClient();

const jobNotFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: prismaKnownErrors.recordNotFound, clientVersion: '1' });

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
        it('should return a formatted job after creation', async function () {
          jest.spyOn(prisma.job, 'create').mockResolvedValue(jobEntityWithStages);
          const stagePayload = { data: stageEntity.data, type: stageEntity.name, userMetadata: stageEntity.userMetadata } satisfies StageCreateModel;

          const createJobParams = {
            name: jobEntityWithStages.name,
            data: jobEntityWithStages.data,
            jobMode: jobEntityWithStages.jobMode,
            userMetadata: jobEntityWithStages.userMetadata as Record<string, unknown>,
            stages: [stagePayload],
          } satisfies JobCreateModel;

          const job = await jobManager.createJob(createJobParams);
          expect(job).toMatchObject(createJobParams);
          expect(job.stages).toMatchObject([{ jobId: stageEntity.jobId, id: stageEntity.id }]);
        });

        it('should return created job formatted with empty stage array', async function () {
          jest.spyOn(prisma.job, 'create').mockResolvedValue(jobEntityWithEmptyStagesArr);

          const createJobParams = {
            name: jobEntityWithoutStages.name,
            data: jobEntityWithoutStages.data,
            jobMode: jobEntityWithoutStages.jobMode,
            userMetadata: jobEntityWithoutStages.userMetadata as Record<string, unknown>,
          } satisfies JobCreateModel;

          const job = await jobManager.createJob(createJobParams);

          expect(job).toMatchObject(createJobParams);
          expect(job.stages).toMatchObject([]);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when creating job', async function () {
          jest.spyOn(prisma.job, 'create').mockRejectedValueOnce(new Error('db connection error'));

          const createJobParams = {
            name: jobEntityWithStages.name,
            data: jobEntityWithStages.data,
            jobMode: jobEntityWithStages.jobMode,
            userMetadata: jobEntityWithStages.userMetadata as Record<string, unknown>,
          } satisfies JobCreateModel;

          await expect(jobManager.createJob(createJobParams)).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#findJobs', () => {
      describe('#HappyPath', () => {
        it('should return formatted jobs matching the search criteria', async function () {
          const mediumPriorityJob = { ...jobEntityWithoutStages, priority: Priority.MEDIUM };
          jest.spyOn(prisma.job, 'findMany').mockResolvedValue([mediumPriorityJob]);

          const jobs = await jobManager.getJobs({ priority: Priority.MEDIUM });

          const { xstate, stage, ...rest } = mediumPriorityJob;
          const expectedJob = [{ ...rest, stages: stage, creationTime: rest.creationTime.toISOString(), updateTime: rest.updateTime.toISOString() }];

          expect(jobs).toMatchObject(expectedJob);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when finding jobs', async function () {
          jest.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.getJobs({ priority: Priority.MEDIUM })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#getJobById', () => {
      describe('#HappyPath', () => {
        it('should return a job matching the provided id', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);

          const jobs = await jobManager.getJobById(jobEntityWithoutStages.id);

          const { xstate, stage, ...rest } = jobEntityWithoutStages;
          const expectedJob = { ...rest, stages: stage, creationTime: rest.creationTime.toISOString(), updateTime: rest.updateTime.toISOString() };

          expect(jobs).toMatchObject(expectedJob);
        });
      });

      describe('#BadPath', () => {
        it("should fail with a 'job not found' error when retrieving the job", async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.getJobById('some_id')).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when retrieving a job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.getJobById('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateUserMetadata', () => {
      describe('#HappyPath', () => {
        it("should successfully update job's user metadata by id", async function () {
          jest.spyOn(prisma.job, 'update').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.updateUserMetadata(jobEntityWithoutStages.id, { newData: 'test' })).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating user metadata of a non-existent job', async function () {
          jest.spyOn(prisma.job, 'update').mockRejectedValue(jobNotFoundError);

          await expect(jobManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating user metadata', async function () {
          jest.spyOn(prisma.job, 'update').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updatePriority', () => {
      describe('#HappyPath', () => {
        it("should successfully update job's priority by id", async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);
          jest.spyOn(prisma.job, 'update').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.updatePriority(jobEntityWithoutStages.id, Priority.MEDIUM)).toResolve();
        });

        it('should not perform a job priority update when the provided priority matches the current job priority', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithoutStages, priority: Priority.HIGH });

          await expect(jobManager.updatePriority(jobEntityWithoutStages.id, Priority.HIGH)).rejects.toThrow(
            'Priority cannot be updated to the same value.'
          );
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating priority of a non-existent job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.updatePriority('someId', Priority.MEDIUM)).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating priority', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updatePriority('someId', Priority.MEDIUM)).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateStatus', () => {
      describe('#HappyPath', () => {
        it('should successfully update job status by id', async function () {
          const jobId = randomUuid;

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithoutStages, id: jobId });
          jest.spyOn(prisma.job, 'update').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.updateStatus(jobId, JobOperationStatus.PENDING)).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating status for a job that does not exist', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.updateStatus('someId', JobOperationStatus.PENDING)).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });

        it('should fail on invalid status transition', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.updateStatus(jobEntityWithoutStages.id, JobOperationStatus.COMPLETED)).rejects.toThrow(
            commonErrorMessages.invalidStatusChange
          );
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating status', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updateStatus('someId', JobOperationStatus.COMPLETED)).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#deleteJob', () => {
      describe('#HappyPath', () => {
        it('should successfully delete a job and its associated stages', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithAbortStatus);
          jest.spyOn(prisma.job, 'delete').mockResolvedValue(jobEntityWithAbortStatus);

          await expect(jobManager.deleteJob(jobEntityWithAbortStatus.id)).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should return an error for a request to delete non finalized-status job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.deleteJob(jobEntityWithoutStages.id)).rejects.toThrow(jobsErrorMessages.jobNotInFiniteState);
        });

        it('should return an error for a request to delete a non-existent job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.deleteJob('someId')).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when deleting a job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.deleteJob('someId')).rejects.toThrow('db connection error');
        });
      });
    });
  });
});
