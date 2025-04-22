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
    /** Delete job by id (cascades with stages) */
    delete: operations['deleteJob'];
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
  '/jobs/{jobId}/stages': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
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
  '/jobs/{jobId}/stage': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Add single stages to the end of a dynamic job's existing stages with optional tasks array */
    post: operations['addStage'];
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
      path: {
        /** @description ID of Stage */
        stageId: components['parameters']['stageId'];
      };
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
  '/stages/{stageId}/summary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get stages summary by stage id
     * @description Offers an aggregated object that summarizes the progress of related tasks
     */
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
  '/stages/{stageId}/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** change stage's status */
    put: operations['updateStageStatus'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stages/{stageId}/tasks': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of Stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    /** Get task by stage ID */
    get: operations['getTasksByStageId'];
    put?: never;
    /** Adds tasks to the end of a  existing stage */
    post: operations['addTasks'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/tasks': {
    parameters: {
      query?: {
        /** @description unique stage identifier */
        stage_id?: components['parameters']['paramStageId'];
        /** @description task's type */
        task_type?: components['parameters']['paramTaskType'];
        /** @description results start update date */
        from_date?: components['parameters']['fromDate'];
        /** @description results end update date */
        till_date?: components['parameters']['tillDate'];
        /** @description The status of the job.
         *      */
        status?: components['parameters']['paramsTaskStatus'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get task by criteria */
    get: operations['getTasksByCriteria'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/tasks/{taskId}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of requested task */
        taskId: components['parameters']['taskId'];
      };
      cookie?: never;
    };
    /** Get task by ID */
    get: operations['getTaskById'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/tasks/{taskId}/user-metadata': {
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
    patch: operations['updateTaskUserMetadata'];
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
    successMessages: 'JOB_MODIFIED_SUCCESSFULLY' | 'TASK_MODIFIED_SUCCESSFULLY' | 'STAGE_MODIFIED_SUCCESSFULLY' | 'JOB_DELETED_SUCCESSFULLY';
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
    returnStage: boolean;
    returnTask: boolean;
    userMetadata: {
      [key: string]: unknown;
    };
    summary: {
      [key: string]: unknown;
    };
    createJobPayload: {
      jobMode: components['schemas']['jobMode'];
      name?: components['schemas']['jobName'];
      data: components['schemas']['jobPayload'];
      priority?: components['schemas']['priority'];
      expirationTime?: components['schemas']['expirationTime'];
      ttl?: components['schemas']['ttl'];
      notifications: components['schemas']['notifications'];
      userMetadata: components['schemas']['userMetadata'];
      creator: components['schemas']['creator'];
      stages?: components['schemas']['createStagePayload'][];
    } & {
      [key: string]: unknown;
    };
    jobResponse: components['schemas']['createJobPayload'] & {
      id: components['schemas']['jobId'];
      status?: components['schemas']['jobOperationStatus'];
      percentage?: components['schemas']['percentage'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
      stages?: components['schemas']['stageResponse'][];
    };
    createStagePayload: {
      type: components['schemas']['taskType'];
      data: components['schemas']['stagePayload'];
      userMetadata: components['schemas']['userMetadata'];
    };
    stageResponse: components['schemas']['createStagePayload'] & {
      id: components['schemas']['stageId'];
      summary: components['schemas']['summary'];
      percentage?: components['schemas']['percentage'];
      status?: components['schemas']['stageOperationStatus'];
      jobId: components['schemas']['jobId'];
    };
    getStageResponse: components['schemas']['stageResponse'] & {
      tasks?: components['schemas']['taskResponse'][];
    };
    /** Format: uuid */
    taskId: string;
    /**
     * @example DEFAULT
     * @enum {string}
     */
    taskType: 'TILE_SEEDING' | 'TILE_RENDERING' | 'PUBLISH_CATALOG' | 'PUBLISH_LAYER' | 'DEFAULT';
    taskPayload: {
      [key: string]: unknown;
    };
    createStageWithTasksPayload: components['schemas']['createStagePayload'] & {
      tasks?: components['schemas']['createTaskPayload'][];
    };
    createTaskPayload: {
      type: components['schemas']['taskType'];
      data: components['schemas']['taskPayload'];
      userMetadata?: components['schemas']['userMetadata'];
    };
    taskResponse: {
      id: components['schemas']['taskId'];
      type: components['schemas']['taskType'];
      data: components['schemas']['taskPayload'];
      stageId: components['schemas']['stageId'];
      userMetadata?: components['schemas']['userMetadata'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
      status: components['schemas']['taskOperationStatus'];
      attempts?: components['schemas']['attempts'];
    };
    createJobResponse: {
      id: components['schemas']['jobId'];
      data?: components['schemas']['jobPayload'];
      status?: components['schemas']['jobOperationStatus'];
      percentage?: components['schemas']['percentage'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
      expirationTime?: components['schemas']['expirationTime'];
      jobMode?: components['schemas']['jobMode'];
      userMetadata?: components['schemas']['userMetadata'];
      priority?: components['schemas']['priority'];
      creator?: components['schemas']['creator'];
      ttl?: components['schemas']['ttl'];
      notifications?: components['schemas']['notifications'];
      name?: components['schemas']['jobName'];
      stages?: components['schemas']['stageResponse'][];
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
    /** @description ID of requested task */
    taskId: string;
    /** @description The status of the job.
     *      */
    paramsTaskStatus: components['schemas']['taskOperationStatus'];
    /** @description The mode of the job.
     *      */
    jobModeQueryParam: components['schemas']['jobMode'];
    /** @description The type name of the job.
     *      */
    jobNameQueryParam: components['schemas']['jobName'];
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
    /** @description indicated if response body should contain also stages array */
    includeStages: components['schemas']['returnStage'];
    /** @description indicated if response body should contain also tasks array */
    includeTasks: components['schemas']['returnTask'];
    /** @description unique stage identifier */
    paramStageId: components['schemas']['stageId'];
    /** @description unique job identifier */
    paramJobId: components['schemas']['jobId'];
    /** @description stage's type */
    paramStageType: components['schemas']['taskType'];
    /** @description The status of the stage.
     *      */
    stageStatus: components['schemas']['stageOperationStatus'];
    /** @description task's type */
    paramTaskType: components['schemas']['taskType'];
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
        job_mode?: components['parameters']['jobModeQueryParam'];
        /** @description The type name of the job.
         *      */
        job_name?: components['parameters']['jobNameQueryParam'];
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
        /** @description indicated if response body should contain also stages array */
        should_return_stages?: components['parameters']['includeStages'];
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
      query?: {
        /** @description indicated if response body should contain also stages array */
        should_return_stages?: components['parameters']['includeStages'];
      };
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
  deleteJob: {
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
      /** @description Job deleted successfully */
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
  getStageByJobId: {
    parameters: {
      query?: {
        /** @description indicated if response body should contain also tasks array */
        should_return_tasks?: components['parameters']['includeTasks'];
      };
      header?: never;
      path: {
        /** @description ID of Job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Return stage array related to job id */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['getStageResponse'][];
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
      /** @description No such job in the database */
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
  addStage: {
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
        'application/json': components['schemas']['createStageWithTasksPayload'];
      };
    };
    responses: {
      /** @description Returns the newly created stage associated with the job ID. */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['stageResponse'];
        };
      };
      /** @description Invalid request, could not create stage */
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
  getStages: {
    parameters: {
      query?: {
        /** @description unique job identifier */
        job_id?: components['parameters']['paramJobId'];
        /** @description stage's type */
        stage_type?: components['parameters']['paramStageType'];
        /** @description The status of the stage.
         *      */
        stage_operation_status?: components['parameters']['stageStatus'];
        /** @description indicated if response body should contain also tasks array */
        should_return_tasks?: components['parameters']['includeTasks'];
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
          'application/json': components['schemas']['getStageResponse'][];
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
      query?: {
        /** @description indicated if response body should contain also tasks array */
        should_return_tasks?: components['parameters']['includeTasks'];
      };
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
          'application/json': components['schemas']['getStageResponse'];
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
  updateStageStatus: {
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
        'application/json': {
          status: components['schemas']['stageOperationStatus'];
        };
      };
    };
    responses: {
      /** @description Stage and tasks will move to wait status */
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
  getTasksByStageId: {
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
      /** @description Requested tasks array by provided stage identifier */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'][];
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
      /** @description No such task in the database */
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
  addTasks: {
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
        'application/json': components['schemas']['createTaskPayload'][];
      };
    };
    responses: {
      /** @description Returns the newly created tasks associated with the stage ID. */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'][];
        };
      };
      /** @description Invalid request, could not create task */
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
  getTasksByCriteria: {
    parameters: {
      query?: {
        /** @description unique stage identifier */
        stage_id?: components['parameters']['paramStageId'];
        /** @description task's type */
        task_type?: components['parameters']['paramTaskType'];
        /** @description results start update date */
        from_date?: components['parameters']['fromDate'];
        /** @description results end update date */
        till_date?: components['parameters']['tillDate'];
        /** @description The status of the job.
         *      */
        status?: components['parameters']['paramsTaskStatus'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Requested tasks array by provided query params */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'][];
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
      /** @description No such task in the database */
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
  getTaskById: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of requested task */
        taskId: components['parameters']['taskId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Requested task object by identifier */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'];
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
      /** @description No such task in the database */
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
  updateTaskUserMetadata: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of requested task */
        taskId: components['parameters']['taskId'];
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
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
