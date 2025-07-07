import { Prisma } from '@prismaClient';
import type { components, operations } from '@src/openapi';

type JobModel = components['schemas']['jobResponse'];
type JobCreateModel = components['schemas']['createJobPayload'];
type JobCreateResponse = components['schemas']['createJobResponse'];
type JobGetParams = components['parameters'];
type JobFindCriteriaArg = operations['findJobs']['parameters']['query'];

/**
 * Generic type for Job Prisma objects with configurable stage inclusion
 * @template IncludeStages - Whether to include stages in the result
 */
type JobPrismaObject<IncludeStages extends boolean = boolean> = Prisma.JobGetPayload<{
  include: { stage: IncludeStages };
}>;

export type { JobModel, JobCreateModel, JobCreateResponse, JobGetParams, JobFindCriteriaArg, JobPrismaObject };
