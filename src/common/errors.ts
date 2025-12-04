import { JobOperationStatus, StageOperationStatus, TaskOperationStatus } from '@src/db/prisma/generated/client';

export const prismaKnownErrors = {
  /**An operation failed because it depends on one or more records that were required but not found. {cause} */
  recordNotFound: 'P2025',
} as const;

// XState machine state names (uppercase)
type XStateMachineState =
  | 'CREATED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABORTED'
  | 'PAUSED'
  | 'WAITING'
  | 'RETRIED';

export function illegalStatusTransitionErrorMessage(
  currentStatus: XStateMachineState | string,
  requiredStatus: JobOperationStatus | StageOperationStatus | TaskOperationStatus
): string {
  return `Illegal status transition from ${currentStatus} to ${requiredStatus}`;
}
