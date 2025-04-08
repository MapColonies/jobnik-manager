import { Prisma } from '@prisma/client';
import type { components, operations } from '@src/openapi';

type JobModel = components['schemas']['jobResponse'];
type JobCreateModel = components['schemas']['createJobPayload'];
type JobCreateResponse = components['schemas']['createJobResponse'];
type JobGetParams = components['parameters'];
type JobFindCriteriaArg = operations['findJobs']['parameters']['query'];
// eslint-disable-next-line @typescript-eslint/naming-convention
type jobPrismaObject = Prisma.JobGetPayload<{ include: { Stage: boolean } }>;

export type { JobModel, JobCreateModel, JobCreateResponse, JobGetParams, JobFindCriteriaArg, jobPrismaObject };
