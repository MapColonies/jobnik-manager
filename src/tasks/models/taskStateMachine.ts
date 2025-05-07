/* eslint-disable @typescript-eslint/naming-convention */
import { createActor, setup, Snapshot } from 'xstate';
import { TaskOperationStatus } from '@prismaClient';
import { InvalidUpdateError, errorMessages as commonErrorMessages } from '@src/common/errors';

type changeStatusOperations = 'pend' | 'pause' | 'abort' | 'complete' | 'retry' | 'process' | 'fail' | 'create';

const OperationStatusMapper: { [key in TaskOperationStatus]: changeStatusOperations } = {
  [TaskOperationStatus.PENDING]: 'pend',
  [TaskOperationStatus.IN_PROGRESS]: 'process',
  [TaskOperationStatus.COMPLETED]: 'complete',
  [TaskOperationStatus.FAILED]: 'fail',
  [TaskOperationStatus.ABORTED]: 'abort',
  [TaskOperationStatus.CREATED]: 'create',
  [TaskOperationStatus.PAUSED]: 'pause',
  [TaskOperationStatus.RETRIED]: 'retry',
};

const taskStateMachine = setup({
  types: {
    events: {} as
      | { type: 'pend' }
      | { type: 'pause' }
      | { type: 'abort' }
      | { type: 'complete' }
      | { type: 'process' }
      | { type: 'fail' }
      | { type: 'retry' }
      | { type: 'create' },
  },
}).createMachine({
  id: 'taskStatus',
  initial: 'CREATED',
  states: {
    CREATED: {
      on: {
        pend: { target: 'PENDING' },
        pause: { target: 'PAUSED' },
        abort: { target: 'ABORTED' },
      },
    },
    PENDING: {
      on: {
        process: { target: 'IN_PROGRESS' },
        abort: { target: 'ABORTED' },
        pause: { target: 'PAUSED' },
      },
    },
    IN_PROGRESS: {
      on: {
        complete: { target: 'COMPLETED' },
        fail: { target: 'FAILED' },
        retry: { target: 'RETRIED' },
        abort: { target: 'ABORTED' },
        pause: { target: 'PAUSED' },
      },
    },
    PAUSED: {
      on: {
        pend: { target: 'PENDING' },
        retry: { target: 'RETRIED' },
        process: { target: 'IN_PROGRESS' },
        abort: { target: 'ABORTED' },
      },
    },
    RETRIED: {
      on: {
        process: { target: 'IN_PROGRESS' },
        abort: { target: 'ABORTED' },
        pause: { target: 'PAUSED' },
      },
    },
    COMPLETED: {
      type: 'final',
    },
    FAILED: {
      type: 'final',
    },
    ABORTED: {
      type: 'final',
    },
  },
});

/**
 * Updates the task machine state based on the provided status and xstate snapshot.
 * @param {TaskOperationStatus} status - The new status to set.
 * @param {PrismaJson.PersistenceSnapshot} xstate - The current xstate snapshot.
 * @returns {Snapshot<unknown>} - The updated xstate snapshot.
 * @throws {InvalidUpdateError} - If the status change is invalid.
 */
function updateTaskMachineState(status: TaskOperationStatus, xstate: PrismaJson.PersistenceSnapshot): Snapshot<unknown> {
  const updateActor = createActor(taskStateMachine, { snapshot: xstate }).start();

  const nextStatusChange = OperationStatusMapper[status];
  const isValidStatus = updateActor.getSnapshot().can({ type: nextStatusChange });

  if (!isValidStatus) {
    throw new InvalidUpdateError(commonErrorMessages.invalidStatusChange);
  }

  updateActor.send({ type: nextStatusChange });
  const newPersistedSnapshot = updateActor.getPersistedSnapshot();
  updateActor.stop();

  return newPersistedSnapshot;
}

export { taskStateMachine, updateTaskMachineState };
export type { changeStatusOperations };
