export class StageNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, StageNotFoundError.prototype);
  }
}

export const errorMessages = {
  /**Adding tasks to finite state stages is not allowed*/
  stageAlreadyFinishedTasksError: 'STAGE_ALREADY_FINISHED_TASKS_ERROR',
  /**Signifies that the specified stage could not be located*/
  stageNotFound: 'STAGE_NOT_FOUND',
} as const;
