import { convertArrayPrismaTaskToTaskResponse } from '@src/tasks/models/helper';
import { StageModel, StagePrismaObject } from './models';

/**
 * This function converts a Prisma stage object to a StageModel API object.
 * @param prismaObjects db entity
 * @returns StageModel
 */
export function convertPrismaToStageResponse(prismaObjects: StagePrismaObject): StageModel {
  const { data, userMetadata, summary, task, xstate, name, ...rest } = prismaObjects;

  const transformedFields = {
    data: data as Record<string, unknown>,
    userMetadata: userMetadata as Record<string, unknown>,
    summary: summary as Record<string, unknown>,
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
