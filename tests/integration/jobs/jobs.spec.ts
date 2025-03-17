/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import type { paths, operations } from '@openapi';
import { initConfig } from '@src/common/config';
import { JobOperationStatus, type JobMode, type Priority, type PrismaClient } from '@prisma/client';
import { BAD_STATUS_CHANGE } from '@src/common/errors';
import { JOB_NOT_FOUND_MSG } from '@src/jobs/models/errors';
import { StageCreateModel, successMessages } from '@src/stages/models/models';
import { createJobRecord, createJobRequestBody } from './helpers';

describe('job', function () {
  let requestSender: RequestSender<paths, operations>;
  let prisma: PrismaClient;
  const jobId = 'bd314e87-4f4e-4fc7-84cb-d8bf10b0b0e7';

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    const [app, container] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
    prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('#FindJobs', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching job', async function () {
        const preDefinedJobRequestBody = { ...createJobRequestBody, type: 'PRE_DEFINED' as JobMode };

        await requestSender.createJob({
          requestBody: preDefinedJobRequestBody,
        });

        const response = await requestSender.findJobs({ queryParams: { job_mode: 'PRE_DEFINED' as JobMode } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.OK, body: [preDefinedJobRequestBody] });
      });
    });

    describe('Bad Path', function () {
      it('should return 400 status code and a relevant validation error message when the job mode is incorrect', async function () {
        const response = await requestSender.findJobs({ queryParams: { job_mode: 'WRONG_VALUE' as JobMode } });

        if (response.status !== StatusCodes.BAD_REQUEST) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/query\/job_mode must be equal to one of the allowed values/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.findJobs({});

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#CreateJob', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and create the job', async function () {
        const createJobWithStagesRequestBody = { ...createJobRequestBody, data: { stages: [{ data: {}, type: 'DEFAULT', userMetadata: {} }] } };

        const response = await requestSender.createJob({
          requestBody: createJobWithStagesRequestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: { status: JobOperationStatus.CREATED, stages: [{ data: {}, type: 'DEFAULT', userMetadata: {} }], ...createJobWithStagesRequestBody },
        });
      });

      it('should return 200 status code and create the job without stages array', async function () {
        const createJobWithoutStagesRequestBody = { ...createJobRequestBody, data: {} };

        const response = await requestSender.createJob({
          requestBody: createJobWithoutStagesRequestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: { status: 'CREATED', stages: [], ...createJobWithoutStagesRequestBody },
        });
      });
    });

    describe('Bad Path', function () {
      it('should return a 400 status code along with a specific validation error message detailing the missing required parameters for job creation', async function () {
        const badRequestBody = {
          name: 'DEFAULT',
        };

        const response = await requestSender.createJob({
          requestBody: badRequestBody,
        });

        if (response.status !== StatusCodes.BAD_REQUEST) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/body must have required property/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'create').mockRejectedValueOnce(new Error('Database error'));
        const response = await requestSender.createJob({
          requestBody: createJobRequestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#addStages', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and create the related stages for current job', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const createStagesPayload = {
          data: {},
          type: 'DEFAULT',
          userMetadata: {},
        } satisfies StageCreateModel;

        const response = await requestSender.addStages({
          requestBody: [createStagesPayload],
          pathParams: { jobId: createdJobId },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: { status: 'CREATED', stages: [createStagesPayload], data: { stages: [createStagesPayload] } },
        });
      });
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.addStages({ requestBody: [], pathParams: { jobId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) },
        });
      });

      it('should return 404 when attempting to update a non-existent job ID', async function () {
        const createStagesPayload = {
          data: {},
          type: 'DEFAULT',
          userMetadata: {},
        } satisfies StageCreateModel;

        const response = await requestSender.addStages({
          requestBody: [createStagesPayload],
          pathParams: { jobId: jobId },
        });

        if (response.status !== StatusCodes.NOT_FOUND) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.addStages({
          requestBody: [],
          pathParams: { jobId: jobId },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getJobById', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the job', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({ status: StatusCodes.OK, body: { status: JobOperationStatus.CREATED, ...createJobRequestBody } });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a specific validation error message detailing the non exists job', async function () {
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: jobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getJobById({ pathParams: { jobId: jobId } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#updateUserMetadata', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify job's userMetadata object", async function () {
        const userMetadataInput = { someTestKey: 'someTestData' };
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const updateUserMetadataResponse = await requestSender.updateUserMetadata({
          pathParams: { jobId: createdJobId },
          requestBody: userMetadataInput,
        });

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(updateUserMetadataResponse).toSatisfyApiSpec();
        expect(getJobResponse.body).toMatchObject({ userMetadata: userMetadataInput });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a message that specifies that a job with the given id was not found', async function () {
        const getJobResponse = await requestSender.updateUserMetadata({ pathParams: { jobId: jobId }, requestBody: { avi: 'avi' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'update').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateUserMetadata({ pathParams: { jobId }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#updateJobPriority', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify job's priority", async function () {
        const createJobRequestBodyWithPriority = { ...createJobRequestBody, priority: 'VERY_LOW' as Priority };
        const job = await createJobRecord(createJobRequestBodyWithPriority, prisma);
        const createdJobId = job.id;

        const setPriorityResponse = await requestSender.updateJobPriority({
          pathParams: { jobId: createdJobId },
          requestBody: { priority: 'VERY_HIGH' },
        });

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(setPriorityResponse).toSatisfyApiSpec();
        expect(getJobResponse.body).toMatchObject({ priority: 'VERY_HIGH' });
      });

      it("should return 204 status code without modifying job's priority", async function () {
        const createJobRequestBodyWithPriority = { ...createJobRequestBody, priority: 'VERY_LOW' as Priority };
        const job = await createJobRecord(createJobRequestBodyWithPriority, prisma);
        const createdJobId = job.id;

        const setPriorityResponse = await requestSender.updateJobPriority({
          pathParams: { jobId: createdJobId },
          requestBody: { priority: 'VERY_LOW' },
        });

        expect(setPriorityResponse).toSatisfyApiSpec();
        expect(setPriorityResponse).toMatchObject({
          status: StatusCodes.NO_CONTENT,
          headers: { reason: 'Priority cannot be updated to the same value.' },
        });
      });
    });

    describe('Bad Path', function () {
      it('should return 404 with specific error message for non-existent job', async function () {
        const getJobResponse = await requestSender.updateJobPriority({ pathParams: { jobId: jobId }, requestBody: { priority: 'VERY_HIGH' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });

      it('should return 400 with specific error message for non-existent priority', async function () {
        const getJobResponse = await requestSender.updateJobPriority({
          pathParams: { jobId: jobId },
          requestBody: { priority: 'MEGA_HIGH' as unknown as Priority },
        });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/body\/priority must be equal to one of the allowed values:/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateJobPriority({ pathParams: { jobId: jobId }, requestBody: { priority: 'VERY_HIGH' } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#updateStatus', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify job's status", async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const setStatusResponse = await requestSender.updateStatus({
          pathParams: { jobId: createdJobId },
          requestBody: { status: JobOperationStatus.PENDING },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(getJobResponse).toHaveProperty('body.status', JobOperationStatus.PENDING);
      });
    });

    describe('Bad Path', function () {
      it('should return 400 with detailed error for invalid status transition', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const setStatusResponse = await requestSender.updateStatus({
          pathParams: { jobId: createdJobId },
          requestBody: { status: JobOperationStatus.COMPLETED },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toMatchObject({ status: StatusCodes.BAD_REQUEST, body: { message: BAD_STATUS_CHANGE } });
      });

      it('should return 404 with specific error message for non-existent job', async function () {
        const getJobResponse = await requestSender.updateStatus({
          pathParams: { jobId: jobId },
          requestBody: { status: JobOperationStatus.COMPLETED },
        });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateStatus({ pathParams: { jobId: jobId }, requestBody: { status: JobOperationStatus.PENDING } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#deleteJob', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and delete the job with related stages', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const deleteResponse = await requestSender.deleteJob({ pathParams: { jobId: createdJobId } });
        const validateDeletionResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(deleteResponse).toSatisfyApiSpec();
        expect(deleteResponse).toMatchObject({
          status: StatusCodes.OK,
          body: { code: successMessages.jobDeletedSuccessfully },
        });

        expect(validateDeletionResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });

      it('should return 200 status code and delete the job only', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const deleteResponse = await requestSender.deleteJob({ pathParams: { jobId: createdJobId } });
        const validateDeletionResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(deleteResponse).toSatisfyApiSpec();
        expect(deleteResponse).toMatchObject({
          status: StatusCodes.OK,
          body: { code: successMessages.jobDeletedSuccessfully },
        });

        expect(validateDeletionResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) },
        });
      });

      it('should return 404 with specific error message for non-existent job', async function () {
        const response = await requestSender.deleteJob({ pathParams: { jobId } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.deleteJob({
          pathParams: { jobId },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });
});
