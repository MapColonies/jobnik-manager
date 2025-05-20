/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { faker } from '@faker-js/faker';
import { PrismaClient, Prisma, TaskType, JobMode, StageOperationStatus, TaskOperationStatus } from '@prismaClient';
import { StageManager } from '@src/stages/models/manager';
import { JobManager } from '@src/jobs/models/manager';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { errorMessages as tasksErrorMessages } from '@src/tasks/models/errors';
import { TaskManager } from '@src/tasks/models/manager';
import { InvalidUpdateError, prismaKnownErrors } from '@src/common/errors';
import { TaskCreateModel } from '@src/tasks/models/models';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { StageRepository } from '@src/stages/models/DAL/stageRepository';
import { createJobEntity, createStageEntity, createTaskEntity } from '../generator';
import { abortedStageXstatePersistentSnapshot, inProgressStageXstatePersistentSnapshot } from '../data';

let jobManager: JobManager;
let stageManager: StageManager;
let taskManager: TaskManager;
let stageRepository: StageRepository;

const prisma = new PrismaClient();

const notFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: prismaKnownErrors.recordNotFound, clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    jobManager = new JobManager(jsLogger({ enabled: false }), prisma);
    stageRepository = new StageRepository(jsLogger({ enabled: false }), prisma);
    stageManager = new StageManager(jsLogger({ enabled: false }), prisma, stageRepository, jobManager);
    taskManager = new TaskManager(jsLogger({ enabled: false }), prisma, stageManager, jobManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#Tasks', () => {
    describe('#getTasks', () => {
      describe('#HappyPath', () => {
        it('should return array with single task formatted object by criteria', async function () {
          const taskEntity = createTaskEntity({});
          jest.spyOn(prisma.task, 'findMany').mockResolvedValue([taskEntity]);

          const tasks = await taskManager.getTasks({ task_type: TaskType.DEFAULT });

          const { creationTime, updateTime, xstate, ...rest } = taskEntity;
          const expectedTask = [{ ...rest, creationTime: creationTime.toISOString(), updateTime: updateTime.toISOString() }];

          expect(tasks).toMatchObject(expectedTask);
        });

        it('should return empty array', async function () {
          jest.spyOn(prisma.task, 'findMany').mockResolvedValue([]);

          const tasks = await taskManager.getTasks({ task_type: TaskType.DEFAULT });

          expect(tasks).toMatchObject([]);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when find tasks', async function () {
          jest.spyOn(prisma.task, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(taskManager.getTasks({ task_type: TaskType.DEFAULT })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#getTaskById', () => {
      describe('#HappyPath', () => {
        it('should return task object by provided id', async function () {
          const taskEntity = createTaskEntity({});
          const taskId = taskEntity.id;
          jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(taskEntity);

          const task = await taskManager.getTaskById(taskId);

          const { creationTime, updateTime, xstate, ...rest } = taskEntity;
          const expectedTask = { ...rest, creationTime: creationTime.toISOString(), updateTime: updateTime.toISOString() };

          expect(task).toMatchObject(expectedTask);
        });
      });

      describe('#BadPath', () => {
        it('should result in failure when attempting to retrieve a task with a non-existent id', async function () {
          jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(null);

          await expect(taskManager.getTaskById('some_id')).rejects.toThrow(tasksErrorMessages.taskNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail and throw an error if prisma throws an error', async function () {
          jest.spyOn(prisma.task, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(taskManager.getTaskById('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#getTaskByStageId', () => {
      describe('#HappyPath', () => {
        it('should return task object by provided stage id', async function () {
          const stageEntity = createStageEntity({});
          const taskEntity = createTaskEntity({ stageId: stageEntity.id });

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);
          jest.spyOn(prisma.task, 'findMany').mockResolvedValue([taskEntity]);

          const stage = await taskManager.getTasksByStageId(stageEntity.id);

          const { creationTime, updateTime, xstate, ...rest } = taskEntity;
          const expectedTask = [{ ...rest, creationTime: creationTime.toISOString(), updateTime: updateTime.toISOString() }];

          expect(stage).toMatchObject(expectedTask);
        });
      });

      describe('#BadPath', () => {
        it('should failed on not founded task when getting by non exists stage', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(null);

          await expect(taskManager.getTasksByStageId('some_id')).rejects.toThrow(stagesErrorMessages.stageNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail and throw an error if prisma throws an error', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

          await expect(taskManager.getTasksByStageId('some_id')).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateUserMetadata', () => {
      describe('#HappyPath', () => {
        it("should update successfully task's metadata object by provided id", async function () {
          const taskEntity = createTaskEntity({});

          jest.spyOn(prisma.task, 'update').mockResolvedValue(taskEntity);

          await expect(taskManager.updateUserMetadata(taskEntity.id, { newData: 'test' })).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should failed on for not exists task when update user metadata', async function () {
          jest.spyOn(prisma.task, 'update').mockRejectedValue(notFoundError);

          await expect(taskManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow(tasksErrorMessages.taskNotFound);
        });
      });

      describe('#SadPath', () => {
        it('should fail and throw an error if prisma throws an error', async function () {
          jest.spyOn(prisma.task, 'update').mockRejectedValueOnce(new Error('db connection error'));

          await expect(taskManager.updateUserMetadata('someId', { testData: 'some new data' })).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#addTasks', () => {
      describe('#HappyPath', () => {
        it("should add new tasks to existing stage's tasks", async function () {
          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();
          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.DYNAMIC });
          const stageEntity = createStageEntity({ jobId: jobEntity.id, id: stageId });
          const taskEntity = createTaskEntity({ stageId: stageId, id: faker.string.uuid(), userMetadata: {} });

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);
          jest.spyOn(prisma.task, 'createManyAndReturn').mockResolvedValue([taskEntity]);
          jest.spyOn(stageRepository, 'updateStageSummary').mockResolvedValue({ ...defaultStatusCounts, total: 1, created: 1 });
          jest.spyOn(stageManager, 'updateStageProgress').mockResolvedValue(undefined);

          const taskPayload = {
            data: {},
            type: TaskType.DEFAULT,
            userMetadata: { someData: '123' },
          } satisfies TaskCreateModel;

          const tasksResponse = await taskManager.addTasks(stageId, [taskPayload]);

          // Extract unnecessary fields from the job object and assemble the expected result
          const { creationTime, updateTime, xstate, ...rest } = taskEntity;

          expect(tasksResponse).toMatchObject([{ ...rest, creationTime: creationTime.toISOString(), updateTime: updateTime.toISOString() }]);
        });
      });

      describe('#BadPath', () => {
        it('should reject adding tasks to a non-existent stage', async function () {
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(null);

          await expect(taskManager.addTasks('someId', [])).rejects.toThrow(stagesErrorMessages.stageNotFound);
        });

        it('should reject adding tasks to a PRE-DEFINED job with IN_PROGRESS stage', async function () {
          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();

          const stageEntity = createStageEntity({
            jobId,
            id: stageId,
            status: StageOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
          });
          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.PRE_DEFINED, stage: [stageEntity] });

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);

          await expect(taskManager.addTasks('someId', [])).rejects.toThrow(new InvalidUpdateError(tasksErrorMessages.addTaskNotAllowed));
        });

        it('should reject adding tasks to a finite stage', async function () {
          const stageEntity = createStageEntity({
            jobId: faker.string.uuid(),
            id: faker.string.uuid(),
            xstate: abortedStageXstatePersistentSnapshot,
          });

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);

          await expect(taskManager.addTasks('someId', [])).rejects.toThrow(
            new InvalidUpdateError(stagesErrorMessages.stageAlreadyFinishedTasksError)
          );
        });
      });

      describe('#SadPath', () => {
        it('should fail with a database error when adding tasks', async function () {
          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();

          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.DYNAMIC });
          const stageEntity = createStageEntity({ jobId: jobEntity.id, id: stageId });

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);
          jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobEntity);

          jest.spyOn(prisma.task, 'createManyAndReturn').mockRejectedValueOnce(new Error('db connection error'));

          await expect(taskManager.addTasks(jobEntity.id, [])).rejects.toThrow('db connection error');
        });
      });
    });

    describe('#updateStatus', () => {
      describe('#HappyPath', () => {
        it('should update task status by provided ID', async function () {
          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();
          const taskId = faker.string.uuid();

          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.PRE_DEFINED });
          const stageEntity = createStageEntity({ jobId: jobEntity.id, id: stageId });
          const taskEntity = createTaskEntity({
            stageId: stageEntity.id,
            id: taskId,
            status: TaskOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
          });

          jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(taskEntity);
          jest.spyOn(prisma.task, 'update').mockResolvedValue(taskEntity);
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);
          jest.spyOn(stageManager, 'updateStageProgressFromTaskChanges').mockResolvedValue(undefined);

          await expect(taskManager.updateStatus(taskId, TaskOperationStatus.COMPLETED)).toResolve();
        });

        it('should update task status to RETRIED', async function () {
          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();
          const taskId = faker.string.uuid();

          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.PRE_DEFINED });
          const stageEntity = createStageEntity({ jobId: jobEntity.id, id: stageId });
          const taskEntity = createTaskEntity({
            stageId: stageEntity.id,
            id: taskId,
            status: TaskOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            attempts: 0,
            maxAttempts: 3,
          });

          jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(taskEntity);
          jest.spyOn(prisma.task, 'update').mockResolvedValue(taskEntity);
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);
          jest.spyOn(stageManager, 'updateStageProgressFromTaskChanges').mockResolvedValue(undefined);

          await expect(taskManager.updateStatus(taskId, TaskOperationStatus.FAILED)).toResolve();
        });

        it('should update task status to FAILED', async function () {
          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();
          const taskId = faker.string.uuid();

          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.PRE_DEFINED });
          const stageEntity = createStageEntity({ jobId: jobEntity.id, id: stageId });
          const taskEntity = createTaskEntity({
            stageId: stageEntity.id,
            id: taskId,
            status: TaskOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            attempts: 3,
            maxAttempts: 3,
          });

          jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(taskEntity);
          jest.spyOn(prisma.task, 'update').mockResolvedValue(taskEntity);
          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);
          jest.spyOn(stageManager, 'updateStageProgressFromTaskChanges').mockResolvedValue(undefined);

          await expect(taskManager.updateStatus(taskId, TaskOperationStatus.FAILED)).toResolve();
        });
      });

      describe('#BadPath', () => {
        it('should reject adding tasks to a non-existent task', async function () {
          jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(null);

          await expect(taskManager.updateStatus('someId', TaskOperationStatus.ABORTED)).rejects.toThrow(tasksErrorMessages.taskNotFound);
        });

        it("should reject update invalid task's status [from IN_PROGRESS to CREATED]", async function () {
          const jobId = faker.string.uuid();
          const stageId = faker.string.uuid();
          const taskId = faker.string.uuid();

          const jobEntity = createJobEntity({ id: jobId, jobMode: JobMode.PRE_DEFINED });
          const stageEntity = createStageEntity({ jobId: jobEntity.id, id: stageId });
          const taskEntity = createTaskEntity({
            stageId: stageEntity.id,
            id: taskId,
            status: TaskOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
          });

          jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(taskEntity);

          await expect(taskManager.updateStatus(taskId, TaskOperationStatus.CREATED)).rejects.toThrow(InvalidUpdateError);
        });

        describe('#SadPath', () => {
          it('should fail with a database error when adding tasks', async function () {
            jest.spyOn(prisma.task, 'findUnique').mockRejectedValueOnce(new Error('db connection error'));

            await expect(taskManager.updateStatus(faker.string.uuid(), TaskOperationStatus.PENDING)).rejects.toThrow('db connection error');
          });
        });
      });
    });
  });
});
