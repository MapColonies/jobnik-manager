export class JobNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, JobNotFoundError.prototype);
  }
}

export const jobsErrorMessages = {
  jobNotInFiniteState: 'JOB_NOT_IN_FINITE_STATE',
  jobAlreadyFinishedStagesError: 'JOB_ALREADY_FINISHED_STAGES_ERROR',
  jobNotFound: 'JOB_NOT_FOUND',
  preDefinedJobStageModificationError: 'PREDEFINED_JOB_STAGE_MODIFICATION_ERROR',
} as const;
