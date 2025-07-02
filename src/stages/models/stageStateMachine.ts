/* eslint-disable @typescript-eslint/naming-convention */
import { setup } from 'xstate';
import { StageOperationStatus } from '@prismaClient';

type changeStatusOperations = 'pend' | 'wait' | 'pause' | 'abort' | 'complete' | 'process' | 'fail' | 'create';

const OperationStatusMapper: { [key in StageOperationStatus]: changeStatusOperations } = {
  [StageOperationStatus.PENDING]: 'pend',
  [StageOperationStatus.IN_PROGRESS]: 'process',
  [StageOperationStatus.COMPLETED]: 'complete',
  [StageOperationStatus.FAILED]: 'fail',
  [StageOperationStatus.ABORTED]: 'abort',
  [StageOperationStatus.WAITING]: 'wait',
  [StageOperationStatus.CREATED]: 'create',
  [StageOperationStatus.PAUSED]: 'pause',
};

const stageStateMachine = setup({
  types: {
    events: {} as
      | { type: 'pend' }
      | { type: 'wait' }
      | { type: 'pause' }
      | { type: 'abort' }
      | { type: 'complete' }
      | { type: 'process' }
      | { type: 'fail' }
      | { type: 'create' },
  },
}).createMachine({
  id: 'stageStatus',
  initial: 'CREATED',
  states: {
    CREATED: {
      on: {
        pend: { target: 'PENDING' },
        wait: { target: 'WAITING' },
        pause: { target: 'PAUSED' },
        abort: { target: 'ABORTED' },
      },
    },
    PENDING: {
      on: {
        wait: { target: 'WAITING' },
        process: { target: 'IN_PROGRESS' },
        abort: { target: 'ABORTED' },
        pause: { target: 'PAUSED' },
      },
    },
    IN_PROGRESS: {
      on: {
        complete: { target: 'COMPLETED' },
        fail: { target: 'FAILED' },
        abort: { target: 'ABORTED' },
        pause: { target: 'PAUSED' },
        wait: { target: 'WAITING' },
      },
    },
    PAUSED: {
      on: {
        pend: { target: 'PENDING' },
        wait: { target: 'WAITING' },
        process: { target: 'IN_PROGRESS' },
        abort: { target: 'ABORTED' },
      },
    },
    WAITING: {
      on: {
        pend: { target: 'PENDING' },
        abort: { target: 'ABORTED' },
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

export { stageStateMachine, OperationStatusMapper };
