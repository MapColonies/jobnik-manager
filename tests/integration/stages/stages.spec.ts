/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { faker } from '@faker-js/faker';
import type { MatcherContext } from '@jest/expect';
import type { paths, operations } from '@openapi';
import { JobMode, StageName, StageOperationStatus, TaskType, type PrismaClient } from '@prismaClient';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { errorMessages as jobsErrorMessages } from '@src/jobs/models/errors';
import { StageCreateWithTasksModel } from '@src/stages/models/models';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { errorMessages as commonErrorMessages } from '@src/common/errors';
import { TaskCreateModel } from '@src/tasks/models/models';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { createJobRecord, createJobRequestBody, createJobRequestWithStagesBody, testJobId, testStageId } from '../jobs/helpers';
import { addStageRecord, createStageWithJob, createStageWithoutTaskBody } from './helpers';

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
        const job = await createJobRecord(createJobRequestWithStagesBody, prisma);

        const response = await requestSender.getStages({ queryParams: { job_id: job.id } });

        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: createJobRequestWithStagesBody.stages,
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
            ...createStageWithoutTaskBody,
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
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should return 200 status code and the matching stage with related tasks', async function () {
        const job = await createJobRecord({ ...createJobRequestWithStagesBody, id: faker.string.uuid() }, prisma);
        const stageId = job.stage[0]!.id;

        await requestSender.addTasks({
          pathParams: { stageId },
          requestBody: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }],
        });
        const response = await requestSender.getStages({ queryParams: { job_id: job.id, should_return_tasks: true } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: createJobRequestWithStagesBody.stages,
        });

        expect(response.body).toMatchObject([{ tasks: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }] }]);
      });

      it('should return 200 status code and the matching stage without related tasks', async function () {
        const job = await createJobRecord(createJobRequestWithStagesBody, prisma);
        const stageId = job.stage[0]!.id;

        await requestSender.addTasks({
          pathParams: { stageId },
          requestBody: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }],
        });
        const response = await requestSender.getStages({ queryParams: { job_id: job.id, should_return_tasks: false } });

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: createJobRequestWithStagesBody.stages,
        });

        expect(response.body[0]).not.toHaveProperty('tasks');
      });
    });

    describe('Bad Path', function () {
      it('should return 400 status code and a relevant validation error message when the stage type is incorrect', async function () {
        const response = await requestSender.getStages({ queryParams: { stage_type: 'NOT_VALID_TYPE' as StageName } });

        if (response.status !== StatusCodes.BAD_REQUEST) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/query\/stage_type must be equal to one of the allowed values/) as MatcherContext },
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
            ...createStageWithoutTaskBody,
            jobId: createdJobId,
          },
          prisma
        );

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        if (getStageResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: { status: StageOperationStatus.CREATED, type: StageName.DEFAULT } });
        expect(getStageResponse.body).not.toHaveProperty('tasks');
      });

      it('should return 200 status code and return the stage with related tasks', async function () {
        const stagePayload = {
          data: {},
          type: StageName.DEFAULT,
          userMetadata: {},
          tasks: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }],
        } satisfies StageCreateWithTasksModel;

        const stage = await createStageWithJob(stagePayload, prisma);

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
        expect(getStageResponse.body).toMatchObject({ tasks: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }] });
      });

      it('should return 200 status code and return the stage without related tasks', async function () {
        const stagePayload = {
          data: {},
          type: StageName.DEFAULT,
          userMetadata: {},
          tasks: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }],
        } satisfies StageCreateWithTasksModel;

        const stage = await createStageWithJob(stagePayload, prisma);

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
            ...createStageWithoutTaskBody,
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
        const stagePayload = {
          data: {},
          type: StageName.DEFAULT,
          userMetadata: {},
          tasks: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }],
        } satisfies StageCreateWithTasksModel;

        const stage = await createStageWithJob(stagePayload, prisma);
        const createdJobId = stage.jobId;

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
        expect(getStageResponse.body[0]).toMatchObject({ tasks: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }] });
      });

      it('should return 200 status code and return the stages without related tasks', async function () {
        const stagePayload = {
          data: {},
          type: StageName.DEFAULT,
          userMetadata: {},
          tasks: [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }],
        } satisfies StageCreateWithTasksModel;

        const stage = await createStageWithJob(stagePayload, prisma);
        const createdJobId = stage.jobId;

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
            ...createStageWithoutTaskBody,
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
            ...createStageWithoutTaskBody,
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
            ...createStageWithoutTaskBody,
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
          type: StageName.DEFAULT,
          userMetadata: {},
        } satisfies StageCreateWithTasksModel;

        const addStageResponse = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.CREATED,
          body: createStagesPayload,
        });
      });

      it('should return 200 and create new stage for a job with existing stages', async function () {
        const job = await createJobRecord(createJobRequestWithStagesBody, prisma);

        const createStagesPayload = {
          data: {},
          type: StageName.DEFAULT,
          userMetadata: {},
        } satisfies StageCreateWithTasksModel;

        const response = await requestSender.addStage({
          requestBody: createStagesPayload,
          pathParams: { jobId: job.id },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: createStagesPayload,
        });
      });

      it('should return 200 status code and create the related stage with related tasks for current job', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);

        const createTasksPayload = [{ data: {}, type: TaskType.DEFAULT, userMetadata: {} }] satisfies TaskCreateModel[];

        const createStagesPayload = {
          data: {},
          type: StageName.DEFAULT,
          userMetadata: {},
        } satisfies StageCreateWithTasksModel;

        const response = await requestSender.addStage({
          requestBody: { ...createStagesPayload, tasks: createTasksPayload },
          pathParams: { jobId: job.id },
        });

        if (response.status !== StatusCodes.CREATED) {
          throw new Error();
        }

        const getTaskOfStagResponse = await requestSender.getTasksByStageId({ pathParams: { stageId: response.body.id } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: { ...createStagesPayload },
        });

        expect(getTaskOfStagResponse.body).toMatchObject(createTasksPayload);
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
          } satisfies StageCreateWithTasksModel,
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
          requestBody: {} as unknown as StageCreateWithTasksModel,
        });

        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body must have required property 'data'/) as string },
        });
      });

      it('should return 400 when the request contains an incorrect task nested body', async function () {
        const job = await createJobRecord({ ...createJobRequestBody }, prisma);

        const addStageResponse = await requestSender.addStage({
          pathParams: { jobId: job.id },
          requestBody: { data: {}, userMetadata: {}, type: TaskType.DEFAULT, tasks: {} } as unknown as StageCreateWithTasksModel,
        });

        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/body\/tasks must be array/) as string },
        });
      });

      it('should return 400 when adding stage to a pre-defined job', async function () {
        const job = await createJobRecord({ ...createJobRequestBody, jobMode: JobMode.PRE_DEFINED }, prisma);

        const addStageResponse = await requestSender.addStage({
          requestBody: { data: {}, userMetadata: {}, type: TaskType.DEFAULT },
          pathParams: { jobId: job.id },
        });

        expect(addStageResponse).toSatisfyApiSpec();
        expect(addStageResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: jobsErrorMessages.preDefinedJobStageModificationError },
        });
      });

      it('should return 400 when attempting to add stage to a finalized job', async function () {
        const job = await createJobRecord(createJobRequestBody, prisma);
        // generate some job in finite state (aborted)
        await requestSender.updateStatus({ pathParams: { jobId: job.id }, requestBody: { status: StageOperationStatus.ABORTED } });

        const addStageResponse = await requestSender.addStage({
          requestBody: { data: {}, userMetadata: {}, type: TaskType.DEFAULT },
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
          type: TaskType.DEFAULT,
          userMetadata: {},
        } satisfies StageCreateWithTasksModel;

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
          requestBody: { data: {}, type: TaskType.DEFAULT, userMetadata: {} },
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
        const job = await createJobRecord(createJobRequestWithStagesBody, prisma);

        if (!job.stage[0]) {
          throw new Error('Stage was not created');
        }

        const createdStageId = job.stage[0].id;

        const setStatusResponse = await requestSender.updateStageStatus({
          pathParams: { stageId: createdStageId },
          requestBody: { status: StageOperationStatus.PENDING },
        });

        expect(setStatusResponse).toSatisfyApiSpec();
        expect(setStatusResponse).toHaveProperty('status', StatusCodes.OK);

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: createdStageId } });

        expect(getStageResponse).toHaveProperty('body.status', StageOperationStatus.PENDING);
      });
    });

    describe('Bad Path', function () {
      it('should return 400 with detailed error for invalid status transition', async function () {
        const job = await createJobRecord(createJobRequestWithStagesBody, prisma);

        if (!job.stage[0]) {
          throw new Error('Stage was not created');
        }

        const createdStageId = job.stage[0].id;

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
