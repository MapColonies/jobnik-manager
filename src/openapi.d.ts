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
    stagePayload: Record<string, never>;
    notifications: Record<string, never>;
    /**
     * @example LOW
     * @enum {string}
     */
    priority: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
    /** @enum {string} */
    creator: 'MAP_COLONIES' | 'UNKNOWN';
    /**
     * @example PENDING
     * @enum {string}
     */
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'WAITING_FOR_APPROVAL' | 'PAUSED' | 'WAITING';
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
    summary: Record<string, never>;
    createJobPayload: {
      type: components['schemas']['jobMode'];
      name?: components['schemas']['jobName'];
      data: components['schemas']['jobPayload'];
      status?: components['schemas']['status'];
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
      status?: components['schemas']['status'];
      jobId: components['schemas']['jobId'];
      userMetadata?: components['schemas']['userMetadata'];
    };
    stageResponse: components['schemas']['createStagePayload'] & {
      id: components['schemas']['stageId'];
      summary?: components['schemas']['summary'];
      percentage?: components['schemas']['percentage'];
    };
    /** Format: uuid */
    taskId: string;
    /**
     * @example Tile-Merging
     * @enum {string}
     */
    taskType: 'Tile-Merging' | 'Tile-Seeding' | 'Tile-Exporting';
    taskPayload: Record<string, never>;
    createTaskPayload: {
      type: components['schemas']['taskType'];
      data: components['schemas']['taskPayload'];
      status?: components['schemas']['status'];
      stageId: components['schemas']['stageId'];
    };
    taskResponse: {
      id: components['schemas']['taskId'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
      status: components['schemas']['status'];
      attempts?: components['schemas']['attempts'];
      priority?: components['schemas']['priority'];
    } & WithRequired<components['schemas']['createTaskPayload'], 'stageId' | 'status'>;
    createJobResponse: {
      id: components['schemas']['jobId'];
      data?: components['schemas']['jobPayload'];
      status?: components['schemas']['status'];
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
      /**
       * @example JOB_MODIFIED_SUCCESSFULLY
       * @enum {string}
       */
      code: 'JOB_MODIFIED_SUCCESSFULLY';
    };
    error: {
      message: string;
    };
  };
  responses: never;
  parameters: {
    /** @description ID of Job */
    jobId: components['schemas']['jobId'];
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
      /** @description Change priority of job */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
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
          status: components['schemas']['status'];
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
}
type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
