export class JobNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, JobNotFoundError.prototype);
  }
}

export class InvalidUpdateError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidUpdateError.prototype);
  }
}

export const prismaKnownErrors = {
  /**An operation failed because it depends on one or more records that were required but not found. {cause} */
  recordNotFound: 'P2025',
} as const;
