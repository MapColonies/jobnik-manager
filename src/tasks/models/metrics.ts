import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Counter, Histogram } from 'prom-client';
import type { Registry } from 'prom-client';
import { TaskOperationStatus, type PrismaClient, type Task } from '@prismaClient';
import { SERVICES } from '@common/constants';
import type { PrismaTransaction } from '@src/db/types';

// Time conversion constants
const MILLISECONDS_TO_SECONDS = 1000;
const DEFAULT_TRANSITION_DURATION_SECONDS = 0.001; // 1ms default for transitions without explicit timing

// Histogram bucket constants for task processing duration (in seconds)
const BUCKET_100_MS = 0.1;
const BUCKET_500_MS = 0.5;
const BUCKET_1_SEC = 1;
const BUCKET_5_SEC = 5;
const BUCKET_10_SEC = 10;
const BUCKET_30_SEC = 30;
const BUCKET_1_MIN = 60;
const BUCKET_5_MIN = 300;
const BUCKET_10_MIN = 600;
const BUCKET_30_MIN = 1800;
const BUCKET_1_HOUR = 3600;
const BUCKET_2_HOURS = 7200;
const BUCKET_4_HOURS = 14400;
const BUCKET_8_HOURS = 28800;
const BUCKET_24_HOURS = 86400;
const BUCKET_48_HOURS = 172800;
const BUCKET_1_WEEK = 604800;

// Histogram bucket constants for task processing duration (in seconds)
// Processing times can vary widely, so we use a broader range
const PROCESSING_DURATION_BUCKETS = [
  BUCKET_100_MS,
  BUCKET_500_MS,
  BUCKET_1_SEC,
  BUCKET_5_SEC,
  BUCKET_10_SEC,
  BUCKET_30_SEC,
  BUCKET_1_MIN,
  BUCKET_5_MIN,
  BUCKET_10_MIN,
  BUCKET_30_MIN,
  BUCKET_1_HOUR,
  BUCKET_2_HOURS,
  BUCKET_4_HOURS,
  BUCKET_8_HOURS,
  BUCKET_24_HOURS,
  BUCKET_48_HOURS,
  BUCKET_1_WEEK,
];

/**
 * Task metrics manager for handling task-related Prometheus metrics
 */
@injectable()
export class TaskMetrics {
  private readonly staleTasksReleasedCounter: Counter;
  private readonly taskProcessingDurationHistogram: Histogram;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient
  ) {
    // Initialize the stale tasks released counter if it doesn't already exist
    const existingCounter = this.metricsRegistry.getSingleMetric('jobnik_stale_tasks_released_total');
    if (!existingCounter) {
      this.staleTasksReleasedCounter = new Counter({
        name: 'jobnik_stale_tasks_released_total',
        help: 'Total number of stale tasks that have been released (changed from IN_PROGRESS to FAILED)',
        labelNames: ['result'],
        registers: [this.metricsRegistry],
      });
    } else {
      this.staleTasksReleasedCounter = existingCounter as Counter;
    }

    // Initialize the task processing duration histogram if it doesn't already exist
    const existingProcessingHistogram = this.metricsRegistry.getSingleMetric('jobnik_task_processing_duration_seconds');
    if (!existingProcessingHistogram) {
      this.taskProcessingDurationHistogram = new Histogram({
        name: 'jobnik_task_processing_duration_seconds',
        help: 'Time in seconds for task processing between status transitions',
        labelNames: ['stageType', 'from_status', 'to_status'],
        buckets: PROCESSING_DURATION_BUCKETS,
        registers: [this.metricsRegistry],
      });
    } else {
      this.taskProcessingDurationHistogram = existingProcessingHistogram as Histogram;
    }
  }

  /**
   * Records metrics for stale tasks that have been released
   * @param successCount - Number of successfully released tasks
   * @param failureCount - Number of tasks that failed to be released
   */
  public recordStaleTasksReleased(successCount: number, failureCount: number): void {
    this.staleTasksReleasedCounter.inc({ result: 'success' }, successCount);
    if (failureCount > 0) {
      this.staleTasksReleasedCounter.inc({ result: 'failure' }, failureCount);
    }
  }

  /**
   * Records task status transition metrics
   * @param stageType - The stage type
   * @param fromStatus - The previous status
   * @param toStatus - The new status
   * @param processingDurationSeconds - Time spent in the previous status
   */
  public recordTaskStatusTransition(
    stageType: string,
    fromStatus: TaskOperationStatus,
    toStatus: TaskOperationStatus,
    processingDurationSeconds: number
  ): void {
    try {
      const labels = {
        stageType,
        from_status: fromStatus, // eslint-disable-line @typescript-eslint/naming-convention
        to_status: toStatus, // eslint-disable-line @typescript-eslint/naming-convention
      };

      // Record processing duration (this also increments the _count metric)
      this.taskProcessingDurationHistogram.observe(labels, processingDurationSeconds);

      this.logger.debug({
        msg: 'Task processing duration metric recorded successfully',
        stageType,
        fromStatus,
        toStatus,
        processingDurationSeconds,
      });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to record task status transition metric',
        stageType,
        fromStatus,
        toStatus,
        processingDurationSeconds,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Records task completion metrics including status transitions
   */
  public async recordTaskMetrics(task: Task, nextStatus: TaskOperationStatus, endTime: Date, tx?: PrismaTransaction): Promise<void> {
    const startTime = Date.now();
    const logContext = {
      taskId: task.id,
      stageId: task.stageId,
      previousStatus: task.status,
      nextStatus,
      endTime: endTime.toISOString(),
    };

    try {
      // Get stage information for labeling
      const stageQuery = tx ?? this.prisma;
      const stage = await stageQuery.stage.findUnique({
        where: { id: task.stageId },
        select: { type: true },
      });

      if (!stage) {
        this.logger.warn({
          ...logContext,
          msg: 'Stage not found when recording task metrics, skipping metrics collection',
          executionTimeMs: Date.now() - startTime,
        });
        return;
      }

      const stageType = stage.type;

      // Calculate processing duration based on the status transition
      let processingDurationSeconds = 0;
      if (task.status === TaskOperationStatus.PENDING && nextStatus === TaskOperationStatus.IN_PROGRESS) {
        // Queue wait time (PENDING -> IN_PROGRESS)
        const queueWaitTimeMs = endTime.getTime() - task.creationTime.getTime();
        processingDurationSeconds = queueWaitTimeMs / MILLISECONDS_TO_SECONDS;
      } else if (task.status === TaskOperationStatus.IN_PROGRESS && task.startTime) {
        // Processing time (IN_PROGRESS -> COMPLETED/FAILED)
        const processingTimeMs = endTime.getTime() - task.startTime.getTime();
        processingDurationSeconds = processingTimeMs / MILLISECONDS_TO_SECONDS;
      } else {
        // For other transitions, use a minimal duration
        processingDurationSeconds = DEFAULT_TRANSITION_DURATION_SECONDS;
      }

      // Record the status transition
      this.recordTaskStatusTransition(stageType, task.status, nextStatus, processingDurationSeconds);

      this.logger.debug({
        ...logContext,
        msg: 'Task metrics recorded successfully',
        stageType,
        processingDurationSeconds,
        executionTimeMs: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error({
        ...logContext,
        msg: 'Failed to record task metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      });
    }
  }
}
