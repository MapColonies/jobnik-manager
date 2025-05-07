import { TaskOperationStatus, type PrismaClient } from '@prismaClient';
import { convertArrayPrismaTaskToTaskResponse } from '@src/tasks/models/helper';
import { StageModel, StagePrismaObject, StageSummary } from './models';

export const defaultStatusCounts = {
  [TaskOperationStatus.PENDING]: 0,
  [TaskOperationStatus.IN_PROGRESS]: 0,
  [TaskOperationStatus.COMPLETED]: 0,
  [TaskOperationStatus.FAILED]: 0,
  [TaskOperationStatus.ABORTED]: 0,
  [TaskOperationStatus.PAUSED]: 0,
  [TaskOperationStatus.CREATED]: 0,
  [TaskOperationStatus.RETRIED]: 0,
} as const;

/**
 * This function converts a Prisma stage object to a StageModel API object.
 * @param prismaObjects db entity
 * @returns StageModel
 */
export function convertPrismaToStageResponse(prismaObjects: StagePrismaObject): StageModel {
  const { data, userMetadata, task, xstate, name, ...rest } = prismaObjects;

  const transformedFields = {
    data: data as Record<string, unknown>,
    userMetadata: userMetadata as Record<string, unknown>,
    type: name,
    tasks: Array.isArray(task) ? convertArrayPrismaTaskToTaskResponse(task) : undefined,
  };
  return Object.assign(rest, transformedFields);
}

/**
 * This function converts an array of Prisma stage objects to an array of StageModel API objects.
 * @param prismaObjects array of db entities
 * @returns array of StageModel
 */
export function convertArrayPrismaStageToStageResponse(prismaObjects: StagePrismaObject[]): StageModel[] {
  return prismaObjects.map((stage) => convertPrismaToStageResponse(stage));
}

/**
 * This function aggregates task statuses for a given stage ID.
 * @param stageId The ID of the stage to aggregate task statuses for.
 * @param prisma The Prisma client instance.
 * @returns A promise that resolves to an object containing the aggregated task statuses.
 */
export async function aggregateTaskStatusesForStage(stageId: string, prisma: PrismaClient): Promise<StageSummary> {
  const taskCounts = await prisma.task.groupBy({
    by: ['status'],
    where: {
      stageId: stageId,
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _count: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _all: true,
    },
  });

  // Explicitly type the taskCounts array
  interface TaskCount {
    status: TaskOperationStatus;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _count: { _all: number };
  }

  const aggregatedCounts = taskCounts.reduce<StageSummary>(
    (acc, count: TaskCount) => {
      acc[count.status] = count._count._all;
      return acc;
    },
    { ...defaultStatusCounts }
  );

  return aggregatedCounts;
}

/**
 * This method calculates the current percentage of completed tasks in a stage.
 * @param stageSummary summary of the stage
 * @returns percentage of completed tasks
 */
export function getCurrentPercentage(stageSummary: StageSummary): number {
  const totalTasks = Object.values(stageSummary).reduce((sum: number, count: number) => sum + count, 0);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const completionPercentage = Math.round((stageSummary[TaskOperationStatus.COMPLETED] / totalTasks) * 100);

  return completionPercentage;
}
