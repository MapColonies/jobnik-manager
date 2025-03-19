export class InvalidUpdateError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidUpdateError.prototype);
  }
}

export class InvalidDeletionError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidDeletionError.prototype);
  }
}

export const prismaKnownErrors = {
  /**An operation failed because it depends on one or more records that were required but not found. {cause} */
  recordNotFound: 'P2025',
} as const;

export const BAD_STATUS_CHANGE = 'Invalid status change';
