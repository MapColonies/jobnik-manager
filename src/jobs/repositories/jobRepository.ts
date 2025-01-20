/* eslint-disable @typescript-eslint/naming-convention */
import { Creator, JobMode, JobName, Priority } from '@prisma/client';

/**
 * Represent openAPI's optional query params
 */
export interface IJobCriteriaQueryParams {
  job_mode?: JobMode | undefined;
  job_name?: JobName | undefined;
  from_date?: string | undefined;
  till_date?: string | undefined;
  priority?: Priority | undefined;
  creator?: Creator | undefined;
}

export type JobFindCriteriaArg = IJobCriteriaQueryParams | undefined;
