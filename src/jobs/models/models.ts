import { Prisma } from '@prismaClient';
import type { components, operations } from '@src/openapi';
import { StagePrismaObject } from '@src/stages/models/models';

type JobModel = components['schemas']['jobResponse'];
type JobCreateModel = components['schemas']['createJobPayload'];
type JobCreateResponse = components['schemas']['createJobResponse'];
type JobGetParams = components['parameters'];
type JobFindCriteriaArg = operations['findJobs']['parameters']['query'];

type JobPrismaObject = Prisma.JobGetPayload<{ include: { stage: true } }> | Prisma.JobGetPayload<{ include: { stage: false } }>;

type JobPrismaObjectWithStages = JobPrismaObject & { stage?: StagePrismaObject[] };

export type { JobModel, JobCreateModel, JobCreateResponse, JobGetParams, JobFindCriteriaArg, JobPrismaObject, JobPrismaObjectWithStages };
