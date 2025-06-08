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
     *     Supports filtering by job mode, name, date range, priority.
     *     Optional inclusion of related stage data via the should_return_stages parameter.
     *
     *     Returns an empty array ([]) when no jobs match the specified criteria, rather than an error.
     *
     */
    get: operations['findJobs'];
    put?: never;
    /**
     * Create a new job with optional stages
     * @description Creates a new job in the system with user-defined configuration.
     *     Supports both pre-defined and dynamic job modes, with customizable priorities.
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
     *     Jobs can only be deleted when they are in a finite state (COMPLETED, FAILED, or ABORTED).
     *     Attempting to delete a job in any other state will result in a 400 error.
     *
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
     * Add a new stage to a dynamic job
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
     * Format: uuid
     * @description Unique identifier for a job
     */
    jobId: string;
    /** @description Custom job configuration data containing job-specific parameters */
    jobPayload: {
      [key: string]: unknown;
    };
    /** @description Completion percentage of a job, stage, or task (0-100) */
    percentage: number;
    /** @description Number of times a task has been attempted */
    attempts: number;
    /** @description Maximum number of retries allowed for a task */
    maxAttempts: number;
    /**
     * Format: uuid
     * @description Unique identifier for a stage
     */
    stageId: string;
    /** @description Custom stage configuration data containing stage-specific parameters */
    stagePayload: {
      [key: string]: unknown;
    };
    /**
     * @description Relative importance of the job, affecting processing order
     * @example LOW
     * @enum {string}
     */
    priority: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
    /**
     * @description Standard success message codes used in API responses
     * @example JOB_MODIFIED_SUCCESSFULLY
     * @enum {string}
     */
    successMessages: 'JOB_MODIFIED_SUCCESSFULLY' | 'TASK_MODIFIED_SUCCESSFULLY' | 'STAGE_MODIFIED_SUCCESSFULLY' | 'JOB_DELETED_SUCCESSFULLY';
    /**
     * @description Execution state of a stage within a job's workflow, tracking progress through its lifecycle.
     *     Finite states from which no further transitions are possible include: COMPLETED, FAILED, and ABORTED.
     *
     * @example CREATED
     * @enum {string}
     */
    jobOperationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'PAUSED' | 'WAITING' | 'CREATED';
    /**
     * @description Execution state of a stage within a job's workflow, tracking progress through its lifecycle.
     *     Finite states from which no further transitions are possible include: COMPLETED, FAILED, and ABORTED.
     *
     * @example CREATED
     * @enum {string}
     */
    stageOperationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'PAUSED' | 'WAITING' | 'CREATED';
    /**
     * @description Current operational state of a task, including specialized states like RETRIED for task-specific error handling.
     *     Finite states from which no further transitions are possible include: COMPLETED, FAILED, and ABORTED.
     *
     * @example CREATED
     * @enum {string}
     */
    taskOperationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'PAUSED' | 'CREATED' | 'RETRIED';
    /**
     * @description Job creation mode determining whether all stages must be defined at creation (PRE_DEFINED) or can be added later (DYNAMIC)
     * @example PRE_DEFINED
     * @enum {string}
     */
    jobMode: 'PRE_DEFINED' | 'DYNAMIC';
    /**
     * @description Category or type of job processing being performed, used for filtering and system behaviors
     * @example DEFAULT
     * @enum {string}
     */
    jobName: 'INGESTION' | 'EXPORT' | 'DEFAULT';
    /** @description Flag indicating whether to include complete stage details in job response payloads */
    returnStage: boolean;
    /** @description Flag indicating whether to include complete task details in stage response payloads */
    returnTask: boolean;
    /** @description Application-specific custom data container that can store arbitrary client information without affecting core operations */
    userMetadata: {
      [key: string]: unknown;
    };
    /** @description Aggregated task statistics grouped by operational status, providing a complete overview of stage progress.
     *     Used for monitoring progress, generating dashboards, and determining when stages/jobs are complete.
     *     The total field should always equal the sum of all other status counts.
     *      */
    summary: {
      /** @description Number of tasks awaiting execution */
      pending: number;
      /** @description Number of tasks currently being processed */
      inProgress: number;
      /** @description Number of tasks that finished successfully */
      completed: number;
      /** @description Number of tasks that encountered errors and could not be completed */
      failed: number;
      /** @description Number of tasks manually stopped before completion */
      aborted: number;
      /** @description Number of tasks temporarily suspended from execution */
      paused: number;
      /** @description Number of tasks in initial state before becoming pending */
      created: number;
      /** @description Number of tasks scheduled for re-execution after failure */
      retried: number;
      /** @description Total count of tasks belonging to the stage */
      total: number;
    };
    /** @description Input payload for creating a new job in the system.
     *     Contains all required configuration for job execution, including processing mode,
     *     custom parameters, metadata, and optionally pre-defined stages.
     *      */
    createJobPayload: {
      jobMode: components['schemas']['jobMode'];
      name?: components['schemas']['jobName'];
      data: components['schemas']['jobPayload'];
      priority?: components['schemas']['priority'];
      userMetadata: components['schemas']['userMetadata'];
      /** @description Optional array of stages to create with the job (required for PRE_DEFINED jobs) */
      stages?: components['schemas']['createStagePayload'][];
    };
    /** @description job Response model */
    jobResponse: {
      id: components['schemas']['jobId'];
      status?: components['schemas']['jobOperationStatus'];
      percentage?: components['schemas']['percentage'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
      jobMode: components['schemas']['jobMode'];
      name: components['schemas']['jobName'];
      data: components['schemas']['jobPayload'];
      priority?: components['schemas']['priority'];
      userMetadata: components['schemas']['userMetadata'];
      stages?: components['schemas']['stageResponse'][];
    };
    /** @description Input payload for creating a new processing stage.
     *     Defines the stage type, custom configuration data, and user-defined metadata.
     *     Used when adding stages to jobs or creating stages as part of job creation.
     *      */
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
      /** @description Associated tasks belonging to this stage */
      tasks?: components['schemas']['taskResponse'][];
    };
    /**
     * Format: uuid
     * @description Unique identifier for a task, generated by the system upon task creation
     */
    taskId: string;
    /**
     * @description Categorization of task functionality, determining the specific operation
     *     to be performed. Used for routing tasks to appropriate workers and
     *     for filtering in API requests.
     *
     * @example DEFAULT
     * @enum {string}
     */
    taskType: 'TILE_SEEDING' | 'TILE_RENDERING' | 'PUBLISH_CATALOG' | 'PUBLISH_LAYER' | 'DEFAULT';
    /** @description Custom task configuration data containing operation-specific parameters.
     *     The schema varies based on task type and contains all necessary information
     *     for task execution by workers.
     *      */
    taskPayload: {
      [key: string]: unknown;
    };
    createStageWithTasksPayload: components['schemas']['createStagePayload'] & {
      tasks?: components['schemas']['createTaskPayload'][];
    };
    /** @description Input payload for creating a new task within a stage.
     *     Contains task type, operational parameters, and optional retry configuration.
     *     Used when adding tasks to existing stages.
     *      */
    createTaskPayload: {
      type: components['schemas']['taskType'];
      data: components['schemas']['taskPayload'];
      userMetadata?: components['schemas']['userMetadata'];
      maxAttempts?: components['schemas']['maxAttempts'];
    };
    /** @description Complete task information returned by the API, including all configuration
     *     data along with execution status, attempt tracking, and associated stage reference.
     *     Used when retrieving task details or after task creation.
     *      */
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
    /** @description Response returned after successful job creation, containing the complete
     *     job details including the generated job ID and initial status information.
     *      */
    createJobResponse: {
      id: components['schemas']['jobId'];
      data?: components['schemas']['jobPayload'];
      status?: components['schemas']['jobOperationStatus'];
      percentage?: components['schemas']['percentage'];
      creationTime?: components['schemas']['creationTime'];
      updateTime?: components['schemas']['updateTime'];
      jobMode?: components['schemas']['jobMode'];
      userMetadata?: components['schemas']['userMetadata'];
      priority?: components['schemas']['priority'];
      name?: components['schemas']['jobName'];
      stages?: components['schemas']['stageResponse'][];
    };
    /** @description Standard error response structure used when API operations encounter problems.
     *     Contains a human-readable message and optional stack trace for debugging.
     *      */
    errorMessage: {
      /** @description Human-readable error description explaining what went wrong */
      message: string;
      /** @description Technical stack trace for debugging purposes, included based on
       *     server configuration settings
       *      */
      stacktrace?: string;
    };
    /** @description Standard success response structure used for operations that don't
     *     return entity data, providing a standardized confirmation message.
     *      */
    defaultOkMessage: {
      code: components['schemas']['successMessages'];
    };
    /** @description Simplified error response format used for common validation and client errors,
     *     containing just the essential error message without additional debugging data.
     *      */
    error: {
      /** @description Human-readable error description explaining what went wrong */
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
