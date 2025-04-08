export class StageNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, StageNotFoundError.prototype);
  }
}

export const errorMessages = {
  /**Signifies that the specified job could not be located*/
  stageNotFound: 'STAGE_NOT_FOUND',
} as const;
