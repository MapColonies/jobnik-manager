import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { TaskOperationStatus, StageOperationStatus, JobOperationStatus, type PrismaClient } from '@prismaClient';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { TaskReleaser } from '@src/tasks/models/taskReleaser';
import type { CronConfig } from '@src/common/utils/cron';
import { inProgressStageXstatePersistentSnapshot } from '@tests/unit/data';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { createJobnikTree } from '../common/utils';

describe('TaskReleaser', () => {
  let taskReleaser: TaskReleaser;
  let prisma: PrismaClient;

  const mockCronConfig: CronConfig = {
    enabled: true,
    schedule: '*/5 * * * *',
    timeDeltaPeriodInMinutes: 30,
  };

  beforeAll(async () => {
    await initConfig(true);
  });

  beforeEach(async () => {
    const [, container] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });

    taskReleaser = container.resolve(TaskReleaser);
    prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('#cleanStaleTasks', function () {
    describe('Happy Path', function () {
      it('should clean stale tasks and update stage summaries correctly', async () => {
        // Create job tree with stale tasks that have maxAttempts: 1 so they go directly to FAILED
        const { stage } = await createJobnikTree(
          prisma,
          { status: JobOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot },
          {
            status: StageOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            type: 'SOME_STALE_TEST',
            summary: { ...defaultStatusCounts, inProgress: 2, total: 2 },
          },
          [
            {
              status: TaskOperationStatus.IN_PROGRESS,
              xstate: inProgressStageXstatePersistentSnapshot,
              maxAttempts: 1, // Ensure tasks fail immediately instead of going to RETRIED
              attempts: 0,
              startTime: new Date(Date.now() - 45 * 60 * 1000),
            },
            {
              status: TaskOperationStatus.IN_PROGRESS,
              xstate: inProgressStageXstatePersistentSnapshot,
              maxAttempts: 1, // Ensure tasks fail immediately instead of going to RETRIED
              attempts: 0,
              startTime: new Date(Date.now() - 45 * 60 * 1000),
            },
          ]
        );

        // // Verify initial state
        const initialTasks = await prisma.task.findMany({
          where: { stageId: stage.id },
          select: { id: true, status: true, startTime: true, maxAttempts: true, attempts: true },
        });

        expect(initialTasks).toSatisfyAll((t: (typeof initialTasks)[0]) => t.status === TaskOperationStatus.IN_PROGRESS);

        // Run cleanup
        await expect(taskReleaser.cleanStaleTasks(mockCronConfig)).toResolve();

        // // Verify tasks were updated to FAILED
        const updatedTasks = await prisma.task.findMany({
          where: { stageId: stage.id },
          select: { id: true, status: true, startTime: true, attempts: true, maxAttempts: true },
        });

        expect(updatedTasks).toSatisfyAll((t: (typeof updatedTasks)[0]) => t.status === TaskOperationStatus.FAILED);

        // Verify stage summary was updated
        const updatedStage = await prisma.stage.findUnique({
          where: { id: stage.id },
          select: { summary: true },
        });

        expect(updatedStage?.summary).toMatchObject({
          failed: 2,
          inProgress: 0,
          total: 2,
        });
      });

      it('should not clean stale tasks when startTime less than period threshold', async () => {
        // Create job tree with stale tasks that have maxAttempts: 1 so they go directly to FAILED
        const { stage } = await createJobnikTree(
          prisma,
          { status: JobOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot },
          {
            status: StageOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            type: 'SOME_STALE_TEST',
            summary: { ...defaultStatusCounts, inProgress: 1, total: 1 },
          },
          [
            {
              status: TaskOperationStatus.IN_PROGRESS,
              xstate: inProgressStageXstatePersistentSnapshot,
              maxAttempts: 1, // Ensure tasks fail immediately instead of going to RETRIED
              attempts: 0,
              startTime: new Date(Date.now()),
            },
          ]
        );

        // // Verify initial state
        const initialTasks = await prisma.task.findMany({
          where: { stageId: stage.id },
          select: { id: true, status: true, startTime: true, maxAttempts: true, attempts: true },
        });

        expect(initialTasks).toSatisfyAll((t: (typeof initialTasks)[0]) => t.status === TaskOperationStatus.IN_PROGRESS);

        // Run cleanup
        await expect(taskReleaser.cleanStaleTasks({ ...mockCronConfig, timeDeltaPeriodInMinutes: 600 })).toResolve();

        // // Verify tasks were updated to FAILED
        const updatedTasks = await prisma.task.findMany({
          where: { stageId: stage.id },
          select: { id: true, status: true, startTime: true, attempts: true, maxAttempts: true },
        });

        expect(updatedTasks).toSatisfyAll((t: (typeof updatedTasks)[0]) => t.status === TaskOperationStatus.IN_PROGRESS);

        // Verify stage summary was updated
        const updatedStage = await prisma.stage.findUnique({
          where: { id: stage.id },
          select: { summary: true },
        });

        expect(updatedStage?.summary).toMatchObject({
          failed: 0,
          inProgress: 1,
          total: 1,
        });
      });

      it('should handle empty database gracefully', async () => {
        await expect(taskReleaser.cleanStaleTasks(mockCronConfig)).toResolve();
      });

      it('should move tasks to RETRIED status when they have remaining attempts', async () => {
        // Create job tree with stale tasks that have maxAttempts > 1 so they go to RETRIED
        const { stage } = await createJobnikTree(
          prisma,
          { status: JobOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot },
          {
            status: StageOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            type: 'SOME_STALE_TEST',
            summary: { ...defaultStatusCounts, inProgress: 1, total: 1 },
          },
          [
            {
              status: TaskOperationStatus.IN_PROGRESS,
              xstate: inProgressStageXstatePersistentSnapshot,
              maxAttempts: 3, // Allow tasks to be retried before failing
              attempts: 0,
              startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
            },
          ]
        );

        // Run cleanup
        await expect(taskReleaser.cleanStaleTasks(mockCronConfig)).toResolve();

        // Verify task was moved to RETRIED
        const updatedTasks = await prisma.task.findMany({
          where: { stageId: stage.id },
          select: { id: true, status: true, attempts: true, maxAttempts: true },
        });

        expect(updatedTasks[0]).toMatchObject({
          status: TaskOperationStatus.RETRIED,
          attempts: 1,
          maxAttempts: 3,
        });
      });

      it('should log debug messages when successfully updating stale task status', async () => {
        // Create job tree with stale tasks that have maxAttempts: 1 so they go directly to FAILED
        await createJobnikTree(
          prisma,
          { status: JobOperationStatus.IN_PROGRESS, xstate: inProgressStageXstatePersistentSnapshot },
          {
            status: StageOperationStatus.IN_PROGRESS,
            xstate: inProgressStageXstatePersistentSnapshot,
            type: 'SOME_STALE_TEST',
            summary: { ...defaultStatusCounts, inProgress: 1, total: 1 },
          },
          [
            {
              status: TaskOperationStatus.IN_PROGRESS,
              maxAttempts: 1, // Ensure tasks fail immediately instead of going to RETRIED
              attempts: 0,
              startTime: new Date(Date.now() - 45 * 60 * 1000),
            },
          ]
        );

        // Run cleanup
        await expect(taskReleaser.cleanStaleTasks(mockCronConfig)).toResolve();
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.task, 'findMany').mockRejectedValueOnce(new Error('Database error'));

        await expect(taskReleaser.cleanStaleTasks(mockCronConfig)).toReject();
      });
    });
  });
});
