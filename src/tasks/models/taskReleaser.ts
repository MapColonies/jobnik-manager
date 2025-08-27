import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import type { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { subMinutes } from 'date-fns/subMinutes';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { TaskOperationStatus, type PrismaClient } from '@prismaClient';
import { SERVICES } from '@common/constants';
import type { CronConfig } from '@src/common/utils/cron';
import { TaskManager } from './manager';

@injectable()
export class TaskReleaser {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(TaskManager) private readonly taskManager: TaskManager
  ) {}

  /**
   * Cleans up stale tasks based on the configured time delta
   * @param config - Cron configuration containing time delta settings
   */
  @withSpanAsyncV4
  public async cleanStaleTasks(config: CronConfig): Promise<void> {
    try {
      const formattedPeriod = formatDistanceToNow(subMinutes(new Date(), config.timeDeltaPeriodInMinutes));

      this.logger.debug({
        msg: 'Starting task cleanup process',
        timeDeltaPeriodInMinutes: config.timeDeltaPeriodInMinutes,
        formattedTimePeriod: formattedPeriod,
      });

      const cutoffTime = subMinutes(new Date(), config.timeDeltaPeriodInMinutes);

      // Find tasks that are stuck in IN_PROGRESS state beyond the time threshold
      const staleTasks = await this.prisma.task.findMany({
        where: {
          status: TaskOperationStatus.IN_PROGRESS,
          startTime: {
            lt: cutoffTime,
          },
        },
        select: {
          id: true,
          stageId: true,
          startTime: true,
        },
      });

      if (staleTasks.length === 0) {
        this.logger.debug({ msg: 'No stale tasks found for cleanup', cutoffTime: cutoffTime.toISOString(), timePeriodChecked: formattedPeriod });
        return;
      }

      this.logger.info({
        msg: 'Found stale tasks for cleanup',
        count: staleTasks.length,
        cutoffTime: cutoffTime.toISOString(),
        timePeriodChecked: formattedPeriod,
      });

      // Update each stale task to FAILED status using the existing TaskManager API
      const updateResults = await this.updateStaleTasksStatus(staleTasks);

      this.logger.info({
        msg: 'Task cleanup completed successfully',
        updatedTasksCount: updateResults.successCount,
        failedTasksCount: updateResults.failureCount,
        timePeriodCleaned: formattedPeriod,
      });
    } catch (error) {
      this.logger.error({ msg: 'Failed to clean stale tasks', error });
      throw error;
    }
  }

  /**
   * Updates stale tasks to FAILED status using the TaskManager API
   * @param staleTasks - Array of stale task objects
   * @returns Object containing success and failure counts
   */
  private async updateStaleTasksStatus(staleTasks: Pick<Task, "id" | "stageId" | "startTime">[]): Promise<{
    successCount: number;
    failureCount: number;
  }> {
    let successCount = 0;
    let failureCount = 0;

    // Process tasks sequentially to avoid overwhelming the database
    for (const task of staleTasks) {
      try {
        await this.taskManager.updateStatus(task.id, TaskOperationStatus.FAILED);
        successCount++;

        this.logger.debug({
          msg: 'Successfully updated stale task status',
          taskId: task.id,
          stageId: task.stageId,
          originalStartTime: task.startTime?.toISOString(),
        });
      } catch (error) {
        failureCount++;

        this.logger.warn({
          msg: 'Failed to update stale task status',
          taskId: task.id,
          stageId: task.stageId,
          error: error,
        });
      }
    }

    return { successCount, failureCount };
  }
}
