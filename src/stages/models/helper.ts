import { StageModel, StagePrismaObject } from './models';

/**
 * This function converts a Prisma stage object to a StageModel API object.
 * @param prismaObjects db entity
 * @returns StageModel
 */
export function convertPrismaToStageResponse(prismaObjects: StagePrismaObject): StageModel {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { data, job_id, userMetadata, summary, xstate, name, ...rest } = prismaObjects;

  const transformedFields = {
    data: data as Record<string, unknown>,
    userMetadata: userMetadata as Record<string, never>,
    summary: summary as Record<string, never>,
    type: name,
    jobId: job_id,
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
