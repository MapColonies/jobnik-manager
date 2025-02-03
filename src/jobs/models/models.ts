import { components, operations } from '@src/openapi';

export type IJobModel = components['schemas']['jobResponse'];
export type IJobCreateModel = components['schemas']['createJobPayload'];
export type IJobCreateResponse = components['schemas']['createJobResponse'];
export type IJobGetParams = components['parameters'];
export type JobFindCriteriaArg = operations['findJobs']['parameters']['query'];
