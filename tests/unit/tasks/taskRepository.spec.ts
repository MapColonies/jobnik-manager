/* eslint-disable @typescript-eslint/naming-convention */
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { faker } from '@faker-js/faker';
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@prismaClient';
import { TaskOperationStatus } from '@prismaClient';
import { TaskRepository } from '@src/tasks/DAL/taskRepository';
import { createTaskEntity } from '../generator';

let taskRepository: TaskRepository;
let prisma: DeepMockProxy<PrismaClient>;

describe('TaskRepository', () => {
  beforeEach(function () {
    prisma = mockDeep<PrismaClient>();
    taskRepository = new TaskRepository(jsLogger({ enabled: false }), prisma);
  });

  describe('#findAndLockTaskForDequeue', () => {
    describe('#HappyPath', () => {
      it('should find and lock a task for dequeue', async function () {
        const stageType = 'SOME_STAGE_TYPE';
        const taskId = faker.string.uuid();
        const stageId = faker.string.uuid();

        const rawTaskEntity = {
          id: taskId,
          stage_id: stageId,
          status: TaskOperationStatus.PENDING,
          attempts: 0,
          max_attempts: 3,
          data: {},
          user_metadata: {},
          xstate: {},
          creation_time: new Date(),
          update_time: new Date(),
          start_time: null,
          end_time: null,
          traceparent: null,
          tracestate: null,
        };

        const taskEntity = createTaskEntity({
          id: taskId,
          stageId,
          status: TaskOperationStatus.PENDING,
        });

        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([rawTaskEntity]),
          task: {
            findUnique: vi.fn().mockResolvedValue(taskEntity),
          },
        } as unknown as Parameters<typeof taskRepository.findAndLockTaskForDequeue>[1];

        const result = await taskRepository.findAndLockTaskForDequeue(stageType, mockTx);

        expect(result).toEqual(taskEntity);
        expect(mockTx.$queryRaw).toHaveBeenCalledOnce();
      });

      it('should return null when no tasks are available', async function () {
        const stageType = 'SOME_STAGE_TYPE';

        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([]),
        } as unknown as Parameters<typeof taskRepository.findAndLockTaskForDequeue>[1];

        const result = await taskRepository.findAndLockTaskForDequeue(stageType, mockTx);

        expect(result).toBeNull();
        expect(mockTx.$queryRaw).toHaveBeenCalledOnce();
      });

      it('should return null when task findUnique returns null', async function () {
        const stageType = 'SOME_STAGE_TYPE';
        const taskId = faker.string.uuid();

        const rawTaskEntity = {
          id: taskId,
          stage_id: faker.string.uuid(),
          status: TaskOperationStatus.PENDING,
        };

        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([rawTaskEntity]),
          task: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        } as unknown as Parameters<typeof taskRepository.findAndLockTaskForDequeue>[1];

        const result = await taskRepository.findAndLockTaskForDequeue(stageType, mockTx);

        expect(result).toBeNull();
      });
    });

    describe('#SadPath', () => {
      it('should throw error when database query fails', async function () {
        const stageType = 'SOME_STAGE_TYPE';
        const error = new Error('Database connection error');

        const mockTx = {
          $queryRaw: vi.fn().mockRejectedValue(error),
        } as unknown as Parameters<typeof taskRepository.findAndLockTaskForDequeue>[1];

        await expect(taskRepository.findAndLockTaskForDequeue(stageType, mockTx)).rejects.toThrow('Database connection error');
      });

      it('should throw error when findUnique fails', async function () {
        const stageType = 'SOME_STAGE_TYPE';
        const taskId = faker.string.uuid();

        const rawTaskEntity = {
          id: taskId,
          stage_id: faker.string.uuid(),
          status: TaskOperationStatus.PENDING,
        };

        const error = new Error('Database connection error');

        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([rawTaskEntity]),
          task: {
            findUnique: vi.fn().mockRejectedValue(error),
          },
        } as unknown as Parameters<typeof taskRepository.findAndLockTaskForDequeue>[1];

        await expect(taskRepository.findAndLockTaskForDequeue(stageType, mockTx)).rejects.toThrow('Database connection error');
      });
    });
  });
});
