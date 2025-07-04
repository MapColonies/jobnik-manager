import { Prisma } from '@prismaClient';
import type { components, operations } from '@src/openapi';

type JobModel = components['schemas']['jobResponse'];
type JobCreateModel = components['schemas']['createJobPayload'];
type JobCreateResponse = components['schemas']['createJobResponse'];
type JobGetParams = components['parameters'];
type JobFindCriteriaArg = operations['findJobs']['parameters']['query'];
type JobPrismaObject = Prisma.JobGetPayload<{ include: { stage: boolean } }>;

export type { JobModel, JobCreateModel, JobCreateResponse, JobGetParams, JobFindCriteriaArg, JobPrismaObject };
