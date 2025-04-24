import { Prisma } from '@prismaClient';
import { TaskModel } from './models';

/**
 * This function converts a Prisma stage object to a TaskModel API object.
 * @param prismaObjects db entity
 * @returns TaskModel
 */
export function convertPrismaToTaskResponse(prismaObjects: Prisma.TaskGetPayload<Record<string, unknown>>): TaskModel {
  const { data, userMetadata, xstate, creationTime, updateTime, ...rest } = prismaObjects;

  const transformedFields = {
    data: data as Record<string, unknown>,
    userMetadata: userMetadata as { [key: string]: unknown },
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
export function convertArrayPrismaTaskToTaskResponse(prismaObjects: Prisma.TaskGetPayload<Record<string, unknown>>[]): TaskModel[] {
  return prismaObjects.map((task) => convertPrismaToTaskResponse(task));
}
