import { TaskOperationStatus } from '@prismaClient';
import { convertArrayPrismaTaskToTaskResponse } from '@src/tasks/models/helper';
import { createCamelCaseMapper } from '@src/common/utils/formatter';
import { StageModel, StagePrismaObject, StageSummary } from './models';

const taskOperationStatusWithTotal = {
  ...TaskOperationStatus,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TOTAL: 'TOTAL',
} as const;
const summaryCountsMapper = createCamelCaseMapper(taskOperationStatusWithTotal);
// eslint-disable-next-line @typescript-eslint/naming-convention
type SummaryCountsMapper = typeof summaryCountsMapper & { TOTAL: 'total' };

const defaultStatusCounts = Object.fromEntries(Object.values(summaryCountsMapper).map((value) => [value, 0])) as Record<
  SummaryCountsMapper[keyof SummaryCountsMapper],
  0
>;

/**
 * This function converts a Prisma stage object to a StageModel API object.
 * @param prismaObjects db entity
 * @returns StageModel
 */
function convertPrismaToStageResponse(prismaObjects: StagePrismaObject): StageModel {
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
function convertArrayPrismaStageToStageResponse(prismaObjects: StagePrismaObject[]): StageModel[] {
  return prismaObjects.map((stage) => convertPrismaToStageResponse(stage));
}

/**
 * This method calculates the current percentage of completed tasks in a stage.
 * @param stageSummary summary of the stage
 * @returns percentage of completed tasks
 */
function getCurrentPercentage(stageSummary: StageSummary): number {
  const completed = stageSummary[summaryCountsMapper.COMPLETED];
  const total = stageSummary[summaryCountsMapper.TOTAL];

  // If total is 0, return 0 to avoid division by zero
  if (total === 0) {
    return 0;
  }

  const PERCENTAGE_MULTIPLIER = 100;
  return Math.floor((completed / total) * PERCENTAGE_MULTIPLIER);
}

export {
  getCurrentPercentage,
  convertArrayPrismaStageToStageResponse,
  convertPrismaToStageResponse,
  summaryCountsMapper,
  defaultStatusCounts,
  taskOperationStatusWithTotal,
};
