/* eslint-disable @typescript-eslint/naming-convention */
import { describe, beforeEach, afterEach, it, expect, beforeAll, vi } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import type { paths, operations } from '@openapi';
import { JobOperationStatus, Priority, StageOperationStatus, type PrismaClient } from '@prismaClient';
import { getApp } from '@src/app';
import { SERVICES, successMessages } from '@common/constants';
import { initConfig } from '@src/common/config';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { abortedStageXstatePersistentSnapshot, completedStageXstatePersistentSnapshot, pendingStageXstatePersistentSnapshot } from '@tests/unit/data';
import { JobCreateModel } from '@src/jobs/models/models';
import { DEFAULT_TRACEPARENT } from '@src/common/utils/tracingHelpers';
import { illegalStatusTransitionErrorMessage } from '@src/common/errors';
import { createJobnikTree, createMockPrismaError, createMockUnknownDbError } from '../common/utils';
import { createJobRecord, createJobRequestBody, testJobId } from './helpers';

const memoryExporter = new InMemorySpanExporter();
const spanProcessor = new SimpleSpanProcessor(memoryExporter);
const provider = new NodeTracerProvider({ spanProcessors: [spanProcessor] });
provider.register();

describe('job', function () {
  let requestSender: RequestSender<paths, operations>;
  let prisma: PrismaClient;

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

    requestSender = await createRequestSender<paths, operations>('openapi3-v1.yaml', app);
    prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    memoryExporter.reset();
  });

  describe('#FindJobs', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching job with stages when stages flag is true', async function () {
        await createJobnikTree(
          prisma,
          { xstate: pendingStageXstatePersistentSnapshot, status: JobOperationStatus.PENDING, traceparent: DEFAULT_TRACEPARENT },
          {
            summary: { ...defaultStatusCounts, total: 1, pending: 1 },
            status: StageOperationStatus.PENDING,
            xstate: pendingStageXstatePersistentSnapshot,
          },
          [],
          { createStage: true, createTasks: false }
        );

        const response = await requestSender.findJobs({ queryParams: { should_return_stages: true } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response.body).toBeArray();
        expect(response.body).not.toHaveLength(0);
        expect(response.body[0]).toHaveProperty('stages');
      });

      it('should return 200 status code and the matching job with stages when stages flag is false', async function () {
        const jobRequestBody = createJobRequestBody;

        await requestSender.createJob({
          requestBody: jobRequestBody,
        });

        const response = await requestSender.findJobs({ queryParams: { should_return_stages: false } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response.body[0]).toMatchObject(jobRequestBody);
        expect(response.body[0]).not.toHaveProperty('stages');
      });

      it('should return 200 status code and return the job without stages when stages flag is omitted', async function () {
        const jobRequestBody = createJobRequestBody;

        await requestSender.createJob({
          requestBody: jobRequestBody,
        });

        const response = await requestSender.findJobs({ queryParams: {} });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response.body[0]).toMatchObject(jobRequestBody);
        expect(response.body[0]).not.toHaveProperty('stages');
      });
    });

    describe('Bad Path', function () {
      it('should return 400 status code and a relevant validation error message when the job priority param is incorrect', async function () {
        const response = await requestSender.findJobs({ queryParams: { priority: 'BAD_PRIORITY' as Priority } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: {
            message: expect.stringMatching(/request\/query\/priority must be equal to one of the allowed values/) as string,
            code: 'VALIDATION_ERROR',
          },
        });
      });

      it('should return 400 status code and a relevant validation error message when adding unknown query parameters', async function () {
        const response = await requestSender.findJobs({ queryParams: { someExtraParam: 'FOO' } as unknown as Record<string, unknown> });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/Unknown query parameter/) as string, code: 'VALIDATION_ERROR' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        vi.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(error);

        const response = await requestSender.findJobs({});

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = new Error('Database error');
        // @ts-expect-error using this flag to mark the error as a Prisma error
        error.isPrismaError = false;
        vi.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(error);

        const response = await requestSender.findJobs({});

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error', code: 'UNKNOWN_ERROR' } });
      });
    });
  });

  describe('#CreateJob', function () {
    describe('Happy Path', function () {
      it('should return 201 status code and create the job', async function () {
        const response = await requestSender.createJob({
          requestBody: createJobRequestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: { status: JobOperationStatus.PENDING, ...createJobRequestBody },
        });
      });

      it('should return 201 status code and create the job with generated traceparent from active span', async function () {
        const response = await requestSender.createJob({
          requestBody: { ...createJobRequestBody, traceparent: undefined },
        });

        await memoryExporter.forceFlush();
        const finishedSpanContext = memoryExporter.getFinishedSpans()[0]?.spanContext();

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            status: JobOperationStatus.PENDING,
            traceparent: `00-${finishedSpanContext?.traceId}-${finishedSpanContext?.spanId}-0${finishedSpanContext?.traceFlags}`,
          },
        });
      });

      it('should return 201 status code and create the job with provided traceparent and tracestate', async function () {
        const response = await requestSender.createJob({
          requestBody: { ...createJobRequestBody, traceparent: '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01', tracestate: 'foo=bar' },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            status: JobOperationStatus.PENDING,
            traceparent: '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01',
            tracestate: 'foo=bar',
          },
        });
      });

      it('should return 201 status code and create the job with provided traceparent without tracestate', async function () {
        const response = await requestSender.createJob({
          requestBody: { ...createJobRequestBody, traceparent: '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01', tracestate: undefined },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            status: JobOperationStatus.PENDING,
            traceparent: '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01',
          },
        });
        expect(response.body).not.toHaveProperty('tracestate');
      });
    });

    describe('Bad Path', function () {
      it('should return a 400 status code along with a specific validation error message detailing the missing required parameters for job creation', async function () {
        const badRequestBody = {
          name: 'DEFAULT',
        } as unknown as JobCreateModel;

        const response = await requestSender.createJob({
          requestBody: badRequestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body must have required property/) as string, code: 'VALIDATION_ERROR' },
        });
      });

      it('should return 400 when the request contains an invalid traceparent format', async function () {
        const createJobResponse = await requestSender.createJob({
          requestBody: { ...createJobRequestBody, traceparent: 'INVALID_TRACEPARENT', tracestate: undefined },
        });

        expect(createJobResponse).toSatisfyApiSpec();
        expect(createJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body\/traceparent must match pattern/) as string, code: 'VALIDATION_ERROR' },
        });
      });

      it('should return 400 when the request contains to short name parameter', async function () {
        const createJobResponse = await requestSender.createJob({
          requestBody: { ...createJobRequestBody, name: '1' },
        });

        expect(createJobResponse).toSatisfyApiSpec();
        expect(createJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: {
            message: expect.stringMatching(/request\/body\/name must NOT have fewer than 2 characters/) as string,
            code: 'VALIDATION_ERROR',
          },
        });
      });

      it('should return 400 when the request contains additional params', async function () {
        const createJobResponse = await requestSender.createJob({
          requestBody: { ...createJobRequestBody, someAdditionalParams: 'foo' } as unknown as JobCreateModel,
        });

        expect(createJobResponse).toSatisfyApiSpec();
        expect(createJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body must NOT have additional properties/) as string, code: 'VALIDATION_ERROR' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        vi.spyOn(prisma.job, 'create').mockRejectedValueOnce(error);

        const response = await requestSender.createJob({
          requestBody: createJobRequestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        vi.spyOn(prisma.job, 'create').mockRejectedValueOnce(error);

        const response = await requestSender.createJob({
          requestBody: createJobRequestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error', code: 'UNKNOWN_ERROR' } });
      });
    });
  });

  describe('#getJobById', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the job', async function () {
        const { job } = await createJobnikTree(prisma, { name: 'SOME_UNIQUE_NAME' }, {}, [], { createStage: true, createTasks: false });
        const jobId = job.id;

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({ status: StatusCodes.OK, body: { status: JobOperationStatus.CREATED, name: 'SOME_UNIQUE_NAME' } });
        expect(getJobResponse.body).not.toHaveProperty('stages');
      });

      it('should return 200 status code and return the job with stages when stages flag is true', async function () {
        const { job } = await createJobnikTree(prisma, { name: 'SOME_UNIQUE_NAME' }, { type: 'SOME_UNIQUE_TYPE' }, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId }, queryParams: { should_return_stages: true } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.OK,
          body: { status: JobOperationStatus.CREATED, name: 'SOME_UNIQUE_NAME', stages: [{ type: 'SOME_UNIQUE_TYPE' }] },
        });
        expect(getJobResponse.body).toHaveProperty('stages');
      });

      it('should return 200 status code and return the job without stages when stages flag is false', async function () {
        const { job } = await createJobnikTree(prisma, { name: 'SOME_UNIQUE_NAME' }, { type: 'SOME_UNIQUE_TYPE' }, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId }, queryParams: { should_return_stages: false } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({ status: StatusCodes.OK, body: { status: JobOperationStatus.CREATED, name: 'SOME_UNIQUE_NAME' } });
        expect(getJobResponse.body).not.toHaveProperty('stages');
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a specific validation error message detailing the non exists job', async function () {
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: testJobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound, code: 'JOB_NOT_FOUND' },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as string, code: 'VALIDATION_ERROR' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: testJobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: testJobId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });

  describe('#updateUserMetadata', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify job's userMetadata object", async function () {
        const userMetadataInput = { someTestKey: 'someTestData' };
        const { job } = await createJobnikTree(prisma, { name: 'SOME_UNIQUE_NAME' }, {}, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const updateUserMetadataResponse = await requestSender.updateUserMetadata({
          pathParams: { jobId },
          requestBody: userMetadataInput,
        });

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId } });

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
          body: { message: jobsErrorMessages.jobNotFound, code: 'JOB_NOT_FOUND' },
        });
      });

      it('should return a 400 status code along with a message that specifies that body not valid (should be json)', async function () {
        const getJobResponse = await requestSender.updateUserMetadata({
          pathParams: { jobId: testJobId },
          requestBody: 'badType' as unknown as { avi: 'avi' },
        });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: /is not valid JSON/, code: 'VALIDATION_ERROR' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        vi.spyOn(prisma.job, 'update').mockRejectedValueOnce(error);

        const response = await requestSender.updateUserMetadata({ pathParams: { jobId: testJobId }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        vi.spyOn(prisma.job, 'update').mockRejectedValueOnce(error);

        const response = await requestSender.updateUserMetadata({ pathParams: { jobId: testJobId }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });

  describe('#updateJobPriority', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify job's priority", async function () {
        const { job } = await createJobnikTree(prisma, { priority: Priority.VERY_LOW }, {}, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const setPriorityResponse = await requestSender.updateJobPriority({
          pathParams: { jobId },
          requestBody: { priority: Priority.VERY_HIGH },
        });

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId } });

        expect(setPriorityResponse).toSatisfyApiSpec();
        expect(getJobResponse.body).toMatchObject({ priority: Priority.VERY_HIGH });
      });

      it("should return 204 status code without modifying job's priority", async function () {
        const { job } = await createJobnikTree(prisma, { priority: Priority.VERY_HIGH }, {}, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const setPriorityResponse = await requestSender.updateJobPriority({
          pathParams: { jobId },

          requestBody: { priority: Priority.VERY_HIGH },
        });

        expect(setPriorityResponse).toSatisfyApiSpec();
        expect(setPriorityResponse).toMatchObject({
          status: StatusCodes.NO_CONTENT,
          headers: { reason: jobsErrorMessages.priorityCannotBeUpdatedToSameValue },
        });
      });
    });

    describe('Bad Path', function () {
      it('should return 404 with specific error message for non-existent job', async function () {
        const getJobResponse = await requestSender.updateJobPriority({
          pathParams: { jobId: testJobId },
          requestBody: { priority: Priority.VERY_HIGH },
        });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound, code: 'JOB_NOT_FOUND' },
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
          body: {
            message: expect.stringMatching(/request\/body\/priority must be equal to one of the allowed values:/) as string,
            code: 'VALIDATION_ERROR',
          },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.updateJobPriority({ pathParams: { jobId: testJobId }, requestBody: { priority: Priority.VERY_HIGH } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.updateJobPriority({ pathParams: { jobId: testJobId }, requestBody: { priority: Priority.VERY_HIGH } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });

  describe('#updateStatus', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify job's status", async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const setStatusResponse = await requestSender.updateStatus({
          pathParams: { jobId },
          requestBody: { status: JobOperationStatus.PENDING },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId } });

        expect(getJobResponse).toHaveProperty('body.status', JobOperationStatus.PENDING);
      });
    });

    describe('Bad Path', function () {
      it('should return 400 with detailed error for invalid status transition', async function () {
        const { job } = await createJobnikTree(
          prisma,
          { status: JobOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot },
          {},
          [],
          {
            createStage: true,
            createTasks: false,
          }
        );
        const jobId = job.id;

        const setStatusResponse = await requestSender.updateStatus({
          pathParams: { jobId },
          requestBody: { status: JobOperationStatus.PAUSED },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: illegalStatusTransitionErrorMessage(job.status, JobOperationStatus.PAUSED), code: 'ILLEGAL_JOB_STATUS_TRANSITION' },
        });
      });

      it('should return 400 with detailed error for invalid status', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const setStatusResponse = await requestSender.updateStatus({
          pathParams: { jobId },
          requestBody: { status: JobOperationStatus.COMPLETED },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: {
            message: expect.stringMatching(/request\/body\/status must be equal to one of the allowed values/) as string,
            code: 'VALIDATION_ERROR',
          },
        });
      });

      it('should return 404 with specific error message for non-existent job', async function () {
        const getJobResponse = await requestSender.updateStatus({
          pathParams: { jobId: testJobId },
          requestBody: { status: JobOperationStatus.PAUSED },
        });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound, code: 'JOB_NOT_FOUND' },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.updateStatus({
          pathParams: { jobId: 'someBadUuid' },
          requestBody: { status: JobOperationStatus.COMPLETED },
        });
        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as string, code: 'VALIDATION_ERROR' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();

        vi.spyOn(prisma, '$transaction').mockImplementationOnce(async (callback) => {
          const mockTx = {
            job: {
              findUnique: vi.fn().mockRejectedValueOnce(error),
            },
          } as unknown as Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

          return callback(mockTx);
        });

        const response = await requestSender.updateStatus({ pathParams: { jobId: testJobId }, requestBody: { status: JobOperationStatus.PENDING } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();

        vi.spyOn(prisma, '$transaction').mockImplementationOnce(async (callback) => {
          const mockTx = {
            job: {
              findUnique: vi.fn().mockRejectedValueOnce(error),
            },
          } as unknown as Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

          return callback(mockTx);
        });

        const response = await requestSender.updateStatus({ pathParams: { jobId: testJobId }, requestBody: { status: JobOperationStatus.PENDING } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error', code: 'UNKNOWN_ERROR' } });
      });
    });
  });

  describe('#deleteJob', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and delete the job with related stages', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        await requestSender.updateStatus({ pathParams: { jobId: createdJobId }, requestBody: { status: JobOperationStatus.ABORTED } });
        const deleteJobResponse = await requestSender.deleteJob({ pathParams: { jobId: createdJobId } });
        const validateDeletionResponse = await requestSender.getJobById({ pathParams: { jobId: createdJobId } });

        expect(deleteJobResponse).toSatisfyApiSpec();
        expect(deleteJobResponse).toMatchObject({
          status: StatusCodes.OK,
          body: { code: successMessages.jobDeletedSuccessfully },
        });

        expect(validateDeletionResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });

      it('should return 200 status code and delete the job only', async function () {
        const { job } = await createJobnikTree(prisma, { status: JobOperationStatus.ABORTED, xstate: abortedStageXstatePersistentSnapshot }, {}, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const deleteJobResponse = await requestSender.deleteJob({ pathParams: { jobId } });
        const validateDeletionResponse = await requestSender.getJobById({ pathParams: { jobId } });

        expect(deleteJobResponse).toSatisfyApiSpec();
        expect(deleteJobResponse).toMatchObject({
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
        const deleteJobResponse = await requestSender.deleteJob({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(deleteJobResponse).toSatisfyApiSpec();
        expect(deleteJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as string },
        });
      });

      it('should return status code 400 when supplying job with not final state status', async function () {
        const { job } = await createJobnikTree(prisma, { status: JobOperationStatus.PENDING, xstate: pendingStageXstatePersistentSnapshot }, {}, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const deleteJobResponse = await requestSender.deleteJob({ pathParams: { jobId } });

        expect(deleteJobResponse).toSatisfyApiSpec();
        expect(deleteJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: jobsErrorMessages.jobNotInFiniteState, code: 'JOB_NOT_IN_FINITE_STATE' },
        });
      });

      it('should return 404 with specific error message for non-existent job', async function () {
        const deleteJobResponse = await requestSender.deleteJob({ pathParams: { jobId: testJobId } });

        expect(deleteJobResponse).toSatisfyApiSpec();
        expect(deleteJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound, code: 'JOB_NOT_FOUND' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const deleteJobResponse = await requestSender.deleteJob({
          pathParams: { jobId: testJobId },
        });

        expect(deleteJobResponse).toSatisfyApiSpec();
        expect(deleteJobResponse).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        vi.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const deleteJobResponse = await requestSender.deleteJob({
          pathParams: { jobId: testJobId },
        });

        expect(deleteJobResponse).toSatisfyApiSpec();
        expect(deleteJobResponse).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });
});
