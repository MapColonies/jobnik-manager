import { Prisma } from '@prisma/client';
import type { components, operations } from '@src/openapi';
import type { CamelCase, ScreamingSnakeCase } from 'type-fest';

type SuccessMessages = components['schemas']['successMessages'];
type SuccessMessagesObj = {
  [key in CamelCase<SuccessMessages>]: ScreamingSnakeCase<key>;
};

const successMessages: SuccessMessagesObj = {
  jobModifiedSuccessfully: 'JOB_MODIFIED_SUCCESSFULLY',
  stageModifiedSuccessfully: 'STAGE_MODIFIED_SUCCESSFULLY',
  jobDeletedSuccessfully: 'JOB_DELETED_SUCCESSFULLY',
};

type JobModel = components['schemas']['jobResponse'];
type JobCreateModel = components['schemas']['createJobPayload'];
type JobCreateResponse = components['schemas']['createJobResponse'];
type JobGetParams = components['parameters'];
type JobFindCriteriaArg = operations['findJobs']['parameters']['query'];
// eslint-disable-next-line @typescript-eslint/naming-convention
type jobPrismaObject = Prisma.JobGetPayload<{ include: { Stage: boolean } }>;
export { JobModel, JobCreateModel, JobCreateResponse, JobGetParams, JobFindCriteriaArg, jobPrismaObject, successMessages };
