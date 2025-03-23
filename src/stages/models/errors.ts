export class StageNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, StageNotFoundError.prototype);
  }
}

export const prismaKnownErrors = {
  /**An operation failed because it depends on one or more records that were required but not found. {cause} */
  recordNotFound: 'P2025',
} as const;

export const stagesErrorMessages = {
  /**Signifies that the specified job could not be located*/
  stageNotFound: 'STAGE_NOT_FOUND',
} as const;
