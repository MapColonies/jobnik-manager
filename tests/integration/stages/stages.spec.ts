/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { faker } from '@faker-js/faker';
import type { MatcherContext } from '@jest/expect';
import type { paths, operations } from '@openapi';
import { JobOperationStatus, StageOperationStatus, TaskOperationStatus, type PrismaClient } from '@prismaClient';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { StageCreateModel, StageModel } from '@src/stages/models/models';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { defaultStatusCounts } from '@src/stages/models/helper';
import {
  abortedXstatePersistentSnapshot,
  completedStageXstatePersistentSnapshot,
  inProgressStageXstatePersistentSnapshot,
  pendingStageXstatePersistentSnapshot,
} from '@tests/unit/data';
import { DEFAULT_TRACEPARENT } from '@src/common/utils/tracingHelpers';
import { illegalStatusTransitionErrorMessage } from '@src/common/errors';
import { createJobRecord, createJobRequestBody, testJobId, testStageId } from '../jobs/helpers';
import { createJobnikTree, createMockPrismaError, createMockUnknownDbError } from '../common/utils';

describe('stage', function () {
  let requestSender: RequestSender<paths, operations>;
  let prisma: PrismaClient;

  const memoryExporter = new InMemorySpanExporter();
  const spanProcessor = new SimpleSpanProcessor(memoryExporter);
  const provider = new NodeTracerProvider({ spanProcessors: [spanProcessor] });
  provider.register();

  const dumpUuid = faker.string.uuid();

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

  afterEach(async () => {
    await prisma.$disconnect();
    memoryExporter.reset();
  });

  describe('#getStages', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching stage', async function () {
        const { job } = await createJobnikTree(prisma, {}, { type: 'SOME_STAGE_TYPE', data: { avi: 'is the best' } }, [], {
          createStage: true,
          createTasks: false,
        });
        const jobId = job.id;

        const response = await requestSender.getStages({ queryParams: { job_id: jobId } });

        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [
            {
              jobId,
              status: StageOperationStatus.CREATED,
              type: 'SOME_STAGE_TYPE',
              data: { avi: 'is the best' },
              order: 1,
            },
          ],
        });
      });

      it('should return 200 status code and empty array', async function () {
        const response = await requestSender.getStages({ queryParams: { job_id: faker.string.uuid() } });
        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [],
        });
      });

      it('should return 200 status code and all the stages if no query params were defined', async function () {
        await createJobnikTree(prisma, {}, {}, [], { createStage: true, createTasks: false });

        const response = await requestSender.getStages();

        expect(response).toSatisfyApiSpec();
        expect(response).toHaveProperty('status', StatusCodes.OK);
        expect(response.body).toBeArray();
        expect(response.body).not.toHaveLength(0);
      });

      it('should return 200 status code and the matching stage with related tasks', async function () {
        const { job, stage, tasks } = await createJobnikTree(
          prisma,
          { xstate: pendingStageXstatePersistentSnapshot, status: JobOperationStatus.PENDING, traceparent: DEFAULT_TRACEPARENT },
          {
            status: StageOperationStatus.PENDING,
            xstate: pendingStageXstatePersistentSnapshot,
            summary: { ...defaultStatusCounts, total: 1, pending: 1 },
          },
          [{ status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot }]
        );

        const jobId = job.id;

        const response = await requestSender.getStages({ queryParams: { job_id: jobId, should_return_tasks: true } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [{ jobId: job.id, status: StageOperationStatus.PENDING, type: stage.type, data: stage.data, userMetadata: stage.userMetadata }],
        });

        expect(response.body).toMatchObject([{ tasks: [{ data: tasks[0]!.data, userMetadata: tasks[0]!.userMetadata }] }]);
      });

      it('should return 200 status code and the matching stage without related tasks', async function () {
        const { job, stage } = await createJobnikTree(
          prisma,
          {},
          {
            status: StageOperationStatus.PENDING,
            xstate: pendingStageXstatePersistentSnapshot,
            summary: { ...defaultStatusCounts, total: 1, pending: 1 },
          },
          [{}]
        );

        const response = await requestSender.getStages({ queryParams: { job_id: job.id, should_return_tasks: false } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [{ jobId: job.id, status: StageOperationStatus.PENDING, type: stage.type, data: stage.data, userMetadata: stage.userMetadata }],
        });

        expect(response.body[0]).not.toHaveProperty('tasks');
      });
    });

    describe('Bad Path', function () {
      it('should return 400 status code and a relevant validation error message when the stage type is larger than 50 characters', async function () {
        const longStageType = faker.string.alpha(51);
        const response = await requestSender.getStages({ queryParams: { stage_type: longStageType } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: {
            message: expect.stringMatching(/request\/query\/stage_type must NOT have more than 50 characters/) as MatcherContext,
            code: 'VALIDATION_ERROR',
          },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        jest.spyOn(prisma.stage, 'findMany').mockRejectedValueOnce(error);

        const response = await requestSender.getStages({});

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        jest.spyOn(prisma.stage, 'findMany').mockRejectedValueOnce(error);

        const response = await requestSender.getStages({});

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });

  describe('#getStageById', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the stage', async function () {
        const { stage } = await createJobnikTree(
          prisma,
          {},
          {
            type: 'SOME_HAPPY_PATH_STAGE_TYPE',
          },
          [{}]
        );

        const getStageResponse = await requestSender.getStageById({
          pathParams: { stageId: stage.id },
          queryParams: { should_return_tasks: undefined },
        });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.OK,
          body: { status: StageOperationStatus.CREATED, type: 'SOME_HAPPY_PATH_STAGE_TYPE' },
        });
        expect(getStageResponse.body).not.toHaveProperty('tasks');
      });

      it('should return 200 status code and return the stage with related tasks', async function () {
        const { stage } = await createJobnikTree(prisma, {}, {}, [
          { status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot, userMetadata: { some: 'metadata' } },
        ]);

        const getStageResponse = await requestSender.getStageById({
          pathParams: { stageId: stage.id },
          queryParams: { should_return_tasks: true },
        });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: { status: StageOperationStatus.CREATED, id: stage.id } });
        expect(getStageResponse.body).toHaveProperty('tasks');
        expect(getStageResponse.body).toMatchObject({ tasks: [{ data: {}, userMetadata: { some: 'metadata' } }] });
      });

      it('should return 200 status code and return the stage without related tasks', async function () {
        const { stage } = await createJobnikTree(prisma, {}, {}, [
          { status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot, userMetadata: { some: 'metadata' } },
        ]);

        const getStageResponse = await requestSender.getStageById({
          pathParams: { stageId: stage.id },
          queryParams: { should_return_tasks: false },
        });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: { status: StageOperationStatus.CREATED, id: stage.id } });
        expect(getStageResponse.body).not.toHaveProperty('tasks');
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code with a validation error message if the requested stage does not exist', async function () {
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: faker.string.uuid() } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: stagesErrorMessages.stageNotFound, code: 'STAGE_NOT_FOUND' },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: 'someInvalidJobId' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/stageId must match format "uuid"/) as MatcherContext, code: 'VALIDATION_ERROR' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.getStageById({ pathParams: { stageId: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.getStageById({ pathParams: { stageId: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });

  describe('#getStagesByJobId', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the stages', async function () {
        const { stage, job } = await createJobnikTree(prisma, {}, {}, [], { createStage: true, createTasks: false });

        const getStageResponse = await requestSender.getStagesByJobId({ pathParams: { jobId: job.id } });

        if (getStageResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: [{ status: StageOperationStatus.CREATED, id: stage.id }] });
        expect(getStageResponse.body[0]).not.toHaveProperty('tasks');
      });

      it('should return 200 status code and return the stages with related tasks', async function () {
        const { stage, job } = await createJobnikTree(prisma, {}, {}, [
          { status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot },
        ]);

        const getStageResponse = await requestSender.getStagesByJobId({
          pathParams: { jobId: job.id },
          queryParams: { should_return_tasks: true },
        });

        if (getStageResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: [{ status: StageOperationStatus.CREATED, id: stage.id }] });
        expect(getStageResponse.body[0]).toHaveProperty('tasks');
        expect(getStageResponse.body[0]).toMatchObject({ tasks: [{ data: {}, userMetadata: {} }] });
      });

      it('should return 200 status code and return the stages without related tasks', async function () {
        const { stage, job } = await createJobnikTree(prisma, {}, {}, [
          { status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot },
        ]);

        const getStageResponse = await requestSender.getStagesByJobId({
          pathParams: { jobId: job.id },
          queryParams: { should_return_tasks: false },
        });

        if (getStageResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: [{ status: StageOperationStatus.CREATED, id: stage.id }] });
        expect(getStageResponse.body[0]).not.toHaveProperty('tasks');
      });

      it('should return a 200 status code with empty array object if no stages exists for the requested job', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const getStageResponse = await requestSender.getStagesByJobId({ pathParams: { jobId: job.id } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.OK,
          body: [],
        });
      });

      it('should return stages ordered by the order field', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        // Create multiple stages for the same job using API endpoints to ensure proper order assignment
        await requestSender.addStage({
          pathParams: { jobId: createdJobId },
          requestBody: {
            type: 'FIRST_STAGE',
            data: {},
            userMetadata: {},
          },
        });

        await requestSender.addStage({
          pathParams: { jobId: createdJobId },
          requestBody: {
            type: 'SECOND_STAGE',
            data: {},
            userMetadata: {},
          },
        });

        await requestSender.addStage({
          pathParams: { jobId: createdJobId },
          requestBody: {
            type: 'THIRD_STAGE',
            data: {},
            userMetadata: {},
          },
        });

        const getStageResponse = await requestSender.getStagesByJobId({ pathParams: { jobId: createdJobId } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.OK,
          body: [
            { type: 'FIRST_STAGE', order: 1 },
            { type: 'SECOND_STAGE', order: 2 },
            { type: 'THIRD_STAGE', order: 3 },
          ],
        });
      });
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid', async function () {
        const getStageResponse = await requestSender.getStagesByJobId({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as MatcherContext, code: 'VALIDATION_ERROR' },
        });
      });

      it('should return status code 404 when a job with the given uuid does not exists', async function () {
        const getStageResponse = await requestSender.getStagesByJobId({ pathParams: { jobId: faker.string.uuid() } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound, code: 'JOB_NOT_FOUND' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.getStagesByJobId({ pathParams: { jobId: faker.string.uuid() } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.getStagesByJobId({ pathParams: { jobId: faker.string.uuid() } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });

  describe('#getSummary', function () {
    describe('Happy Path', function () {
      it("should return 200 status code and return the stage's summary", async function () {
        const { stage } = await createJobnikTree(prisma, {}, {}, [], { createStage: true, createTasks: false });

        const getStageResponse = await requestSender.getStageSummary({ pathParams: { stageId: stage.id } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: defaultStatusCounts });
      });
    });

    describe('Bad Path', function () {
      it("should return a 404 status code and a validation error indicating the stage's non-existence should be returned", async function () {
        const getStageResponse = await requestSender.getStageSummary({ pathParams: { stageId: dumpUuid } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: stagesErrorMessages.stageNotFound, code: 'STAGE_NOT_FOUND' },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getStageResponse = await requestSender.getStageSummary({ pathParams: { stageId: 'someInvalidJobId' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/stageId must match format "uuid"/) as MatcherContext, code: 'VALIDATION_ERROR' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.getStageSummary({ pathParams: { stageId: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.getStageSummary({ pathParams: { stageId: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });

  describe('#updateUserMetadata', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify stages's userMetadata object", async function () {
        const userMetadataInput = { someTestKey: 'someTestData' };

        const { stage } = await createJobnikTree(prisma, {}, {}, [], { createStage: true, createTasks: false });

        const updateUserMetadataResponse = await requestSender.updateStageUserMetadata({
          pathParams: { stageId: stage.id },
          requestBody: userMetadataInput,
        });

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(updateUserMetadataResponse).toSatisfyApiSpec();
        expect(getStageResponse.body).toMatchObject({ userMetadata: userMetadataInput });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a message that specifies that a stage with the given id was not found', async function () {
        const getStageResponse = await requestSender.updateStageUserMetadata({ pathParams: { stageId: dumpUuid }, requestBody: { avi: 'avi' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: stagesErrorMessages.stageNotFound, code: 'STAGE_NOT_FOUND' },
        });
      });

      it('should return a 400 status code and a message indicating the request body has an invalid structure', async function () {
        const { stage } = await createJobnikTree(prisma, {}, {}, [], { createStage: true, createTasks: false });

        const response = await requestSender.updateStageUserMetadata({
          pathParams: { stageId: stage.id },
          requestBody: 'badInputString' as unknown as { [key: string]: string },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/is not valid JSON/) as MatcherContext, code: 'VALIDATION_ERROR' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        jest.spyOn(prisma.stage, 'update').mockRejectedValueOnce(error);

        const response = await requestSender.updateStageUserMetadata({ pathParams: { stageId: faker.string.uuid() }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        jest.spyOn(prisma.stage, 'update').mockRejectedValueOnce(error);

        const response = await requestSender.updateStageUserMetadata({ pathParams: { stageId: faker.string.uuid() }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });

  describe('#addStage', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and create the related stage for current job', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const createStagesPayload = {
          data: {},
          type: 'SOME_ADD_STAGE_TEST_NAME',
          userMetadata: {},
        } satisfies StageCreateModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.CREATED,
          body: { ...createStagesPayload, status: StageOperationStatus.CREATED, order: 1 },
        });
      });

      it('should create a stage with WAITING status when startAsWaiting flag is true', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const createStagesPayload = {
          data: {},
          type: 'SOME_ADD_STAGE_WAITING_TEST_NAME',
          userMetadata: {},
          startAsWaiting: true,
        } satisfies StageCreateModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.CREATED,
          body: { status: StageOperationStatus.WAITING },
        });
      });

      it('should create a stage with CREATED status when startAsWaiting flag is false', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const createStagesPayload = {
          data: {},
          type: 'SOME_ADD_STAGE_CREATED_TEST_NAME',
          userMetadata: {},
          startAsWaiting: false,
        } satisfies StageCreateModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.CREATED,
          body: { status: StageOperationStatus.CREATED },
        });
      });

      it('should create the first stage successfully', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const createStagePayload = {
          data: { testData: 'first stage' },
          type: 'FIRST_STAGE_ORDER_TEST',
          userMetadata: { order: 'first' },
        } satisfies StageCreateModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagePayload,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            ...createStagePayload,
            status: StageOperationStatus.CREATED,
            order: 1,
          },
        });
      });

      it('should create multiple stages successfully for the same job', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        // Create first stage
        const stage1Payload = {
          data: { testData: 'stage 1' },
          type: 'STAGE_ORDER_TEST_1',
          userMetadata: { sequence: 'first' },
        } satisfies StageCreateModel;

        const stage1Response = await requestSender.addStage({
          requestBody: stage1Payload,
          pathParams: { jobId: job.id },
        });

        expect(stage1Response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            order: 1,
          },
        });

        // Create second stage
        const stage2Payload = {
          data: { testData: 'stage 2' },
          type: 'STAGE_ORDER_TEST_2',
          userMetadata: { sequence: 'second' },
        } satisfies StageCreateModel;

        const stage2Response = await requestSender.addStage({
          requestBody: stage2Payload,
          pathParams: { jobId: job.id },
        });

        expect(stage2Response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            order: 2,
          },
        });

        // Create third stage
        const stage3Payload = {
          data: { testData: 'stage 3' },
          type: 'STAGE_ORDER_TEST_3',
          userMetadata: { sequence: 'third' },
        } satisfies StageCreateModel;

        const stage3Response = await requestSender.addStage({
          requestBody: stage3Payload,
          pathParams: { jobId: job.id },
        });

        expect(stage3Response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            order: 3,
          },
        });
      });

      it('should create stages independently for different jobs', async function () {
        const { job: job1 } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });
        const { job: job2 } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        // Add two stages to job1
        const job1Stage1Payload = {
          data: { job: 'job1' },
          type: 'JOB1_STAGE_1',
          userMetadata: { jobOrder: 'job1-first' },
        } satisfies StageCreateModel;

        const job1Stage2Payload = {
          data: { job: 'job1' },
          type: 'JOB1_STAGE_2',
          userMetadata: { jobOrder: 'job1-second' },
        } satisfies StageCreateModel;

        // Add one stage to job2
        const job2Stage1Payload = {
          data: { job: 'job2' },
          type: 'JOB2_STAGE_1',
          userMetadata: { jobOrder: 'job2-first' },
        } satisfies StageCreateModel;

        // Create stages
        const job1Stage1Response = await requestSender.addStage({
          requestBody: job1Stage1Payload,
          pathParams: { jobId: job1.id },
        });

        const job1Stage2Response = await requestSender.addStage({
          requestBody: job1Stage2Payload,
          pathParams: { jobId: job1.id },
        });

        const job2Stage1Response = await requestSender.addStage({
          requestBody: job2Stage1Payload,
          pathParams: { jobId: job2.id },
        });

        expect(job1Stage1Response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            order: 1,
          },
        });

        expect(job1Stage2Response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            order: 2,
          },
        });

        expect(job2Stage1Response).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            order: 1,
          },
        });
      });

      it('should return stages in correct sequence when fetching by job id', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        // Create multiple stages
        const stages = [
          { type: 'FIRST_STAGE', data: { sequence: 1 } },
          { type: 'SECOND_STAGE', data: { sequence: 2 } },
          { type: 'THIRD_STAGE', data: { sequence: 3 } },
        ];

        for (const stageData of stages) {
          await requestSender.addStage({
            requestBody: {
              ...stageData,
              userMetadata: {},
            } satisfies StageCreateModel,
            pathParams: { jobId: job.id },
          });
        }

        // Fetch all stages for the job
        const getStagesResponse = await requestSender.getStagesByJobId({
          pathParams: { jobId: job.id },
        });

        expect(getStagesResponse).toMatchObject({
          status: StatusCodes.OK,
          body: [{ order: 1 }, { order: 2 }, { order: 3 }],
        });
      });

      it('should return 201 status code and add the stage with generated traceparent from active span', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const createStagesPayload = {
          data: {},
          type: 'SOME_STAGE_WITHOUT_TRACEPARENT',
          userMetadata: {},
        } satisfies StageCreateModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        await memoryExporter.forceFlush();
        const addStageSpan = memoryExporter.getFinishedSpans().find((span) => span.name === 'addStage');
        const finishedSpanContext = addStageSpan?.spanContext();

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.CREATED,
          body: { traceparent: `00-${finishedSpanContext?.traceId}-${finishedSpanContext?.spanId}-0${finishedSpanContext?.traceFlags}` },
        });
      });

      it('should return 201 status code and add the stage with provided traceparent and tracestate', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const createStagesPayload = {
          data: {},
          type: 'SOME_STAGE_WITH_TRACEPARENT_AND_TRACESTATE',
          userMetadata: {},
          traceparent: '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01',
          tracestate: 'foo=bar',
        } satisfies StageCreateModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();

        expect(addStageResponse).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            traceparent: '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01',
            tracestate: 'foo=bar',
          },
        });
      });

      it('should return 201 status code and add the stage with provided traceparent without tracestate', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const createStagesPayload = {
          data: {},
          type: 'SOME_STAGE_WITH_TRACEPARENT_WITHOUT_TRACESTATE',
          userMetadata: {},
          traceparent: '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01',
        } satisfies StageCreateModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.CREATED,
          body: {
            status: JobOperationStatus.CREATED,
            traceparent: '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01',
          },
        });

        expect(addStageResponse.body).not.toHaveProperty('tracestate');
      });
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const addStageResponse = await requestSender.addStage({
          requestBody: {
            type: 'DEFAULT',
            data: {},
            userMetadata: {},
          } satisfies StageCreateModel,
          pathParams: { jobId: 'someInvalidJobId' },
        });

        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as string, code: 'VALIDATION_ERROR' },
        });
      });

      it('should return 400 when the request contains an incorrect body', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const addStageResponse = await requestSender.addStage({
          pathParams: { jobId: job.id },
          requestBody: {} as unknown as StageCreateModel,
        });

        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body must have required property 'data'/) as string, code: 'VALIDATION_ERROR' },
        });
      });

      it('should return 400 when attempting to add stage to a finalized job', async function () {
        const { job } = await createJobnikTree(prisma, { xstate: abortedXstatePersistentSnapshot, status: JobOperationStatus.ABORTED }, {}, [], {
          createStage: false,
          createTasks: false,
        });

        const addStageResponse = await requestSender.addStage({
          requestBody: { data: {}, userMetadata: {}, type: 'SOME_STAGE_TYPE' } satisfies StageCreateModel,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: jobsErrorMessages.jobAlreadyFinishedStagesError, code: 'JOB_IN_FINITE_STATE' },
        });
      });

      it('should return 400 when the request contains an invalid traceparent format', async function () {
        const { job } = await createJobnikTree(prisma, {}, {}, [], { createStage: false, createTasks: false });

        const createStagesPayload = {
          data: {},
          type: 'SOME_STAGE_WITH_INVALID_TRACEPARENT',
          userMetadata: {},
          traceparent: 'INVALID_TRACEPARENT',
        } satisfies StageCreateModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body\/traceparent must match pattern/) as MatcherContext, code: 'VALIDATION_ERROR' },
        });
      });

      it('should return 404 when attempting to update a non-existent job ID', async function () {
        const createStagesPayload = {
          data: {},
          type: 'SOME_STAGE_TYPE',
          userMetadata: {},
        } satisfies StageCreateModel;

        const response = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: testJobId },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound, code: 'JOB_NOT_FOUND' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.addStage({
          requestBody: { data: {}, type: 'SOME_STAGE_TYPE', userMetadata: {} },
          pathParams: { jobId: testJobId },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.addStage({
          requestBody: { data: {}, type: 'SOME_STAGE_TYPE', userMetadata: {} },
          pathParams: { jobId: testJobId },
        });

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
      it("should return 200 status code and modify stages's status", async function () {
        const { stage } = await createJobnikTree(prisma, {}, {}, [], { createStage: true, createTasks: false });

        const setStatusResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: stage.id },
          requestBody: { status: StageOperationStatus.PENDING },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(getStageResponse).toHaveProperty('body.status', StageOperationStatus.PENDING);
      });

      it("should return 200 status code and move stage's status to pending (first stage is completed)", async function () {
        const { stage: stage1 } = await createJobnikTree(
          prisma,
          {},
          { status: StageOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot },
          [],
          { createStage: true, createTasks: false }
        );
        const secondStageResponse = await requestSender.addStage({
          pathParams: { jobId: stage1.jobId },
          requestBody: { type: 'SECOND_STAGE', data: {}, userMetadata: {} },
        });

        const stage2 = secondStageResponse.body as StageModel;

        const setStatusResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: stage1.id },
          requestBody: { status: StageOperationStatus.COMPLETED },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage1.id } });
        const getSecondStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage2.id } });

        expect(getStageResponse).toHaveProperty('body.status', StageOperationStatus.COMPLETED);
        expect(getSecondStageResponse).toHaveProperty('body.status', StageOperationStatus.PENDING);
      });

      it("should return 200 status code and not move second stage's status to pending if is WAITING", async function () {
        const { stage: stage1 } = await createJobnikTree(
          prisma,
          {},
          { status: StageOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot },
          [],
          { createStage: true, createTasks: false }
        );
        const secondStageResponse = await requestSender.addStage({
          pathParams: { jobId: stage1.jobId },
          requestBody: { type: 'SECOND_STAGE', data: {}, userMetadata: {} },
        });

        const stage2 = secondStageResponse.body as StageModel;

        await requestSender.updateStageStatus({
          pathParams: { stageId: stage2.id },
          requestBody: { status: StageOperationStatus.WAITING },
        });

        const setStatusResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: stage1.id },
          requestBody: { status: StageOperationStatus.COMPLETED },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getSecondStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage2.id } });

        expect(getSecondStageResponse).toHaveProperty('body.status', StageOperationStatus.WAITING);
      });

      it("should return 200 status code and modify stages to IN_PROGRESS with Job's status updating", async function () {
        const { job, stage } = await createJobnikTree(
          prisma,
          { xstate: pendingStageXstatePersistentSnapshot, status: JobOperationStatus.PENDING, traceparent: DEFAULT_TRACEPARENT },
          { status: StageOperationStatus.PENDING, xstate: pendingStageXstatePersistentSnapshot },
          [],
          { createStage: true, createTasks: false }
        );
        const stageId = stage.id;

        const setStatusResponse = await requestSender.updateStageStatus({
          pathParams: { stageId },
          requestBody: { status: StageOperationStatus.IN_PROGRESS },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId } });
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: job.id } });

        expect(getStageResponse).toHaveProperty('body.status', StageOperationStatus.IN_PROGRESS);
        expect(getJobResponse).toHaveProperty('body.status', JobOperationStatus.IN_PROGRESS);
      });
    });

    describe('Bad Path', function () {
      it('should return 400 with detailed error for invalid status transition', async function () {
        const { stage } = await createJobnikTree(prisma, {}, {}, [], { createStage: true, createTasks: false });

        const stageId = stage.id;

        const updateStageResponse = await requestSender.updateStageStatus({
          pathParams: { stageId },
          requestBody: { status: StageOperationStatus.COMPLETED },
        });

        expect(updateStageResponse).toSatisfyApiSpec();
        expect(updateStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: {
            message: illegalStatusTransitionErrorMessage(stage.status, StageOperationStatus.COMPLETED),
            code: 'ILLEGAL_STAGE_STATUS_TRANSITION',
          },
        });
      });

      it('should return 400 with detailed error for invalid status transition (not ordered stage - CREATED -> PENDING)', async function () {
        const { stage: stage1 } = await createJobnikTree(prisma, {}, {}, [], { createStage: true, createTasks: false });

        const secondStageResponse = await requestSender.addStage({
          pathParams: { jobId: stage1.jobId },
          requestBody: { type: 'SECOND_STAGE', data: {}, userMetadata: {} },
        });

        const stage2 = secondStageResponse.body as StageModel;

        const updateStageResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: stage2.id },
          requestBody: { status: StageOperationStatus.PENDING },
        });

        expect(updateStageResponse).toSatisfyApiSpec();
        expect(updateStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: {
            message: 'Previous stage is not COMPLETED',
            code: 'ILLEGAL_STAGE_STATUS_TRANSITION',
          },
        });
      });

      it('should return 404 with specific error message for non-existent stage', async function () {
        const updateStageResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: testStageId },
          requestBody: { status: StageOperationStatus.COMPLETED },
        });

        expect(updateStageResponse).toSatisfyApiSpec();
        expect(updateStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: stagesErrorMessages.stageNotFound, code: 'STAGE_NOT_FOUND' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        const error = createMockPrismaError();
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.updateStageStatus({
          pathParams: { stageId: testStageId },
          requestBody: { status: StageOperationStatus.PENDING },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_RELATED_ERROR' },
        });
      });

      it('should return 500 status code when the database driver throws an unexpected error', async function () {
        const error = createMockUnknownDbError();
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(error);

        const response = await requestSender.updateStageStatus({
          pathParams: { stageId: testStageId },
          requestBody: { status: StageOperationStatus.PENDING },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'UNKNOWN_ERROR' },
        });
      });
    });
  });
});
