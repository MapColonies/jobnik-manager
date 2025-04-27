/* eslint-disable @typescript-eslint/naming-convention */
import { setup } from 'xstate';
import { TaskOperationStatus } from '@prismaClient';

type changeStatusOperations = 'pend' | 'wait' | 'pause' | 'abort' | 'complete' | 'retry' | 'process' | 'fail' | 'create';

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

export { taskStateMachine, OperationStatusMapper };
