export class JobNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, JobNotFoundError.prototype);
  }
}

export const JOB_NOT_FOUND_MSG = 'JOB_NOT_FOUND';
