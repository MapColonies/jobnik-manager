import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { PrismaClient, Prisma, JobOperationStatus, Priority } from '@prismaClient';
import { illegalStatusTransitionErrorMessage, prismaKnownErrors } from '@src/common/errors';
import { JobManager } from '@src/jobs/models/manager';
import { JobMetrics } from '@src/jobs/models/metrics';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { JobCreateModel } from '@src/jobs/models/models';
import { randomUuid } from '@tests/unit/generator';
import { SERVICE_NAME } from '@src/common/constants';
import { jobEntityWithAbortStatus, jobEntityWithoutStages, jobEntityWithStages } from '../data';

let jobManager: JobManager;
const prisma = new PrismaClient();
const tracer = trace.getTracer(SERVICE_NAME);

// Create mock JobMetrics
const mockJobMetrics = {
  recordJobCompletionMetrics: jest.fn(),
  recordJobStatusTransition: jest.fn(),
} as unknown as JobMetrics;

const jobNotFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: prismaKnownErrors.recordNotFound, clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    jobManager = new JobManager(jsLogger({ enabled: false }), prisma, tracer, mockJobMetrics);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#Jobs', () => {
    describe('#createJob', () => {
      describe('#HappyPath', () => {
        it('should return a formatted job after creation', async function () {
          jest.spyOn(prisma.job, 'create').mockResolvedValue(jobEntityWithStages);
          const createJobParams = {
            name: jobEntityWithStages.name,
            data: jobEntityWithStages.data,
            userMetadata: jobEntityWithStages.userMetadata as Record<string, unknown>,
          } satisfies JobCreateModel;

          const job = await jobManager.createJob(createJobParams);
          expect(job).toMatchObject(createJobParams);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when creating job', async function () {
          jest.spyOn(prisma.job, 'create').mockRejectedValueOnce(new Error('db connection error'));

          const createJobParams = {
            name: jobEntityWithStages.name,
            data: jobEntityWithStages.data,
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
          const expectedJob = [
            {
              ...rest,
              stages: stage,
              creationTime: rest.creationTime.toISOString(),
              updateTime: rest.updateTime.toISOString(),
              tracestate: undefined,
            },
          ];

          expect(jobs).toMatchObject(expectedJob);
        });

        it('should return all formatted jobs when no criteria is provided', async function () {
          const jobEntity = { ...jobEntityWithoutStages };
          jest.spyOn(prisma.job, 'findMany').mockResolvedValue([jobEntity]);

          const jobs = await jobManager.getJobs(undefined);

          const { xstate, stage, tracestate, ...rest } = jobEntity;
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
          const expectedJob = {
            ...rest,
            stages: stage,
            tracestate: undefined,
            creationTime: rest.creationTime.toISOString(),
            updateTime: rest.updateTime.toISOString(),
          };

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
            jobsErrorMessages.priorityCannotBeUpdatedToSameValue
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
            illegalStatusTransitionErrorMessage(jobEntityWithoutStages.status, JobOperationStatus.COMPLETED)
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
