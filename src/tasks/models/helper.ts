import { Prisma } from '@prisma/client';
import { TaskModel } from './models';

/**
 * This function converts a Prisma stage object to a TaskModel API object.
 * @param prismaObjects db entity
 * @returns TaskModel
 */
export function convertPrismaToTaskResponse(prismaObjects: Prisma.TaskGetPayload<Record<string, unknown>>): TaskModel {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { data, stage_id, userMetadata, xstate, creationTime, updateTime, ...rest } = prismaObjects;

  const transformedFields = {
    data: data as Record<string, unknown>,
    userMetadata: userMetadata as { [key: string]: unknown },
    stageId: stage_id,
    updateTime: updateTime.toISOString(),
    creationTime: creationTime.toISOString(),
  };

  return Object.assign(rest, transformedFields);
}

/**
 * This function converts an array of Prisma task objects to an array of TaskModel API objects.
 * @param prismaObjects array of db entities
 * @returns array of TaskModel
 */
export function convertArrayPrismaTaskToStageResponse(prismaObjects: Prisma.TaskGetPayload<Record<string, unknown>>[]): TaskModel[] {
  return prismaObjects.map((task) => convertPrismaToTaskResponse(task));
}
