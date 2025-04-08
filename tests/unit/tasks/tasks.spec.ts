/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { PrismaClient, Prisma } from '@prisma/client';
import { StageManager } from '@src/stages/models/manager';
import { JobManager } from '@src/jobs/models/manager';
import { errorMessages as stagesErrorMessages } from '@src/stages/models/errors';
import { errorMessages as tasksErrorMessages } from '@src/tasks/models/errors';
import { TaskManager } from '@src/tasks/models/manager';
import { prismaKnownErrors } from '@src/common/errors';
import { createStageEntity, createTaskEntity } from '../generator';

let jobManager: JobManager;
let stageManager: StageManager;
let taskManager: TaskManager;

const prisma = new PrismaClient();

const notFoundError = new Prisma.PrismaClientKnownRequestError('RECORD_NOT_FOUND', { code: prismaKnownErrors.recordNotFound, clientVersion: '1' });

describe('JobManager', () => {
  beforeEach(function () {
    jobManager = new JobManager(jsLogger({ enabled: false }), prisma);
    stageManager = new StageManager(jsLogger({ enabled: false }), prisma, jobManager);
    taskManager = new TaskManager(jsLogger({ enabled: false }), prisma, stageManager);
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

          const tasks = await taskManager.getTasks({ task_type: 'DEFAULT' });

          const { stage_id, creationTime, updateTime, xstate, ...rest } = taskEntity;
          const expectedTask = [{ ...rest, stageId: stage_id, creationTime: creationTime.toISOString(), updateTime: updateTime.toISOString() }];

          expect(tasks).toMatchObject(expectedTask);
        });

        it('should return empty array', async function () {
          jest.spyOn(prisma.task, 'findMany').mockResolvedValue([]);

          const tasks = await taskManager.getTasks({ task_type: 'DEFAULT' });

          expect(tasks).toMatchObject([]);
        });
      });

      describe('#SadPath', () => {
        it('should failed on db error when find tasks', async function () {
          jest.spyOn(prisma.task, 'findMany').mockRejectedValueOnce(new Error('db connection error'));

          await expect(taskManager.getTasks({ task_type: 'DEFAULT' })).rejects.toThrow('db connection error');
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

          const { stage_id, creationTime, updateTime, xstate, ...rest } = taskEntity;
          const expectedTask = { ...rest, stageId: stage_id, creationTime: creationTime.toISOString(), updateTime: updateTime.toISOString() };

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
          const taskEntity = createTaskEntity({ stage_id: stageEntity.id });

          jest.spyOn(prisma.stage, 'findUnique').mockResolvedValue(stageEntity);
          jest.spyOn(prisma.task, 'findMany').mockResolvedValue([taskEntity]);

          const stage = await taskManager.getTasksByStageId(stageEntity.id);

          const { stage_id, creationTime, updateTime, xstate, ...rest } = taskEntity;
          const expectedTask = [{ ...rest, stageId: stage_id, creationTime: creationTime.toISOString(), updateTime: updateTime.toISOString() }];

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
  });
});
