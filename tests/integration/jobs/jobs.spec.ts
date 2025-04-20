/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { JobOperationStatus, type JobMode, type Priority, type PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import type { MatcherContext } from '@jest/expect';
import type { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES, successMessages } from '@common/constants';
import { initConfig } from '@src/common/config';
import { errorMessages as commonErrorMessages } from '@src/common/errors';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { createJobRecord, createJobRequestBody, createJobRequestWithStagesBody, testJobId } from './helpers';

describe('job', function () {
  let requestSender: RequestSender<paths, operations>;
  let prisma: PrismaClient;
  let pool: Pool;

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
    pool = container.resolve<Pool>(SERVICES.PG_POOL);
  });

  afterEach(async () => {
    await pool.end();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('#FindJobs', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching job with stages when stages flag is true', async function () {
        const preDefinedJobRequestBody = { ...createJobRequestBody, jobMode: 'PRE_DEFINED' as JobMode };

        await requestSender.createJob({
          requestBody: preDefinedJobRequestBody,
        });

        const response = await requestSender.findJobs({ queryParams: { job_mode: 'PRE_DEFINED' as JobMode, should_return_stages: true } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.OK, body: [preDefinedJobRequestBody] });
        expect(response.body[0]).toHaveProperty('stages');
      });

      it('should return 200 status code and the matching job with stages when stages flag is false', async function () {
        const preDefinedJobRequestBody = { ...createJobRequestBody, jobMode: 'PRE_DEFINED' as JobMode };

        await requestSender.createJob({
          requestBody: preDefinedJobRequestBody,
        });

        const response = await requestSender.findJobs({ queryParams: { job_mode: 'PRE_DEFINED' as JobMode, should_return_stages: false } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response.body[0]).toMatchObject(preDefinedJobRequestBody);
        expect(response.body[0]).not.toHaveProperty('stages');
      });

      it('should return 200 status code and return the job without stages when stages flag is omitted', async function () {
        const preDefinedJobRequestBody = { ...createJobRequestBody, jobMode: 'PRE_DEFINED' as JobMode };

        await requestSender.createJob({
          requestBody: preDefinedJobRequestBody,
        });

        const response = await requestSender.findJobs({ queryParams: { job_mode: 'PRE_DEFINED' as JobMode } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response.body[0]).toMatchObject(preDefinedJobRequestBody);
        expect(response.body[0]).not.toHaveProperty('stages');
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
          body: { message: expect.stringMatching(/request\/query\/job_mode must be equal to one of the allowed values/) as MatcherContext },
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
        const response = await requestSender.createJob({
          requestBody: createJobRequestWithStagesBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: { status: JobOperationStatus.CREATED, ...createJobRequestWithStagesBody },
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
          body: { status: 'CREATED', ...createJobWithoutStagesRequestBody },
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
          body: { message: expect.stringMatching(/request\/body must have required property/) as MatcherContext },
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

  describe('#getJobById', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the job', async function () {
        const job = await createJobRecord({ ...createJobRequestBody }, prisma);
        const createdJobId = job.id;

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({ status: StatusCodes.OK, body: { status: JobOperationStatus.CREATED, ...createJobRequestBody } });
        expect(getJobResponse.body).not.toHaveProperty('stages');
      });

      it('should return 200 status code and return the job with stages when stages flag is true', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId }, queryParams: { should_return_stages: true } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({ status: StatusCodes.OK, body: { status: JobOperationStatus.CREATED, ...createJobRequestBody } });
        expect(getJobResponse.body).toHaveProperty('stages');
      });

      it('should return 200 status code and return the job without stages when stages flag is false', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId }, queryParams: { should_return_stages: false } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({ status: StatusCodes.OK, body: { status: JobOperationStatus.CREATED, ...createJobRequestBody } });
        expect(getJobResponse.body).not.toHaveProperty('stages');
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a specific validation error message detailing the non exists job', async function () {
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: testJobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as MatcherContext },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getJobById({ pathParams: { jobId: testJobId } });

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
        const getJobResponse = await requestSender.updateUserMetadata({ pathParams: { jobId: testJobId }, requestBody: { avi: 'avi' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'update').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateUserMetadata({ pathParams: { jobId: testJobId }, requestBody: {} });

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
        const getJobResponse = await requestSender.updateJobPriority({ pathParams: { jobId: testJobId }, requestBody: { priority: 'VERY_HIGH' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });

      it('should return 400 with specific error message for non-existent priority', async function () {
        const getJobResponse = await requestSender.updateJobPriority({
          pathParams: { jobId: testJobId },
          requestBody: { priority: 'MEGA_HIGH' as unknown as Priority },
        });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body\/priority must be equal to one of the allowed values:/) as MatcherContext },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateJobPriority({ pathParams: { jobId: testJobId }, requestBody: { priority: 'VERY_HIGH' } });

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
        expect(setStatusResponse).toMatchObject({ status: StatusCodes.BAD_REQUEST, body: { message: commonErrorMessages.invalidStatusChange } });
      });

      it('should return 404 with specific error message for non-existent job', async function () {
        const getJobResponse = await requestSender.updateStatus({
          pathParams: { jobId: testJobId },
          requestBody: { status: JobOperationStatus.COMPLETED },
        });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateStatus({ pathParams: { jobId: testJobId }, requestBody: { status: JobOperationStatus.PENDING } });

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

        await requestSender.updateStatus({ pathParams: { jobId: createdJobId }, requestBody: { status: JobOperationStatus.ABORTED } });
        const deleteResponse = await requestSender.deleteJob({ pathParams: { jobId: createdJobId } });
        const validateDeletionResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(deleteResponse).toSatisfyApiSpec();
        expect(deleteResponse).toMatchObject({
          status: StatusCodes.OK,
          body: { code: successMessages.jobDeletedSuccessfully },
        });

        expect(validateDeletionResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });

      it('should return 200 status code and delete the job only', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        await requestSender.updateStatus({ pathParams: { jobId: createdJobId }, requestBody: { status: JobOperationStatus.ABORTED } });
        const deleteResponse = await requestSender.deleteJob({ pathParams: { jobId: createdJobId } });
        const validateDeletionResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(deleteResponse).toSatisfyApiSpec();
        expect(deleteResponse).toMatchObject({
          status: StatusCodes.OK,
          body: { code: successMessages.jobDeletedSuccessfully },
        });

        expect(validateDeletionResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.deleteJob({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as MatcherContext },
        });
      });

      it('should return status code 400 when supplying job with not final state status', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const getJobResponse = await requestSender.deleteJob({ pathParams: { jobId: createdJobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: jobsErrorMessages.jobNotInFiniteState },
        });
      });

      it('should return 404 with specific error message for non-existent job', async function () {
        const response = await requestSender.deleteJob({ pathParams: { jobId: testJobId } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.deleteJob({
          pathParams: { jobId: testJobId },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });
});
