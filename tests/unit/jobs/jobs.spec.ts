/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { PrismaClient, Prisma, StageName, JobOperationStatus } from '@prisma/client';
import { BAD_STATUS_CHANGE } from '@src/common/errors';
import { JobManager } from '@src/jobs/models/manager';
import { JOB_NOT_FOUND_MSG } from '@src/jobs/models/errors';
import { JobCreateModel } from '@src/jobs/models/models';
import { createJobEntity, createStageEntity } from './helpers';
import { anotherStageId, jobEntityWithoutStages, jobEntityWithStages, jobId, stageEntity, stageId } from './data';

let jobManager: JobManager;
const prisma = new PrismaClient();

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
        it('should return a formatted job after creation', async function () {
          jest.spyOn(prisma.job, 'create').mockResolvedValue(jobEntityWithStages);

          const createJobParams = {
            name: jobEntityWithStages.name,
            creator: jobEntityWithStages.creator,
            data: jobEntityWithStages.data,
            type: jobEntityWithStages.type,
            notifications: jobEntityWithStages.notifications as Record<string, never>,
            userMetadata: jobEntityWithStages.userMetadata as Record<string, unknown>,
          } satisfies JobCreateModel;

          const job = await jobManager.createJob(createJobParams);

          expect(job).toMatchObject(createJobParams);
          expect(job.stages).toMatchObject([{ jobId: stageEntity.job_id, id: stageEntity.id }]);
        });

        it('should return created job formatted with empty stage array', async function () {
          jest.spyOn(prisma.job, 'create').mockResolvedValue(jobEntityWithoutStages);

          const createJobParams = {
            name: jobEntityWithoutStages.name,
            creator: jobEntityWithoutStages.creator,
            data: jobEntityWithoutStages.data,
            type: jobEntityWithoutStages.type,
            notifications: jobEntityWithoutStages.notifications as Record<string, never>,
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
            creator: jobEntityWithStages.creator,
            data: jobEntityWithStages.data,
            type: jobEntityWithStages.type,
            notifications: jobEntityWithStages.notifications as Record<string, never>,
            userMetadata: jobEntityWithStages.userMetadata as Record<string, unknown>,
          } satisfies JobCreateModel;

          await expect(jobManager.createJob(createJobParams)).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#findJobs', () => {
      describe('#HappyPath', () => {
        it('should return formatted jobs matching the search criteria', async function () {
          jest.spyOn(prisma.job, 'findMany').mockResolvedValue([jobEntityWithoutStages]);

          const jobs = await jobManager.getJobs({ creator: 'UNKNOWN' });

          const { xstate, Stage, ttl, expirationTime, ...rest } = jobEntityWithoutStages;
          const expectedJob = [{ ...rest, stages: Stage, creationTime: rest.creationTime.toISOString(), updateTime: rest.updateTime.toISOString() }];

          expect(jobs).toMatchObject(expectedJob);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when finding jobs', async function () {
          jest.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.getJobs({ creator: 'UNKNOWN' })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#getJobById', () => {
      describe('#HappyPath', () => {
        it('should return a job matching the provided id', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithoutStages, ttl: null, expirationTime: null });

          const jobs = await jobManager.getJobById(jobEntityWithoutStages.id, false);

          const { xstate, Stage, ttl, expirationTime, ...rest } = jobEntityWithoutStages;
          const expectedJob = { ...rest, stages: Stage, creationTime: rest.creationTime.toISOString(), updateTime: rest.updateTime.toISOString() };

          expect(jobs).toMatchObject(expectedJob);
        });
      });

      describe('#BadPath', () => {
        it("should fail with a 'job not found' error when retrieving the job", async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.getJobById('some_id', false)).rejects.toThrow(JOB_NOT_FOUND_MSG);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when retrieving a job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.getJobById('some_id', false)).rejects.toThrow('db connection error');
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

          await expect(jobManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow(JOB_NOT_FOUND_MSG);
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

          await expect(jobManager.updatePriority(jobEntityWithoutStages.id, 'MEDIUM')).toResolve();
        });

        it('should not perform a job priority update when the provided priority matches the current job priority', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ ...jobEntityWithoutStages, priority: 'HIGH' });

          await expect(jobManager.updatePriority(jobEntityWithoutStages.id, 'HIGH')).rejects.toThrow('Priority cannot be updated to the same value.');
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating priority of a non-existent job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.updatePriority('someId', 'MEDIUM')).rejects.toThrow(JOB_NOT_FOUND_MSG);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating priority', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updatePriority('someId', 'MEDIUM')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateStatus', () => {
      describe('#HappyPath', () => {
        it('should successfully update job status by id', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.updateStatus(jobEntityWithoutStages.id, JobOperationStatus.PENDING)).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should fail when updating status for a job that does not exist', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.updateStatus('someId', JobOperationStatus.PENDING)).rejects.toThrow(JOB_NOT_FOUND_MSG);
        });

        it('should fail on invalid status transition', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntityWithoutStages);

          await expect(jobManager.updateStatus(jobEntityWithoutStages.id, JobOperationStatus.COMPLETED)).rejects.toThrow(BAD_STATUS_CHANGE);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when updating status', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.updateStatus('someId', JobOperationStatus.COMPLETED)).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#addStages', () => {
      describe('#HappyPath', () => {
        it('should add new stages to existing job stages', async function () {
          const stagePayload = {
            data: { someData: { value: 'avi' } },
            type: 'DEFAULT' as StageName,
            userMetadata: {},
          };

          const anotherStagePayload = {
            data: { someData: { value: 'happy avi' } },
            type: 'DEFAULT' as StageName,
            userMetadata: { someData: '123' },
          };

          const stageEntity = createStageEntity({ job_id: jobId, id: stageId });
          const anotherStageEntity = createStageEntity({ job_id: jobId, id: anotherStageId });

          const jobWithOneStageEntity = createJobEntity({
            id: jobId,
            data: { stages: [stagePayload] },
            Stage: [stageEntity],
          });

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithOneStageEntity);

          // combine updated Job data with the new stage data
          const unifiedStageData = [stagePayload, anotherStagePayload];
          const stagesArray = [stageEntity, anotherStageEntity];
          const jobWithAddedStagesEntity = { ...jobWithOneStageEntity, Stage: stagesArray, data: { stages: unifiedStageData } };

          jest.spyOn(prisma.job, 'update').mockResolvedValue(jobWithAddedStagesEntity);

          const job = await jobManager.addStages(jobId, [anotherStagePayload]);

          // Extract unnecessary fields from the job object and assemble the expected result
          const { Stage, xstate, name, ttl, expirationTime, updateTime, creationTime, ...rest } = jobWithAddedStagesEntity;

          const {
            xstate: stagesXstate1,
            name: stageName1,
            percentage: stagePercentage1,
            job_id: jobId1,
            summary: stageSummary1,
            id: stageId1,
            ...dataStage1
          } = Stage[0];

          const {
            xstate: stagesXstate2,
            name: stageName2,
            percentage: stagePercentage2,
            job_id: jobId2,
            summary: stageSummary2,
            id: stageId2,
            ...dataStage2
          } = Stage[1];
          const expectedJobResult = { ...rest, stages: [dataStage1, dataStage2] };

          expect(job).toMatchObject(expectedJobResult);
        });

        it('should return the job with newly added stages and updated data, where the job initially had no stages', async function () {
          const stagesPayload = [
            {
              data: {},
              type: 'DEFAULT' as StageName,
              userMetadata: {},
            },
          ];

          const stageEntity = createStageEntity({ data: {}, job_id: jobId, id: stageId });
          const jobWithoutStagesEntity = createJobEntity({ id: jobId });
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobWithoutStagesEntity);

          const jobWithStagesEntity = { ...jobWithoutStagesEntity, Stage: [stageEntity], data: { stages: stagesPayload } };

          jest.spyOn(prisma.job, 'update').mockResolvedValueOnce(jobWithStagesEntity);

          const job = await jobManager.addStages(jobId, stagesPayload);

          const { Stage, xstate, name, ttl, expirationTime, updateTime, creationTime, ...rest } = jobWithStagesEntity;
          const { xstate: stagesXstate, name: stageName, percentage, job_id, summary, id, ...dataStage } = Stage[0];
          const expectedJobResult = { ...rest, stages: [dataStage] };

          expect(job).toMatchObject(expectedJobResult);
        });
      });

      describe('#BadPath', () => {
        it('should reject adding stages to a non-existent job', async function () {
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

          await expect(jobManager.addStages('someId', [])).rejects.toThrow(JOB_NOT_FOUND_MSG);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when adding stages', async function () {
          const jobEntity = createJobEntity({});
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValueOnce(jobEntity);
          jest.spyOn(prisma.job, 'update').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.addStages(jobEntity.id, [])).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#deleteJob', () => {
      describe('#HappyPath', () => {
        it('should successfully delete a job and its associated stages', async function () {
          const jobEntity = createJobEntity({});

          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);
          jest.spyOn(prisma.job, 'delete').mockResolvedValue(jobEntity);

          await expect(jobManager.deleteJob(jobEntity.id)).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should return an error for a request to delete a non-existent job', async function () {
          jest.spyOn(prisma.job, 'delete').mockRejectedValue(jobNotFoundError);

          await expect(jobManager.deleteJob('someId')).rejects.toThrow(JOB_NOT_FOUND_MSG);
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when deleting a job', async function () {
          jest.spyOn(prisma.job, 'delete').mockRejectedValueOnce(new Error('db connection error'));

          await expect(jobManager.deleteJob('someId')).rejects.toThrow('db connection error');
        });
      });
    });
  });
});
