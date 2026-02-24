import { inject, Lifecycle, scoped } from 'tsyringe';
import { type Logger } from '@map-colonies/js-logger';
import { PrismaClient, Task } from '@prismaClient';
import { SERVICES } from '@src/common/constants';
import type { PrismaTransaction } from '@src/db/types';
import type { TaskPrismaObject } from '../models/models';

@scoped(Lifecycle.ContainerScoped)
export class TaskRepository {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient
  ) {}

  /**
   * Finds and locks the next available high-priority task for processing.
   * * Uses a row-level lock with `SKIP LOCKED` to allow multiple concurrent
   * workers to claim different tasks without blocking each other.
   * * @param stageType - The stage category to pull tasks from.
   * @param tx - The current database transaction.
   * @returns The locked task or null if no eligible tasks are found.
   */
  public async findAndLockTaskForDequeue(stageType: string, tx: PrismaTransaction): Promise<TaskPrismaObject | null> {
    this.logger.debug({ msg: 'Finding task for dequeue', stageType });

    const tasks = await tx.$queryRaw<Task[]>`
      SELECT t.*
      FROM "job_manager"."task" t
      INNER JOIN "job_manager"."stage" s ON t."stage_id" = s.id
      INNER JOIN "job_manager"."job" j ON s."job_id" = j.id
      WHERE s.type = ${stageType}
        AND t.status IN ('Pending', 'Retried')
        AND s.status IN ('Pending', 'In-Progress')
        AND j.status IN ('Pending', 'In-Progress')
      ORDER BY j.priority ASC
      LIMIT 1
      FOR UPDATE OF t SKIP LOCKED
    `;

    if (tasks.length === 0) {
      return null;
    }

    // Note: $queryRaw returns raw database values, not Prisma-mapped values
    // We need to re-fetch the task using Prisma to get properly mapped enum values
    const rawTask = tasks[0]!;
    const task = await tx.task.findUnique({
      where: { id: rawTask.id },
    });

    return task;
  }
}
