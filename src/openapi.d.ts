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
    /**
     * Retrieve jobs matching specified criteria
     * @description Returns a filtered list of jobs based on the provided query parameters.
     *     Supports filtering by job mode, name, date range, priority, and creator.
     *     Optional inclusion of related stage data via the should_return_stages parameter.
     *
     */
    get: operations['findJobs'];
    put?: never;
    /**
     * Create a new job with optional stages
     * @description Creates a new job in the system with user-defined configuration.
     *     Supports both pre-defined and dynamic job modes, with customizable priorities,
     *     expiration settings, and notification hooks.
     *
     *     Pre-defined jobs require all stages to be defined at creation time, while
     *     dynamic jobs allow stages to be added later via the /jobs/{jobId}/stage endpoint.
     *
     *     The job will be created with an initial default status of PENDING and can be tracked
     *     throughout its lifecycle using the returned job ID.
     *
     */
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
        /** @description Unique identifier for the job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    /**
     * Retrieve a specific job by its ID
     * @description Fetches detailed information about a job using its unique identifier.
     *     Includes job configuration, status, metadata, and completion percentage.
     *
     *     Optional inclusion of related stage data via the should_return_stages parameter,
     *     which allows clients to retrieve the complete job hierarchy in a single request.
     *
     */
    get: operations['getJobById'];
    put?: never;
    post?: never;
    /**
     * Delete a job and all its associated resources (stages, tasks)
     * @description Permanently removes a job and all its associated stages and tasks from the system.
     *     This operation cascades to delete all child resources and cannot be undone.
     *
     *     The job must exist in the system for this operation to succeed.
     *     Returns a success message with code JOB_DELETED_SUCCESSFULLY when completed.
     *
     */
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
    /**
     * Update job's custom metadata
     * @description Updates the user-defined metadata object for a specific job.
     *     This endpoint allows clients to attach or modify arbitrary data related to a job
     *     without affecting the job's core properties or execution status.
     *
     *     User metadata is useful for storing application-specific context, tracking information,
     *     or any custom data needed by client applications.
     *
     */
    patch: operations['updateUserMetadata'];
    trace?: never;
  };
  '/jobs/{jobId}/priority': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Unique identifier for the job */
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
    /**
     * Modify job's priority level
     * @description Updates the priority level for a specific job.
     *     This affects how the job is scheduled relative to other jobs in the system.
     *
     *     Higher priority jobs will be processed before lower priority ones when resources
     *     are constrained. Priority changes take effect immediately and apply to all
     *     pending tasks associated with the job.
     *
     */
    patch: operations['updateJobPriority'];
    trace?: never;
  };
  '/jobs/{jobId}/status': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Unique identifier for the job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    get?: never;
    /**
     * Change job's operational status
     * @description Updates the operational status of a job, which may cascade changes to all
     *     related stages and tasks. This endpoint can be used to pause, resume, abort,
     *     or otherwise control the execution flow of a job.
     *
     *     Status changes follow a state machine that enforces valid transitions, preventing
     *     operations like resuming a completed job or completing a failed job without
     *     proper remediation.
     *
     *     When a job's status is changed, the system will automatically update timestamps
     *     and completion percentages as appropriate.
     *
     */
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
        /** @description Unique identifier for the job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    /**
     * Retrieve all stages for a specific job
     * @description Fetches all stages associated with the specified job ID.
     *     Provides complete information about each stage including type, status, and progress.
     *
     *     Optional inclusion of related task data via the should_return_tasks parameter,
     *     allowing clients to retrieve the complete job hierarchy in a single request.
     *
     */
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
    /**
     * AAdd a new stage to a dynamic job
     * @description Appends a new stage to an existing job that has DYNAMIC job mode.
     *     The stage will be added after any existing stages in the job's workflow sequence.
     *
     *     This endpoint allows for extending job workflows at runtime by adding new processing steps.
     *     Optionally, tasks can be defined within the new stage during creation.
     *
     *     The job must exist and be in a valid state to accept new stages.
     *     Only jobs with DYNAMIC mode can have stages added after creation.
     *
     */
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
    /**
     * Retrieve stages matching specified criteria
     * @description Returns a filtered list of stages based on the provided query parameters.
     *     Supports filtering by job ID, stage type, and status.
     *
     *     Optional inclusion of related task data via the should_return_tasks parameter
     *     allows clients to retrieve the complete stage hierarchy in a single request.
     *
     */
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
        /** @description Unique identifier for the stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    /**
     * Retrieve a specific stage by its ID
     * @description Fetches detailed information about a stage using its unique identifier.
     *     Includes stage configuration, status, metadata, and completion information.
     *
     *     Optional inclusion of related task data via the should_return_tasks parameter,
     *     which allows clients to retrieve the complete stage hierarchy in a single request.
     *
     */
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
     * Get stage progress summary
     * @description Retrieves aggregated statistics about the tasks within a specific stage.
     *     Provides counts of tasks by status (pending, in progress, completed, etc.)
     *     and a total task count for monitoring stage progress.
     *
     *     This endpoint is useful for displaying progress indicators or status dashboards
     *     without needing to retrieve and process all individual task details.
     *
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
    /**
     * Update stage's custom metadata
     * @description Updates the user-defined metadata object for a specific stage.
     *     This endpoint allows clients to attach or modify arbitrary data related to a stage
     *     without affecting the stage's core properties or execution status.
     *
     *     User metadata is useful for storing application-specific context, tracking information,
     *     or any custom data needed by client applications.
     *
     */
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
    /**
     * Change stage's operational status
     * @description Updates the operational status of a stage, which may cascade changes to all
     *     related tasks. This endpoint can be used to pause, resume, abort, or otherwise
     *     control the execution flow of a stage.
     *
     *     Status changes follow a state machine that enforces valid transitions, preventing
     *     operations like resuming a completed stage or completing a failed stage without
     *     proper remediation.
     *
     *     Changes to a stage's status may affect the parent job's status if certain
     *     conditions are met.
     *
     */
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
        /** @description Unique identifier for the stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    /**
     * Retrieve all tasks for a specific stage
     * @description Fetches all tasks associated with the specified stage ID.
     *     Provides complete information about each task including type, status, and attempt count.
     *
     */
    get: operations['getTasksByStageId'];
    put?: never;
    /**
     * Add new tasks to an existing stage
     * @description Creates and appends new tasks to an existing stage.
     *     This endpoint allows for extending stage processing capabilities by adding more work units.
     *
     *     Task objects require type and data properties, with optional user metadata and
     *     maximum attempt configuration. Tasks are created with an initial status of PENDING.
     *
     *     The stage must exist and be in a valid state to accept new tasks.
     *
     */
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
        /** @description Filter results by stage identifier */
        stage_id?: components['parameters']['paramStageId'];
        /** @description Filter results by task type.
         *     Used to find tasks designed for specific operations (e.g., TILE_RENDERING).
         *      */
        task_type?: components['parameters']['paramTaskType'];
        /** @description Filter results by update time, starting from this date/time */
        from_date?: components['parameters']['fromDate'];
        /** @description Filter results by update time, ending at this date/time */
        till_date?: components['parameters']['tillDate'];
        /** @description Filter tasks by their operational status */
        status?: components['parameters']['paramsTaskStatus'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Retrieve tasks matching specified criteria
     * @description Returns a filtered list of tasks based on the provided query parameters.
     *     Supports filtering by stage ID, task type, date range, and operational status.
     *
     *     This endpoint is useful for monitoring task progress across multiple stages and jobs,
     *     enabling clients to build custom dashboards or track specific task types.
     *
     */
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
        /** @description Unique identifier for the task */
        taskId: components['parameters']['taskId'];
      };
      cookie?: never;
    };
    /**
     * Retrieve a specific task by its ID
     * @description Fetches detailed information about a task using its unique identifier.
     *     Returns complete task data including type, status, payload, and attempt information.
     *
     */
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
    /**
     * Update task's custom metadata
     * @description Updates the user-defined metadata object for a specific task.
     *     This endpoint allows clients to attach or modify arbitrary data related to a task
     *     without affecting the task's core properties or execution status.
     *
     *     User metadata is useful for storing application-specific context, tracking information,
     *     or any custom data needed by client applications.
     *
     */
    patch: operations['updateTaskUserMetadata'];
    trace?: never;
  };
  '/tasks/{taskId}/status': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Unique identifier for the task */
        taskId: components['parameters']['taskId'];
      };
      cookie?: never;
    };
    get?: never;
    /**
     * Change task's operational status
     * @description Updates the operational status of a task, which may trigger cascading updates
     *     to the parent stage and job. This endpoint can be used to mark tasks as complete,
     *     failed, aborted, or otherwise control the execution flow.
     *
     *     Status changes follow a state machine that enforces valid transitions, preventing
     *     operations like completing a paused task without proper resumption.
     *
     *     When a task's status is changed, the system will automatically update the parent stage's
     *     summary statistics and may affect the stage's overall status.
     *
     */
    put: operations['updateTaskStatus'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/tasks/{taskType}/dequeue': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Type of the requested task */
        taskType: components['parameters']['taskType'];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Find and claim the highest priority pending task of specified type
     * @description Retrieves the highest priority task of the specified type that is in PENDING or RETRIED status,
     *     and automatically updates its status to IN_PROGRESS. This endpoint implements a priority-based
     *     work queue pattern where workers can claim the next available task.
     *
     *     The endpoint considers task priority (inherited from the parent job), searches only for tasks
     *     that are in valid states (PENDING or RETRIED), and updates related stage and job status if needed.
     *
     *     If successful, returns the complete task details with status updated to IN_PROGRESS.
     *
     */
    patch: operations['dequeueTask'];
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    /**
     * Format: date-time
     * @description Timestamp indicating when the resource was created
     */
    creationTime: string;
    /**
     * Format: date-time
     * @description Timestamp indicating when the resource was last updated
     */
    updateTime: string;
    /**
     * Format: date-time
     * @description Optional timestamp indicating when the job will expire if not completed
     */
    expirationTime: string | null;
    /**
     * Format: date-time
     * @description Optional timestamp indicating when the job will be automatically deleted
     */
    ttl: string | null;
    /**
     * Format: uuid
     * @description Unique identifier for a job
     */
    jobId: string;
    jobPayload: {
      [key: string]: unknown;
    };
    percentage: number;
    attempts: number;
    maxAttempts: number;
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
    taskOperationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'PAUSED' | 'CREATED' | 'RETRIED';
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
      pending: number;
      inProgress: number;
      completed: number;
      failed: number;
      aborted: number;
      paused: number;
      created: number;
      retried: number;
      total: number;
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
      maxAttempts?: components['schemas']['maxAttempts'];
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
      attempts: components['schemas']['attempts'];
      maxAttempts: components['schemas']['maxAttempts'];
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
      message: string;
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
    /** @description Unique identifier for the job */
    jobId: components['schemas']['jobId'];
    /** @description Unique identifier for the stage */
    stageId: components['schemas']['stageId'];
    /** @description Unique identifier for the task */
    taskId: string;
    /** @description Type of the requested task */
    taskType: components['schemas']['taskType'];
    /** @description Filter tasks by their operational status */
    paramsTaskStatus: components['schemas']['taskOperationStatus'];
    /** @description Filter jobs by their mode (PRE_DEFINED or DYNAMIC) */
    jobModeQueryParam: components['schemas']['jobMode'];
    /** @description Filter jobs by their name/type */
    jobNameQueryParam: components['schemas']['jobName'];
    /** @description Filter jobs by their priority level */
    priority: components['schemas']['priority'];
    /** @description Filter jobs by their creator */
    creator: components['schemas']['creator'];
    /** @description Filter results by update time, starting from this date/time */
    fromDate: string;
    /** @description Filter results by update time, ending at this date/time */
    tillDate: string;
    /** @description When true, includes stage data in the response */
    includeStages: components['schemas']['returnStage'];
    /** @description When true, includes task data in the response */
    includeTasks: components['schemas']['returnTask'];
    /** @description Filter results by stage identifier */
    paramStageId: components['schemas']['stageId'];
    /** @description Filter results by job identifier */
    paramJobId: components['schemas']['jobId'];
    /** @description Filter results by stage identifier */
    paramStageType: components['schemas']['taskType'];
    /** @description Filter results by stage operational status (e.g., PENDING, IN_PROGRESS).
     *     Used to find stages in specific execution states.
     *      */
    stageStatus: components['schemas']['stageOperationStatus'];
    /** @description Filter results by task type.
     *     Used to find tasks designed for specific operations (e.g., TILE_RENDERING).
     *      */
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
        /** @description Filter jobs by their mode (PRE_DEFINED or DYNAMIC) */
        job_mode?: components['parameters']['jobModeQueryParam'];
        /** @description Filter jobs by their name/type */
        job_name?: components['parameters']['jobNameQueryParam'];
        /** @description Filter results by update time, starting from this date/time */
        from_date?: components['parameters']['fromDate'];
        /** @description Filter results by update time, ending at this date/time */
        till_date?: components['parameters']['tillDate'];
        /** @description Filter jobs by their priority level */
        priority?: components['parameters']['priority'];
        /** @description Filter jobs by their creator */
        creator?: components['parameters']['creator'];
        /** @description When true, includes stage data in the response */
        should_return_stages?: components['parameters']['includeStages'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successfully retrieved matching jobs */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['jobResponse'][];
        };
      };
      /** @description Invalid query parameters */
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
        /** @description When true, includes stage data in the response */
        should_return_stages?: components['parameters']['includeStages'];
      };
      header?: never;
      path: {
        /** @description Unique identifier for the job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Job data retrieved successfully */
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
        /** @description Unique identifier for the job */
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
        /** @description Unique identifier for the job */
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
      /** @description User metadata successfully updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description Invalid metadata format or validation error */
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
  updateJobPriority: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Unique identifier for the job */
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
      /** @description Job priority successfully changed */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description No change made - requested priority equals current priority */
      204: {
        headers: {
          /** @description Won't change priority if equal to current */
          Reason?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid priority value or other request error */
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
        /** @description Unique identifier for the job */
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
      /** @description Job status successfully changed */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description Invalid status or illegal state transition */
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
        /** @description When true, includes task data in the response */
        should_return_tasks?: components['parameters']['includeTasks'];
      };
      header?: never;
      path: {
        /** @description Unique identifier for the job */
        jobId: components['parameters']['jobId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successfully retrieved stages for the specified job */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['getStageResponse'][];
        };
      };
      /** @description Invalid job ID format or other parameter error */
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
  addStage: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Unique identifier for the job */
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
      /** @description Stage successfully created and added to the job */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['stageResponse'];
        };
      };
      /** @description Invalid request format or job not in DYNAMIC mode */
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
        /** @description Filter results by job identifier */
        job_id?: components['parameters']['paramJobId'];
        /** @description Filter results by stage identifier */
        stage_type?: components['parameters']['paramStageType'];
        /** @description Filter results by stage operational status (e.g., PENDING, IN_PROGRESS).
         *     Used to find stages in specific execution states.
         *      */
        stage_operation_status?: components['parameters']['stageStatus'];
        /** @description When true, includes task data in the response */
        should_return_tasks?: components['parameters']['includeTasks'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successfully retrieved matching stages */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['getStageResponse'][];
        };
      };
      /** @description Invalid query parameters */
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
        /** @description When true, includes task data in the response */
        should_return_tasks?: components['parameters']['includeTasks'];
      };
      header?: never;
      path: {
        /** @description Unique identifier for the stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Stage data retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['getStageResponse'];
        };
      };
      /** @description Invalid request format or parameters */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Stage not found */
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
        /** @description Unique identifier for the stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Stage summary retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['summary'];
        };
      };
      /** @description Invalid stage ID format */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Stage not found */
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
        /** @description Unique identifier for the stage */
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
      /** @description User metadata successfully updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description Invalid metadata format or validation error */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Stage not found */
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
        /** @description Unique identifier for the stage */
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
      /** @description Stage status successfully changed */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description Invalid status or illegal state transition */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Stage not found */
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
        /** @description Unique identifier for the stage */
        stageId: components['parameters']['stageId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successfully retrieved tasks for the specified stage */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'][];
        };
      };
      /** @description Invalid stage ID format or other parameter error */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Stage not found */
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
        /** @description Unique identifier for the stage */
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
      /** @description Tasks successfully created and added to the stage */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'][];
        };
      };
      /** @description Invalid request format or validation error */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Stage not found */
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
        /** @description Filter results by stage identifier */
        stage_id?: components['parameters']['paramStageId'];
        /** @description Filter results by task type.
         *     Used to find tasks designed for specific operations (e.g., TILE_RENDERING).
         *      */
        task_type?: components['parameters']['paramTaskType'];
        /** @description Filter results by update time, starting from this date/time */
        from_date?: components['parameters']['fromDate'];
        /** @description Filter results by update time, ending at this date/time */
        till_date?: components['parameters']['tillDate'];
        /** @description Filter tasks by their operational status */
        status?: components['parameters']['paramsTaskStatus'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successfully retrieved matching tasks */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'][];
        };
      };
      /** @description No tasks found matching criteria */
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
        /** @description Unique identifier for the task */
        taskId: components['parameters']['taskId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Task data retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'];
        };
      };
      /** @description Invalid task ID format or other parameter error */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Task not found */
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
        /** @description Unique identifier for the task */
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
      /** @description User metadata successfully updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['defaultOkMessage'];
        };
      };
      /** @description Invalid metadata format or validation error */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Task not found */
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
  updateTaskStatus: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Unique identifier for the task */
        taskId: components['parameters']['taskId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          status: components['schemas']['taskOperationStatus'];
        };
      };
    };
    responses: {
      /** @description Task status successfully changed */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'];
        };
      };
      /** @description Invalid status or illegal state transition */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Task not found */
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
  dequeueTask: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Type of the requested task */
        taskType: components['parameters']['taskType'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Task successfully dequeued and status updated to IN_PROGRESS */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['taskResponse'];
        };
      };
      /** @description Bad taskType parameter or other validation error */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description No pending tasks of requested type are available */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['errorMessage'];
        };
      };
      /** @description Internal server error or invalid state transition */
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
