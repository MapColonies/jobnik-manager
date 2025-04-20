/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { TaskOperationStatus, TaskType, type PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Pool } from 'pg';
import type { MatcherContext } from '@jest/expect';
import type { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { errorMessages as tasksErrorMessages } from '@src/tasks/models/errors';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { createJobRecord, createJobRequestBody } from '../jobs/helpers';
import { createStageRecord, createStageWithoutTaskBody } from '../stages/helpers';
import { createTaskBody, createTaskRecords } from './helpers';

describe('task', function () {
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

  describe('#getTasks', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching task', async function () {
        // create full tree
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await createStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
        const tasks = await createTaskRecords([{ ...createTaskBody, stageId: stage.id }], prisma);

        const response = await requestSender.getTasksByCriteria({ queryParams: { stage_id: stage.id } });

        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [{ id: tasks[0]!.id, stageId: stage.id }],
        });
      });

      it('should return 200 status code and empty array', async function () {
        const someRandomUuid = faker.string.uuid();
        const response = await requestSender.getTasksByCriteria({ queryParams: { stage_id: someRandomUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [],
        });
      });

      it('should return 200 status code and all the tasks if no query params were defined', async function () {
        // create full tree
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await createStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
        await createTaskRecords(
          [
            { ...createTaskBody, stageId: stage.id },
            { ...createTaskBody, stageId: stage.id },
          ],
          prisma
        );

        const response = await requestSender.getTasksByCriteria();

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toHaveProperty('status', StatusCodes.OK);
        expect(response.body.length).toBeGreaterThan(0);
      });

      describe('Bad Path', function () {
        it('should return 400 status code and a relevant validation error message when the task type is incorrect', async function () {
          const response = await requestSender.getTasksByCriteria({ queryParams: { task_type: 'NOT_VALID_TYPE' as TaskType } });

          if (response.status !== StatusCodes.BAD_REQUEST) {
            throw new Error();
          }

          expect(response).toSatisfyApiSpec();
          expect(response).toMatchObject({
            status: StatusCodes.BAD_REQUEST,
            body: { message: expect.stringMatching(/request\/query\/task_type must be equal to one of the allowed values/) as MatcherContext },
          });
        });
      });

      describe('Sad Path', function () {
        it('should return 500 status code when the database driver throws an error', async function () {
          jest.spyOn(prisma.task, 'findMany').mockRejectedValueOnce(new Error('Database error'));
          const response = await requestSender.getTasksByCriteria({});

          expect(response).toSatisfyApiSpec();
          expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
        });
      });
    });
  });

  describe('#getTaskById', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the stage', async function () {
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await createStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
        const tasks = await createTaskRecords([{ ...createTaskBody, stageId: stage.id }], prisma);

        const getTaskResponse = await requestSender.getTaskById({ pathParams: { taskId: tasks[0]!.id } });

        expect(getTaskResponse).toSatisfyApiSpec();
        expect(getTaskResponse).toMatchObject({ status: StatusCodes.OK, body: { status: TaskOperationStatus.CREATED, type: TaskType.DEFAULT } });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code with a validation error message if the requested task does not exist', async function () {
        const getTaskResponse = await requestSender.getTaskById({ pathParams: { taskId: faker.string.uuid() } });

        expect(getTaskResponse).toSatisfyApiSpec();
        expect(getTaskResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: tasksErrorMessages.taskNotFound },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.task, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getTaskById({ pathParams: { taskId: faker.string.uuid() } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getTaskByStageId', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the tasks', async function () {
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await createStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
        await createTaskRecords(
          [
            { ...createTaskBody, stageId: stage.id },
            { ...createTaskBody, stageId: stage.id },
          ],
          prisma
        );

        const getTasksResponse = await requestSender.getTasksByStageId({ pathParams: { stageId: stage.id } });

        if (getTasksResponse.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(getTasksResponse).toSatisfyApiSpec();
        expect(getTasksResponse.body.length).toBeGreaterThanOrEqual(2);
        expect(getTasksResponse).toMatchObject({
          status: StatusCodes.OK,
          body: [
            { status: TaskOperationStatus.CREATED, stageId: stage.id },
            { status: TaskOperationStatus.CREATED, stageId: stage.id },
          ],
        });
      });

      it('should return a 200 status code with empty array object if no tasks exists for the requested stage', async function () {
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await createStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
        const createdStageId = stage.id;

        const getTaskResponse = await requestSender.getTasksByStageId({ pathParams: { stageId: createdStageId } });

        expect(getTaskResponse).toSatisfyApiSpec();
        expect(getTaskResponse).toMatchObject({
          status: StatusCodes.OK,
          body: [],
        });
      });
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid', async function () {
        const getTaskResponse = await requestSender.getTasksByStageId({ pathParams: { stageId: 'someInvalidStageId' } });

        expect(getTaskResponse).toSatisfyApiSpec();
        expect(getTaskResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching(/request\/params\/stageId must match format "uuid"/) as MatcherContext },
        });
      });

      it('should return status code 404 when a stage with the given uuid does not exists', async function () {
        const getTaskResponse = await requestSender.getTasksByStageId({ pathParams: { stageId: faker.string.uuid() } });

        expect(getTaskResponse).toSatisfyApiSpec();
        expect(getTaskResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: stagesErrorMessages.stageNotFound },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getTasksByStageId({ pathParams: { stageId: faker.string.uuid() } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#updateUserMetadata', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify tasks's userMetadata object", async function () {
        const userMetadataInput = { someTestKey: 'someTestData' };
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await createStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
        const tasks = await createTaskRecords([{ ...createTaskBody, stageId: stage.id }], prisma);

        const updateUserMetadataResponse = await requestSender.updateTaskUserMetadata({
          pathParams: { taskId: tasks[0]!.id },
          requestBody: userMetadataInput,
        });

        const getTaskResponse = await requestSender.getTaskById({ pathParams: { taskId: tasks[0]!.id } });

        expect(updateUserMetadataResponse).toSatisfyApiSpec();
        expect(getTaskResponse.body).toMatchObject({ userMetadata: userMetadataInput });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a message that specifies that a task with the given id was not found', async function () {
        const getTaskResponse = await requestSender.updateTaskUserMetadata({
          pathParams: { taskId: faker.string.uuid() },
          requestBody: { avi: 'avi' },
        });

        expect(getTaskResponse).toSatisfyApiSpec();
        expect(getTaskResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: tasksErrorMessages.taskNotFound },
        });
      });

      it('should return a 400 status code and a message indicating the request body has an invalid structure', async function () {
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await createStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
        const tasks = await createTaskRecords([{ ...createTaskBody, stageId: stage.id }], prisma);

        const response = await requestSender.updateTaskUserMetadata({
          pathParams: { taskId: tasks[0]!.id },
          requestBody: 'badInputString' as unknown as { [key: string]: string },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: expect.stringMatching('is not valid JSON') as MatcherContext },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.task, 'update').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateTaskUserMetadata({ pathParams: { taskId: faker.string.uuid() }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });
});
