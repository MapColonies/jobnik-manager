export class JobNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, JobNotFoundError.prototype);
  }
}
