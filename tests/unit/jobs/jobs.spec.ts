import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { PrismaClient, Prisma, JobOperationStatus, Priority } from '@prismaClient';
import { illegalStatusTransitionErrorMessage, prismaKnownErrors } from '@src/common/errors';
import { JobManager } from '@src/jobs/models/manager';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { JobCreateModel } from '@src/jobs/models/models';
import { randomUuid } from '@tests/unit/generator';
import { SERVICE_NAME } from '@src/common/constants';
import { createMockPrismaClient } from '@tests/unit/mocks/prismaClientMock';
import { jobEntityWithAbortStatus, jobEntityWithoutStages, jobEntityWithStages } from '../data';

let jobManager: JobManager;
const prisma = createMockPrismaClient();
const tracer = trace.getTracer(SERVICE_NAME);
const jobNotFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: prismaKnownErrors.recordNotFound, clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    jobManager = new JobManager(jsLogger({ enabled: false }), prisma, tracer);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('#Jobs', () => {
    describe('#createJob', () => {
      describe('#HappyPath', () => {
        it('should return a formatted job after creation', async function () {
          vi.spyOn(prisma.job, 'create').mockResolvedValue(jobEntityWithStages);
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
          vi.spyOn(prisma.job, 'create').mockRejectedValueOnce(new Error('db connection error'));

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
          vi.spyOn(prisma.job, 'findMany').mockResolvedValue([mediumPriorityJob]);

          // Use API priority value
          const jobs = await jobManager.getJobs({ priority: 'MEDIUM' });

          const { xstate, stage, status, priority, ...rest } = mediumPriorityJob;
          // Status and priority are converted to API values
          const expectedJob = [
            {
              ...rest,
              status: 'PENDING',
              priority: 'MEDIUM',
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
          vi.spyOn(prisma.job, 'findMany').mockResolvedValue([jobEntity]);

          const jobs = await jobManager.getJobs(undefined);

          const { xstate, stage, tracestate, status, priority, ...rest } = jobEntity;
          // Status and priority are converted to API values
          const expectedJob = [
            {
              ...rest,
              status: 'PENDING',
              priority: 'HIGH',
              stages: stage,
              creationTime: rest.creationTime.toISOString(),
              updateTime: rest.updateTime.toISOString(),
            },
          ];

          expect(jobs).toMatchObject(expectedJob);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when finding jobs', async function () {
          vi.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.getJobs({ priority: Priority.MEDIUM })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#getJobById', () => {
      describe('#HappyPath', () => {
        it('should return a job matching the provided id', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);

          const jobs = await jobManager.getJobById(jobEntityWithoutStages.id);

          const { xstate, stage, status, priority, ...rest } = jobEntityWithoutStages;
          // Status and priority are converted from Prisma values to API values
          const expectedJob = {
            ...rest,
            status: 'PENDING', // API value
            priority: 'HIGH', // API value
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
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.getJobById('some_id')).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when retrieving a job', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.getJobById('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateUserMetadata', () => {
      describe('#HappyPath', () => {
        it("should successfully update job's user metadata by id", async function () {
          vi.spyOn(prisma.job, 'update').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.updateUserMetadata(jobEntityWithoutStages.id, { newData: 'test' })).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating user metadata of a non-existent job', async function () {
          vi.spyOn(prisma.job, 'update').mockRejectedValue(jobNotFoundError);

          await expect(jobManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating user metadata', async function () {
          vi.spyOn(prisma.job, 'update').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updatePriority', () => {
      describe('#HappyPath', () => {
        it("should successfully update job's priority by id", async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);
          vi.spyOn(prisma.job, 'update').mockResolvedValue(jobEntityWithoutStages);

          // Use API priority value (uppercase)
          await expect(jobManager.updatePriority(jobEntityWithoutStages.id, 'MEDIUM')).toResolve();
        });

        it('should not perform a job priority update when the provided priority matches the current job priority', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithoutStages, priority: Priority.HIGH });

          // Use API priority value - should throw because job already has HIGH priority (Prisma: 'High')
          await expect(jobManager.updatePriority(jobEntityWithoutStages.id, 'HIGH')).rejects.toThrow(
            jobsErrorMessages.priorityCannotBeUpdatedToSameValue
          );
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating priority of a non-existent job', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          // Use API priority value
          await expect(jobManager.updatePriority('someId', 'MEDIUM')).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating priority', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          // Use API priority value
          await expect(jobManager.updatePriority('someId', 'MEDIUM')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateStatus', () => {
      describe('#HappyPath', () => {
        it('should successfully update job status by id', async function () {
          const jobId = randomUuid;

          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithoutStages, id: jobId });
          vi.spyOn(prisma.job, 'update').mockResolvedValue(jobEntityWithoutStages);

          // Use API status value
          await expect(jobManager.updateStatus(jobId, 'PENDING')).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating status for a job that does not exist', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          // Use API status value
          await expect(jobManager.updateStatus('someId', 'PENDING')).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });

        it('should fail on invalid status transition', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);

          // XState machine initial state is 'CREATED' (uppercase), Prisma status is 'Completed'
          // Use API status value
          await expect(jobManager.updateStatus(jobEntityWithoutStages.id, 'COMPLETED')).rejects.toThrow(
            illegalStatusTransitionErrorMessage('CREATED', JobOperationStatus.COMPLETED)
          );
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating status', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          // Use API status value
          await expect(jobManager.updateStatus('someId', 'COMPLETED')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#deleteJob', () => {
      describe('#HappyPath', () => {
        it('should successfully delete a job and its associated stages', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithAbortStatus);
          vi.spyOn(prisma.job, 'delete').mockResolvedValue(jobEntityWithAbortStatus);

          await expect(jobManager.deleteJob(jobEntityWithAbortStatus.id)).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should return an error for a request to delete non finalized-status job', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.deleteJob(jobEntityWithoutStages.id)).rejects.toThrow(jobsErrorMessages.jobNotInFiniteState);
        });

        it('should return an error for a request to delete a non-existent job', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.deleteJob('someId')).rejects.toThrow(jobsErrorMessages.jobNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when deleting a job', async function () {
          vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.deleteJob('someId')).rejects.toThrow('db connection error');
        });
      });
    });
  });
});
