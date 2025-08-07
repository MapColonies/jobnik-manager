export const prismaKnownErrors = {
  /**An operation failed because it depends on one or more records that were required but not found. {cause} */
  recordNotFound: 'P2025',
} as const;

export const errorMessages = {
  /**Status changes are limited by the state machine's allowed transitions*/
  invalidStatusTransition: 'INVALID_STATUS_TRANSITION',
} as const;
