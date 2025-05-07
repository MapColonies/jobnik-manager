/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { faker } from '@faker-js/faker';
import type { MatcherContext } from '@jest/expect';
import type { paths, operations } from '@openapi';
import { JobMode, StageName, StageOperationStatus, TaskOperationStatus, TaskType, type PrismaClient } from '@prismaClient';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { errorMessages as tasksErrorMessages } from '@src/tasks/models/errors';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { errorMessages as commonErrorMessages } from '@src/common/errors';
import { TaskCreateModel } from '@src/tasks/models/models';
import { StageCreateWithTasksModel } from '@src/stages/models/models';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { inProgressStageXstatePersistentSnapshot } from '@tests/unit/data';
import { createJobRecord, createJobRequestBody } from '../jobs/helpers';
import { addStageRecord, createStageWithJob, createStageWithoutTaskBody } from '../stages/helpers';
import { createTaskBody, createTaskRecords } from './helpers';

describe('task', function () {
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

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
    prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('#getTasks', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching task', async function () {
        // create full tree
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
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
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
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
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
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
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
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
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);

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
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
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
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);
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

  describe('#addTasks', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and create the related tasks for current stage', async function () {
        const stagePayload = {
          data: {},
          type: StageName.DEFAULT,
          userMetadata: {},
        } satisfies StageCreateWithTasksModel;

        const stage = await createStageWithJob(stagePayload, prisma);

        const createTasksPayload = {
          data: {},
          type: TaskType.DEFAULT,
          userMetadata: {},
        } satisfies TaskCreateModel;

        const response = await requestSender.addTasks({
          requestBody: [createTasksPayload],
          pathParams: { stageId: stage.id },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: [createTasksPayload],
        });
      });

      it('should return 200 and create new tasks for a stage with existing tasks', async function () {
        const stagePayload = {
          data: {},
          type: StageName.DEFAULT,
          userMetadata: {},
          tasks: [
            {
              data: {},
              type: TaskType.DEFAULT,
              userMetadata: {},
            },
          ],
        } satisfies StageCreateWithTasksModel;

        const stage = await createStageWithJob(stagePayload, prisma);

        const createTasksPayload = {
          data: {},
          type: TaskType.DEFAULT,
          userMetadata: {},
        } satisfies TaskCreateModel;

        const response = await requestSender.addTasks({
          requestBody: [createTasksPayload],
          pathParams: { stageId: stage.id },
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.CREATED,
          body: [createTasksPayload],
        });
      });

      describe('Bad Path', function () {
        it('should return status code 400 when supplying bad uuid as part of the request', async function () {
          const addTasksResponse = await requestSender.addTasks({ requestBody: [], pathParams: { stageId: 'someInvalidStageId' } });

          expect(addTasksResponse).toMatchObject({
            status: StatusCodes.BAD_REQUEST,
            body: { message: expect.stringMatching(/request\/params\/stageId must match format "uuid"/) as MatcherContext },
          });
        });

        it('should return 400 when the request contains an incorrect body', async function () {
          const stagePayload = {
            data: {},
            type: StageName.DEFAULT,
            userMetadata: {},
          } satisfies StageCreateWithTasksModel;

          const stage = await createStageWithJob(stagePayload, prisma);

          const addTasksResponse = await requestSender.addTasks({
            pathParams: { stageId: stage.id },
            requestBody: {} as unknown as [],
          });

          expect(addTasksResponse).toMatchObject({
            status: StatusCodes.BAD_REQUEST,
            body: { message: expect.stringMatching(/request\/body must be array/) as MatcherContext },
          });
        });

        it('should return 400 when adding tasks to a pre-defined job with running stage', async function () {
          const job = await createJobRecord({ ...createJobRequestBody, jobMode: JobMode.PRE_DEFINED }, prisma);
          const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);

          // generate some stage in running mode (in-progress)
          await requestSender.updateStageStatus({ pathParams: { stageId: stage.id }, requestBody: { status: StageOperationStatus.PENDING } });
          await requestSender.updateStageStatus({ pathParams: { stageId: stage.id }, requestBody: { status: StageOperationStatus.IN_PROGRESS } });

          const addTasksResponse = await requestSender.addTasks({ requestBody: [], pathParams: { stageId: stage.id } });

          expect(addTasksResponse).toSatisfyApiSpec();
          expect(addTasksResponse).toMatchObject({
            status: StatusCodes.BAD_REQUEST,
            body: { message: tasksErrorMessages.addTaskNotAllowed },
          });
        });

        it('should return 400 when attempting to add tasks to a finalized stage', async function () {
          const job = await createJobRecord({ ...createJobRequestBody, jobMode: JobMode.PRE_DEFINED }, prisma);
          const stage = await addStageRecord({ ...createStageWithoutTaskBody, jobId: job.id }, prisma);

          // generate some stage in finite state (aborted)
          await requestSender.updateStageStatus({ pathParams: { stageId: stage.id }, requestBody: { status: StageOperationStatus.ABORTED } });

          const addTasksResponse = await requestSender.addTasks({ requestBody: [], pathParams: { stageId: stage.id } });

          expect(addTasksResponse).toSatisfyApiSpec();
          expect(addTasksResponse).toMatchObject({
            status: StatusCodes.BAD_REQUEST,
            body: { message: stagesErrorMessages.stageAlreadyFinishedTasksError },
          });
        });

        it('should return 404 when attempting to update a non-existent stage ID', async function () {
          const createStagesPayload = {
            data: {},
            type: TaskType.DEFAULT,
            userMetadata: {},
          } satisfies TaskCreateModel;

          const response = await requestSender.addTasks({
            requestBody: [createStagesPayload],
            pathParams: { stageId: faker.string.uuid() },
          });

          if (response.status !== StatusCodes.NOT_FOUND) {
            throw new Error();
          }

          expect(response).toSatisfyApiSpec();
          expect(response).toMatchObject({
            status: StatusCodes.NOT_FOUND,
            body: { message: stagesErrorMessages.stageNotFound },
          });
        });
      });

      describe('Sad Path', function () {
        it('should return 500 status code when the database driver throws an error', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

          const response = await requestSender.addTasks({
            requestBody: [],
            pathParams: { stageId: faker.string.uuid() },
          });

          expect(response).toSatisfyApiSpec();
          expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
        });
      });
    });
  });

  describe('#updateStatus', function () {
    describe('Happy Path', function () {
      it("should return 200 status code and change tasks's status to PENDING", async function () {
        const initialSummary = { ...defaultStatusCounts, CREATED: 1 };
        const expectedSummary = { ...defaultStatusCounts, PENDING: 1, CREATED: 0 };
        const updateStatusInput = { status: TaskOperationStatus.PENDING };

        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, summary: initialSummary, jobId: job.id }, prisma);
        const tasks = await createTaskRecords([{ ...createTaskBody, stageId: stage.id }], prisma);

        const updateStatusResponse = await requestSender.updateTaskStatus({
          pathParams: { taskId: tasks[0]!.id },
          requestBody: updateStatusInput,
        });

        const getTaskResponse = await requestSender.getTaskById({ pathParams: { taskId: tasks[0]!.id } });
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(updateStatusResponse).toSatisfyApiSpec();
        expect(getTaskResponse.body).toMatchObject(updateStatusInput);
        expect(getStageResponse.body).toMatchObject({ summary: expectedSummary });
      });

      it("should return 200 status code and change tasks's status to RETRIED and increase attempts", async function () {
        const initialSummary = { ...defaultStatusCounts, IN_PROGRESS: 1 };
        const updateStatusInput = { status: TaskOperationStatus.FAILED };

        const expectedSummary = { ...defaultStatusCounts, RETRIED: 1, IN_PROGRESS: 0, FAILED: 0 };
        const expectedStatus = { status: TaskOperationStatus.RETRIED, attempts: 1 };

        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, summary: initialSummary, jobId: job.id }, prisma);
        const tasks = await createTaskRecords(
          [
            {
              ...createTaskBody,
              stageId: stage.id,
              attempts: 0,
              maxAttempts: 2,
              status: TaskOperationStatus.IN_PROGRESS,
              xstate: inProgressStageXstatePersistentSnapshot,
            },
          ],
          prisma
        );

        const updateStatusResponse = await requestSender.updateTaskStatus({
          pathParams: { taskId: tasks[0]!.id },
          requestBody: updateStatusInput,
        });

        const getTaskResponse = await requestSender.getTaskById({ pathParams: { taskId: tasks[0]!.id } });
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(updateStatusResponse).toSatisfyApiSpec();
        expect(getTaskResponse.body).toMatchObject(expectedStatus);
        expect(getStageResponse.body).toMatchObject({ summary: expectedSummary });
      });

      it("should return 200 status code and change tasks's status to FAILED", async function () {
        const initialSummary = { ...defaultStatusCounts, IN_PROGRESS: 1 };
        const updateStatusInput = { status: TaskOperationStatus.FAILED };

        const expectedSummary = { ...defaultStatusCounts, RETRIED: 0, IN_PROGRESS: 0, FAILED: 1 };
        const expectedStatus = { status: TaskOperationStatus.FAILED, attempts: 2 };

        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid() }, prisma);
        const stage = await addStageRecord({ ...createStageWithoutTaskBody, summary: initialSummary, jobId: job.id }, prisma);
        const tasks = await createTaskRecords(
          [
            {
              ...createTaskBody,
              stageId: stage.id,
              attempts: 2,
              maxAttempts: 2,
              status: TaskOperationStatus.IN_PROGRESS,
              xstate: inProgressStageXstatePersistentSnapshot,
            },
          ],
          prisma
        );

        const updateStatusResponse = await requestSender.updateTaskStatus({
          pathParams: { taskId: tasks[0]!.id },
          requestBody: updateStatusInput,
        });

        const getTaskResponse = await requestSender.getTaskById({ pathParams: { taskId: tasks[0]!.id } });
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(updateStatusResponse).toSatisfyApiSpec();
        expect(getTaskResponse.body).toMatchObject(expectedStatus);
        expect(getStageResponse.body).toMatchObject({ summary: expectedSummary });
      });

      it("should return 200 status code and change tasks's status to COMPLETED", async function () {
        const initialSummary = { ...defaultStatusCounts, IN_PROGRESS: 2 };
        const updateStatusInput = { status: TaskOperationStatus.COMPLETED };

        const expectedSummary = { ...defaultStatusCounts, IN_PROGRESS: 1, COMPLETED: 1 };
        const expectedTaskStatus = { status: TaskOperationStatus.COMPLETED };
        const expectedStageStatus = { status: TaskOperationStatus.IN_PROGRESS, percentage: 50, summary: expectedSummary };

        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid(), jobMode: JobMode.PRE_DEFINED }, prisma);
        const stage = await addStageRecord(
          {
            ...createStageWithoutTaskBody,
            status: StageOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            summary: initialSummary,
            jobId: job.id,
          },
          prisma
        );
        const tasks = await createTaskRecords(
          [
            { ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot },
            { ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot },
          ],
          prisma
        );

        const updateStatusResponse = await requestSender.updateTaskStatus({
          pathParams: { taskId: tasks[0]!.id },
          requestBody: updateStatusInput,
        });

        const getTaskResponse = await requestSender.getTaskById({ pathParams: { taskId: tasks[0]!.id } });
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(updateStatusResponse).toSatisfyApiSpec();
        expect(getTaskResponse.body).toMatchObject(expectedTaskStatus);
        expect(getStageResponse.body).toMatchObject(expectedStageStatus);
      });

      it("should return 200 status code and change tasks's status to COMPLETED + COMPLETED stage of pre-defined job", async function () {
        const initialSummary = { ...defaultStatusCounts, IN_PROGRESS: 1 };
        const updateStatusInput = { status: TaskOperationStatus.COMPLETED };

        const expectedSummary = { ...defaultStatusCounts, IN_PROGRESS: 0, COMPLETED: 1 };
        const expectedTaskStatus = { status: TaskOperationStatus.COMPLETED };
        const expectedStageStatus = { status: TaskOperationStatus.COMPLETED, percentage: 100, summary: expectedSummary };

        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid(), jobMode: JobMode.PRE_DEFINED }, prisma);
        const stage = await addStageRecord(
          {
            ...createStageWithoutTaskBody,
            status: StageOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            summary: initialSummary,
            jobId: job.id,
          },
          prisma
        );
        const tasks = await createTaskRecords(
          [{ ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot }],
          prisma
        );

        const updateStatusResponse = await requestSender.updateTaskStatus({
          pathParams: { taskId: tasks[0]!.id },
          requestBody: updateStatusInput,
        });

        const getTaskResponse = await requestSender.getTaskById({ pathParams: { taskId: tasks[0]!.id } });
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(updateStatusResponse).toSatisfyApiSpec();
        expect(getTaskResponse.body).toMatchObject(expectedTaskStatus);
        expect(getStageResponse.body).toMatchObject(expectedStageStatus);
      });
    });

    describe('Bad Path', function () {
      it('should return 400 with detailed error for invalid status transition', async function () {
        const job = await createJobRecord({ ...createJobRequestBody, id: faker.string.uuid(), jobMode: JobMode.PRE_DEFINED }, prisma);
        const stage = await addStageRecord(
          {
            ...createStageWithoutTaskBody,
            status: StageOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            jobId: job.id,
          },
          prisma
        );
        const tasks = await createTaskRecords([{ ...createTaskBody, stageId: stage.id, status: TaskOperationStatus.CREATED }], prisma);

        const updateStatusResponse = await requestSender.updateTaskStatus({
          pathParams: { taskId: tasks[0]!.id },
          requestBody: { status: TaskOperationStatus.COMPLETED },
        });

        expect(updateStatusResponse).toSatisfyApiSpec();
        expect(updateStatusResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          body: { message: commonErrorMessages.invalidStatusChange },
        });
      });

      it('should return a 404 status code along with a message that specifies that a task with the given id was not found', async function () {
        const updateStatusResponse = await requestSender.updateTaskStatus({
          pathParams: { taskId: faker.string.uuid() },
          requestBody: { status: TaskOperationStatus.PENDING },
        });

        expect(updateStatusResponse).toSatisfyApiSpec();
        expect(updateStatusResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: tasksErrorMessages.taskNotFound },
        });
      });

      describe('Sad Path', function () {
        it('should return 500 status code when the database driver throws an error', async function () {
          jest.spyOn(prisma.task, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

          const response = await requestSender.updateTaskStatus({
            pathParams: { taskId: faker.string.uuid() },
            requestBody: { status: TaskOperationStatus.PENDING },
          });

          expect(response).toSatisfyApiSpec();
          expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
        });
      });
    });
  });
});
