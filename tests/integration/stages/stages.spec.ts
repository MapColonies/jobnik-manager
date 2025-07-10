/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { faker } from '@faker-js/faker';
import type { MatcherContext } from '@jest/expect';
import type { paths, operations } from '@openapi';
import { JobOperationStatus, StageOperationStatus, TaskOperationStatus, type PrismaClient } from '@prismaClient';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { StageCreateModel } from '@src/stages/models/models';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { errorMessages as commonErrorMessages } from '@src/common/errors';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { completedStageXstatePersistentSnapshot, pendingStageXstatePersistentSnapshot } from '@tests/unit/data';
import { createJobRecord, createJobRequestBody, testJobId, testStageId } from '../jobs/helpers';
import { createTaskBody, createTaskRecords } from '../tasks/helpers';
import { addJobRecord, addStageRecord, createStageBody } from './helpers';

describe('stage', function () {
  let requestSender: RequestSender<paths, operations>;
  let prisma: PrismaClient;

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
  });

  describe('#getStages', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching stage', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        await addStageRecord(
          {
            ...createStageBody,
            jobId: job.id,
          },
          prisma
        );
        const response = await requestSender.getStages({ queryParams: { job_id: job.id } });

        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [
            {
              jobId: job.id,
              status: StageOperationStatus.CREATED,
              type: createStageBody.type,
              data: createStageBody.data,
              userMetadata: createStageBody.userMetadata,
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
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;
        await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

        const response = await requestSender.getStages();

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toHaveProperty('status', StatusCodes.OK);
        expect(response.body).toBeArray();
        expect(response.body).not.toHaveLength(0);
      });

      it('should return 200 status code and the matching stage with related tasks', async function () {
        const job = await addJobRecord(
          {
            ...createJobRequestBody,
            id: faker.string.uuid(),
            xstate: pendingStageXstatePersistentSnapshot,
            status: JobOperationStatus.PENDING,
          },
          prisma
        );

        const stage = await addStageRecord(
          {
            ...createStageBody,
            summary: { ...defaultStatusCounts, total: 1, pending: 1 },
            jobId: job.id,
            status: StageOperationStatus.PENDING,
            xstate: pendingStageXstatePersistentSnapshot,
          },
          prisma
        );

        const tasks = await createTaskRecords(
          [{ ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot }],
          prisma
        );

        const response = await requestSender.getStages({ queryParams: { job_id: job.id, should_return_tasks: true } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [{ jobId: job.id, status: StageOperationStatus.PENDING, type: stage.type, data: stage.data, userMetadata: stage.userMetadata }],
        });

        expect(response.body).toMatchObject([{ tasks: [{ data: tasks[0]!.data, userMetadata: tasks[0]!.userMetadata }] }]);
      });

      it('should return 200 status code and the matching stage without related tasks', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);

        const stage = await addStageRecord(
          {
            ...createStageBody,
            summary: { ...defaultStatusCounts, total: 1, pending: 1 },
            jobId: job.id,
            status: StageOperationStatus.PENDING,
            xstate: pendingStageXstatePersistentSnapshot,
          },
          prisma
        );

        await requestSender.addTasks({
          pathParams: { stageId: stage.id },
          requestBody: [{ data: {}, userMetadata: {} }],
        });
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

        if (response.status !== StatusCodes.BAD_REQUEST) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/query\/stage_type must NOT have more than 50 characters/) as MatcherContext },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'findMany').mockRejectedValueOnce(new Error('Database error'));
        const response = await requestSender.getStages({});

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getStageById', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the stage', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
            type: 'SOME_HAPPY_PATH_STAGE_TYPE',
          },
          prisma
        );

        const getStageResponse = await requestSender.getStageById({
          pathParams: { stageId: stage.id },
          queryParams: { should_return_tasks: undefined },
        });

        if (getStageResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.OK,
          body: { status: StageOperationStatus.CREATED, type: 'SOME_HAPPY_PATH_STAGE_TYPE' },
        });
        expect(getStageResponse.body).not.toHaveProperty('tasks');
      });

      it('should return 200 status code and return the stage with related tasks', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

        await createTaskRecords(
          [{ ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot }],
          prisma
        );

        const getStageResponse = await requestSender.getStageById({
          pathParams: { stageId: stage.id },
          queryParams: { should_return_tasks: true },
        });

        if (getStageResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: { status: StageOperationStatus.CREATED, id: stage.id } });
        expect(getStageResponse.body).toHaveProperty('tasks');
        expect(getStageResponse.body).toMatchObject({ tasks: [{ data: {}, userMetadata: {} }] });
      });

      it('should return 200 status code and return the stage without related tasks', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

        await createTaskRecords(
          [{ ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot }],
          prisma
        );

        const getStageResponse = await requestSender.getStageById({
          pathParams: { stageId: stage.id },
          queryParams: { should_return_tasks: false },
        });

        if (getStageResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

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
          body: { message: stagesErrorMessages.stageNotFound },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: 'someInvalidJobId' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/stageId must match format "uuid"/) as MatcherContext },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getStageById({ pathParams: { stageId: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getStageByJobId', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the stages', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: createdJobId } });

        if (getStageResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: [{ status: StageOperationStatus.CREATED, id: stage.id }] });
        expect(getStageResponse.body[0]).not.toHaveProperty('tasks');
      });

      it('should return 200 status code and return the stages with related tasks', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

        await createTaskRecords(
          [{ ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot }],
          prisma
        );

        const getStageResponse = await requestSender.getStageByJobId({
          pathParams: { jobId: createdJobId },
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
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

        await createTaskRecords(
          [{ ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.COMPLETED, xstate: completedStageXstatePersistentSnapshot }],
          prisma
        );

        const getStageResponse = await requestSender.getStageByJobId({
          pathParams: { jobId: createdJobId },
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
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: createdJobId } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.OK,
          body: [],
        });
      });
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid', async function () {
        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as MatcherContext },
        });
      });

      it('should return status code 404 when a job with the given uuid does not exists', async function () {
        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: faker.string.uuid() } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: jobsErrorMessages.jobNotFound },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getStageByJobId({ pathParams: { jobId: faker.string.uuid() } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getSummary', function () {
    describe('Happy Path', function () {
      it("should return 200 status code and return the stage's summary", async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

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
          body: { message: stagesErrorMessages.stageNotFound },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getStageResponse = await requestSender.getStageSummary({ pathParams: { stageId: 'someInvalidJobId' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/stageId must match format "uuid"/) as MatcherContext },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getStageSummary({ pathParams: { stageId: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#updateUserMetadata', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify stages's userMetadata object", async function () {
        const userMetadataInput = { someTestKey: 'someTestData' };
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

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
          body: { message: stagesErrorMessages.stageNotFound },
        });
      });

      it('should return a 400 status code and a message indicating the request body has an invalid structure', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const createdJobId = job.id;

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: createdJobId,
          },
          prisma
        );

        const response = await requestSender.updateStageUserMetadata({
          pathParams: { stageId: stage.id },
          requestBody: 'badInputString' as unknown as { [key: string]: string },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/is not valid JSON/) as MatcherContext },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'update').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateStageUserMetadata({ pathParams: { stageId: faker.string.uuid() }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#addStage', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and create the related stage for current job', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);

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
          body: { ...createStagesPayload, status: StageOperationStatus.CREATED },
        });
      });

      it('should create a stage with WAITING status when startAsWaiting flag is true', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);

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
        const job = await createJobRecord(createJobRequestBody, prisma);

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
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        await createJobRecord({ ...createJobRequestBody }, prisma);

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
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) as string },
        });
      });

      it('should return 400 when the request contains an incorrect body', async function () {
        const job = await createJobRecord({ ...createJobRequestBody }, prisma);

        const addStageResponse = await requestSender.addStage({
          pathParams: { jobId: job.id },
          requestBody: {} as unknown as StageCreateModel,
        });

        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body must have required property 'data'/) as string },
        });
      });

      it('should return 400 when attempting to add stage to a finalized job', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        // generate some job in finite state (aborted)
        await requestSender.updateStatus({ pathParams: { jobId: job.id }, requestBody: { status: StageOperationStatus.ABORTED } });

        const addStageResponse = await requestSender.addStage({
          requestBody: { data: {}, userMetadata: {}, type: 'SOME_STAGE_TYPE' } satisfies StageCreateModel,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: jobsErrorMessages.jobAlreadyFinishedStagesError },
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

        if (response.status !== StatusCodes.NOT_FOUND) {
          throw new Error();
        }

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

        const response = await requestSender.addStage({
          requestBody: { data: {}, type: 'SOME_STAGE_TYPE', userMetadata: {} },
          pathParams: { jobId: testJobId },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#updateStatus', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify stages's status", async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: job.id,
          },
          prisma
        );

        const createdStageId = stage.id;

        const setStatusResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: createdStageId },
          requestBody: { status: StageOperationStatus.PENDING },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: createdStageId } });

        expect(getStageResponse).toHaveProperty('body.status', StageOperationStatus.PENDING);
      });

      it("should return 201 status code and modify stages to IN_PROGRESS with Job's status updating", async function () {
        const job = await addJobRecord(
          { ...createJobRequestBody, id: faker.string.uuid(), xstate: pendingStageXstatePersistentSnapshot, status: JobOperationStatus.PENDING },
          prisma
        );

        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: job.id,
            status: StageOperationStatus.PENDING,
            xstate: pendingStageXstatePersistentSnapshot,
          },
          prisma
        );

        const createdStageId = stage.id;

        const setStatusResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: createdStageId },
          requestBody: { status: StageOperationStatus.IN_PROGRESS },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: createdStageId } });
        const getJobResponse = await requestSender.getJobById({ pathParams: { jobId: job.id } });

        expect(getStageResponse).toHaveProperty('body.status', StageOperationStatus.IN_PROGRESS);
        expect(getJobResponse).toHaveProperty('body.status', JobOperationStatus.IN_PROGRESS);
      });
    });

    describe('Bad Path', function () {
      it('should return 400 with detailed error for invalid status transition', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        const stage = await addStageRecord(
          {
            ...createStageBody,
            jobId: job.id,
          },
          prisma
        );

        const createdStageId = stage.id;

        const setStatusResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: createdStageId },
          requestBody: { status: StageOperationStatus.COMPLETED },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toMatchObject({ status: StatusCodes.BAD_REQUEST, body: { message: commonErrorMessages.invalidStatusChange } });
      });

      it('should return 404 with specific error message for non-existent stage', async function () {
        const getStageResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: testStageId },
          requestBody: { status: StageOperationStatus.COMPLETED },
        });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: stagesErrorMessages.stageNotFound },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateStageStatus({
          pathParams: { stageId: testStageId },
          requestBody: { status: StageOperationStatus.PENDING },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });
});
