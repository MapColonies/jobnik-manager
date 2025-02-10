import type { components, operations } from '@src/openapi';

export type JobModel = components['schemas']['jobResponse'];
export type JobCreateModel = components['schemas']['createJobPayload'];
export type JobCreateResponse = components['schemas']['createJobResponse'];
export type JobGetParams = components['parameters'];
export type JobFindCriteriaArg = operations['findJobs']['parameters']['query'];
