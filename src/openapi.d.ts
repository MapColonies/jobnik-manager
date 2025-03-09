/* eslint-disable */
import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';
export type paths = {
  '/jobs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** find jobs by criteria */
    get: operations['findJobs'];
    put?: never;
    /** Creates a new job */
    post: operations['createJob'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/jobs/{jobId}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    /** Get job by id */
    get: operations['getJobById'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/jobs/{jobId}/user-metadata': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** update user metadata object */
    patch: operations['updateUserMetadata'];
    trace?: never;
  };
  '/jobs/{jobId}/priority': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** change priority */
    patch: operations['updateJobPriority'];
    trace?: never;
  };
  '/jobs/{jobId}/status': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    get?: never;
    /** change job's status */
    put: operations['updateStatus'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stages': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** find stages by criteria */
    get: operations['getStages'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stages/{stageId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** find stage by id */
    get: operations['getStageById'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stages/job/{jobId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** find stages by job id */
    get: operations['getStageByJobId'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stages/{stageId}/summary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get stages summary by id */
    get: operations['getStageSummary'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stages/{stageId}/user-metadata': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** update user metadata object */
    patch: operations['updateStageUserMetadata'];
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    /** Format: date-time */
    creationTime: string;
    /** Format: date-time */
    updateTime: string;
    /** Format: date-time */
    expirationTime: string | null;
    /** Format: date-time */
    ttl: string | null;
    /** Format: uuid */
    jobId: string;
    jobPayload: {
      [key: string]: unknown;
    };
    percentage: number;
    attempts: number;
    /** Format: uuid */
    stageId: string;
    stagePayload: {
      [key: string]: unknown;
    };
    notifications: Record<string, never>;
    /**
     * @example LOW
     * @enum {string}
     */
    priority: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
    /**
     * @example JOB_MODIFIED_SUCCESSFULLY
     * @enum {string}
     */
    successMessages: 'JOB_MODIFIED_SUCCESSFULLY' | 'STAGE_MODIFIED_SUCCESSFULLY';
    /** @enum {string} */
    creator: 'MAP_COLONIES' | 'UNKNOWN';
    /**
     * @example CREATED
     * @enum {string}
     */
    jobOperationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'PAUSED' | 'WAITING' | 'CREATED';
    /**
     * @example CREATED
     * @enum {string}
     */
    stageOperationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'PAUSED' | 'WAITING' | 'CREATED';
    /**
     * @example CREATED
     * @enum {string}
     */
    taskOperationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'PAUSED' | 'WAITING' | 'CREATED' | 'RETRIED';
    /**
     * @example PRE_DEFINED
     * @enum {string}
     */
    jobMode: 'PRE_DEFINED' | 'DYNAMIC';
    /**
     * @example DEFAULT
     * @enum {string}
     */
    jobName: 'INGESTION' | 'EXPORT' | 'DEFAULT';
    userMetadata: {
      [key: string]: unknown;
    };
    summary: {
      [key: string]: unknown;
    };
    createJobPayload: {
      type: components['schemas']['jobMode'];
      name?: components['schemas']['jobName'];
      data: components['schemas']['jobPayload'];
      priority?: components['schemas']['priority'];
      expirationTime?: components['schemas']['expirationTime'];
      ttl?: components['schemas']['ttl'];
      notifications: components['schemas']['notifications'];
      userMetadata: components['schemas']['userMetadata'];
      creator: components['schemas']['creator'];
    } & {
      [key: string]: unknown;
    };
    jobResponse: components['schemas']['createJobPayload'] & {
      id: components['schemas']['jobId'];
      percentage?: components['schemas']['percentage'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
    };
    createStagePayload: {
      type: components['schemas']['taskType'];
      data: components['schemas']['stagePayload'];
      jobId: components['schemas']['jobId'];
      userMetadata: components['schemas']['userMetadata'];
    };
    stageResponse: components['schemas']['createStagePayload'] & {
      id: components['schemas']['stageId'];
      summary?: components['schemas']['summary'];
      percentage?: components['schemas']['percentage'];
    };
    /** Format: uuid */
    taskId: string;
    /**
     * @example DEFAULT
     * @enum {string}
     */
    taskType: 'TILE_SEEDING' | 'TILE_RENDERING' | 'PUBLISH_CATALOG' | 'PUBLISH_LAYER' | 'DEFAULT';
    taskPayload: Record<string, never>;
    createTaskPayload: {
      type: components['schemas']['taskType'];
      data: components['schemas']['taskPayload'];
      stageId: components['schemas']['stageId'];
    };
    taskResponse: {
      id: components['schemas']['taskId'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
      status?: components['schemas']['taskOperationStatus'];
      attempts?: components['schemas']['attempts'];
      priority?: components['schemas']['priority'];
    } & WithRequired<components['schemas']['createTaskPayload'], 'stageId'>;
    createJobResponse: {
      id: components['schemas']['jobId'];
      data?: components['schemas']['jobPayload'];
      status?: components['schemas']['jobOperationStatus'];
      percentage?: components['schemas']['percentage'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
      expirationTime?: components['schemas']['expirationTime'];
      type?: components['schemas']['jobMode'];
      userMetadata?: components['schemas']['userMetadata'];
      priority?: components['schemas']['priority'];
      creator?: components['schemas']['creator'];
      ttl?: components['schemas']['ttl'];
      notifications?: components['schemas']['notifications'];
      name?: components['schemas']['jobName'];
    };
    errorMessage: {
      'message:'?: string;
      stacktrace?: string;
    };
    defaultOkMessage: {
      code: components['schemas']['successMessages'];
    };
    error: {
      message: string;
    };
  };
  responses: never;
  parameters: {
    /** @description ID of Job */
    jobId: components['schemas']['jobId'];
    /** @description ID of Stage */
    stageId: components['schemas']['stageId'];
    /** @description The mode of the job.
     *      */
    jmode: components['schemas']['jobMode'];
    /** @description The type name of the job.
     *      */
    jname: components['schemas']['jobName'];
    /** @description The type of the job.
     *      */
    priority: components['schemas']['priority'];
    /** @description Name of job creator
     *      */
    creator: components['schemas']['creator'];
    /** @description results start update date */
    fromDate: string;
    /** @description results end update date */
    tillDate: string;
    /** @description unique job identifier */
    jId: components['schemas']['jobId'];
    /** @description stage's type */
    sType: components['schemas']['taskType'];
    /** @description The status of the job.
     *      */
    stageStatus: components['schemas']['stageOperationStatus'];
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
  findJobs: {
    parameters: {
      query?: {
        /** @description The mode of the job.
         *      */
        job_mode?: components['parameters']['jmode'];
        /** @description The type name of the job.
         *      */
        job_name?: components['parameters']['jname'];
        /** @description results start update date */
        from_date?: components['parameters']['fromDate'];
        /** @description results end update date */
        till_date?: components['parameters']['tillDate'];
        /** @description The type of the job.
         *      */
        priority?: components['parameters']['priority'];
        /** @description Name of job creator
         *      */
        creator?: components['parameters']['creator'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Array of jobs */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['jobResponse'][];
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  createJob: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['createJobPayload'];
      };
    };
    responses: {
      /** @description Job created successfully */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['createJobResponse'];
        };
      };
      /** @description Invalid request, could not create job */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  getJobById: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Job data */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['jobResponse'];
        };
      };
      /** @description Invalid request, could not get job */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Job not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  updateUserMetadata: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['userMetadata'];
      };
    };
    responses: {
      /** @description modify user metadata object */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description Bad parameters input */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description No such stage on database */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  updateJobPriority: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          priority: components['schemas']['priority'];
        };
      };
    };
    responses: {
      /** @description The job priority was changed successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description The priority was not changed, likely because the priority requested is equal to the current one. */
      204: {
        headers: {
          /** @description Won't change priority if equal to current */
          Reason?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Bad request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Job not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  updateStatus: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          status: components['schemas']['jobOperationStatus'];
        };
      };
    };
    responses: {
      /** @description Change job and related stages + tasks */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description Bad parameters input */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Job not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  getStages: {
    parameters: {
      query?: {
        /** @description unique job identifier */
        job_id?: components['parameters']['jId'];
        /** @description stage's type */
        stage_type?: components['parameters']['sType'];
        /** @description The status of the job.
         *      */
        stage_operation_status?: components['parameters']['stageStatus'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Array of jobs */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['stageResponse'][];
        };
      };
      /** @description Bad parameters input */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description No such stage on database */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  getStageById: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Return specific stage by its id */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['stageResponse'];
        };
      };
      /** @description Bad parameters input */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description No such stage on database */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  getStageByJobId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Return stage array releated to job id */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['stageResponse'][];
        };
      };
      /** @description Bad parameters input */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description No such stage in the database */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  getStageSummary: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Return summary of stage by its id */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['summary'];
        };
      };
      /** @description Bad parameters input */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description No such stage on database */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
  updateStageUserMetadata: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['userMetadata'];
      };
    };
    responses: {
      /** @description modify user metadata object */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description Bad parameters input */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description No such stage on database */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
    };
  };
}
type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
