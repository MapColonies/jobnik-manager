export class JobNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, JobNotFoundError.prototype);
  }
}

export const jobsErrorMessages = {
  /**Operation that are restricted for jobs with finite statuses*/
  jobNotInFiniteState: 'JOB_NOT_IN_FINITE_STATE',
  /**Adding stages to finite state jobs is not allowed*/
  jobAlreadyFinishedStagesError: 'JOB_ALREADY_FINISHED_STAGES_ERROR',
  /**Signifies that the specified job could not be located*/
  jobNotFound: 'JOB_NOT_FOUND',
  /**Stages cannot be added to or modified for predefined jobs*/
  preDefinedJobStageModificationError: 'PREDEFINED_JOB_STAGE_MODIFICATION_ERROR',
} as const;
