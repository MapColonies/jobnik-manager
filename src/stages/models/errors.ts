export const errorMessages = {
  /**Adding tasks to finite state stages is not allowed*/
  stageAlreadyFinishedTasksError: 'STAGE_ALREADY_FINISHED_TASKS_ERROR',
  /**Signifies that the specified stage could not be located*/
  stageNotFound: 'STAGE_NOT_FOUND',
  /**Signifies that the specified related job could not be located*/
  missingJobProperty: 'MISSING_JOB_PROPERTY',
} as const;
