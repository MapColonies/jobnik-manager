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
  '/anotherResource': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** gets the resource */
    get: operations['getAnotherResource'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/resourceName': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** gets the resource */
    get: operations['getResourceName'];
    put?: never;
    /** creates a new record of type resource */
    post: operations['createResource'];
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
    expirationTime: string;
    /** Format: date-time */
    TTL: string;
    /** Format: uuid */
    jobId: string;
    jobPayload: Record<string, never>;
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
    userMetadata: Record<string, never>;
    summary: Record<string, never>;
    createJobPayload: {
      type: components['schemas']['jobMode'];
      name?: components['schemas']['jobName'];
      data: components['schemas']['jobPayload'];
      status?: components['schemas']['status'];
      priority?: components['schemas']['priority'];
      expirationTime?: components['schemas']['expirationTime'];
      TTL?: components['schemas']['TTL'];
      notifications?: components['schemas']['notifications'];
      userMetadata?: components['schemas']['userMetadata'];
      creator: components['schemas']['creator'];
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
    taskType: 'Tile-Merging' | 'Tile-Seeding' | 'Tile-Exporing';
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
      taskIds?: components['schemas']['taskId'][];
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
      code:
        | 'JOB_MODIFIED_SUCCESSFULLY'
        | 'TTL_MODIFIED_SUCCESSFULLY'
        | 'JOB_RESTARTED_SUCCESSFULLY'
        | 'STAGE_MODIFIED_SUCCESSFULLY'
        | 'STATUS_MODIFIED_SUCCESSFULLY'
        | 'USER_METADATA_MODIFIED_SUCCESSFULLY'
        | 'TASKS_ADDED_SUCCESSFULLY'
        | 'TASK_FAILED_SUCCESSFULLY'
        | 'TASK_COMPLETED_SUCCESSFULLY';
    };
    error: {
      message: string;
    };
    resource: {
      /** Format: int64 */
      id: number;
      name: string;
      description: string;
    };
    anotherResource: {
      kind: string;
      isAlive: boolean;
    };
  };
  responses: never;
  parameters: {
    /** @description ID of Job */
    jobId: components['schemas']['jobId'];
    /** @description ID of Stage */
    stageId: components['schemas']['stageId'];
    /** @description ID of requested task */
    taskId: string;
    /** @description ID of requested task */
    taskType: components['schemas']['taskType'];
    /** @description The status of the job.
     *      */
    status: components['schemas']['status'];
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
    /** @description unique stage identifier */
    sId: components['schemas']['stageId'];
    /** @description unique job identifier */
    jId: components['schemas']['jobId'];
    /** @description stage's type */
    sType: components['schemas']['taskType'];
    /** @description task's type */
    tType: components['schemas']['taskType'];
    /** @description the type of the job */
    jobName: components['schemas']['jobName'];
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
    };
  };
  getAnotherResource: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['anotherResource'];
        };
      };
    };
  };
  getResourceName: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['resource'];
        };
      };
    };
  };
  createResource: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['resource'];
      };
    };
    responses: {
      /** @description created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['resource'];
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
    };
  };
}
type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
