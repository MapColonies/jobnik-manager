/* eslint-disable @typescript-eslint/naming-convention */
import { setup } from 'xstate';
import { JobOperationStatus } from '@prisma/client';

type changeStatusOperations = 'pend' | 'wait' | 'pause' | 'abort' | 'complete' | 'process' | 'fail' | 'create';

const OperationStatusMapper: { [key in JobOperationStatus]: changeStatusOperations } = {
  [JobOperationStatus.PENDING]: 'pend',
  [JobOperationStatus.IN_PROGRESS]: 'process',
  [JobOperationStatus.COMPLETED]: 'complete',
  [JobOperationStatus.FAILED]: 'fail',
  [JobOperationStatus.ABORTED]: 'abort',
  [JobOperationStatus.WAITING]: 'wait',
  [JobOperationStatus.CREATED]: 'create',
  [JobOperationStatus.PAUSED]: 'pause',
};

// function validateNextState(currentState: JobOperationStatus, nextState: JobOperationStatus): boolean {
//   const validNextStates = jobStateMachine.states[currentState].on;
//   const isValid = OperationStatusVerb[nextState] in validNextStates;
//   return isValid;
// }
const jobStateMachine = setup({
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCsD2AjAygFwIbYFdYA6AYQCUBRAQQBVKARAYglQDsxjY9tO0seRMlTqMA2gAYAuolAAHVLACW2Je1kgAHogCMATgDsxAMx6JANgBMADmvnz14wBYD5gDQgAnoid6ArMQGvobGEn4SOtY2AL7RHvw4+EIUNPTMcmBsEJIySCAKyqrqedoI+kamFjZ2Ds6uHt5lxjrEem16dsbm-hEGsfEYiYQkKaLMAO64KjkaBSpqbBql5SZmVrb2ji7uXojWLcFtvpYG1n56-SAJgiMiaUxyuERgM3lzRYsluoarVRu12waiCsElaOnsxi6BgMhj0lku1ySt1SjCYuHQqAATthXvJFPNiqBlj9Kusalt6rsyuZmq02o5rBJrNCdH5jAjBjdiAAFSgAOQYAEk+QBxJiTabSWb4j5LXTGc7ESIGPys6x6GnmPx+IEIJys4hWXwGHSmSzGVxODkCJE8-lC0UPTGoADGcFguPyMoWcrKEj0LUsGvVEiZlqcTl1p3MxEswT85n1fksqp01qGQl5AuFYvRWJxUre3sJWnliuVqr86s12t1Oks3UCvjO-pTKbTcSunNtWYdYsez097x9XzKOjCxCc1gjoZsEZVurbTfpln9EmM5okVs7iOGxGFAH1ueQAPIiqiYTBMF2oAC2cgANmBeEPi58iYhodZY1rzJELWYUS6n+Th0m03RtqcJrplyh7HmeF5Xpiz6Yp4r6FCOH4IF+P4Jv+MJMpYwFapO7TmBYegRkG1gwbacGnuelCXkwABmUwPuhBLvqW2GnLhf6OARQFUmYRhBG0Egwr4ThBuYtF7vRCFMVeebYpxsqjjhDZ4YJgFEVSppmKRHROPYpmSZY8I7t2Cl8keDGIQ8TywC8hZ4hhJalKZoFsvWxxhJCbTAZYLTGIycKhuufiuFZAw2rZ9lKcxEoFrk7lcb6Wm-vhel1hINixs25xTl0TLbnFGYkNy1AAKqYKiGRZOpmE8U44QmE4FqVEy4SUcYupdcZhinDoo0RuVXbxZmtX1RMUypdKHncV57XOF1Zg9f6nV1joU5gWcyZbjJhjydNdUNc6bqwB6blektvptaCa0GN1LZ9cBJrELY-pjW1IXqqdVUzaiqkLUW92jo9HXraGb3bQZqaFSZ5qbHoFqA8QADq1CCrQOYPJk2S3cOnnyuRX2dSqHQBm2kZUl0AR+bCPQvej1lTSQ2O4-joPNaTZRVkYZxowGrKqiqdONPq35MyaZoWomGNULQ5CCg1hN88tug-bGwYbcyiYRsRASHOR3RUR0sSdmwqAQHAGi7kQi0ZaOAC0OyNK7ATtD7vttOy7OVcIKIMM7GlYTJuqUV9kIbn4ThlRY0UY72OZhy1yyWS004KzYCo0uuA0vWBw37L9E2OyQimMZe6f89FoIhn+Ogqom-j6Y0Vh6K0ibtgGYTgnJgdctV52h+DLtYaE3do+Jv7+OUwUHIPkLmNCsKxZNQdc3jop11rZSmd3DgquOtSJsyurS4acaGIZ5rhkrlAq2r4-peHPFozGpyiQnoZBBEY2JczaUWOjRYetpSAngALLcgADLP0YPvX0oklQpn-oYCICtdThBaIPGk0IDCST-H0CBe4ABiOMEFvzupPT+kk0HhEkpg00lJGhrBLsmU05EDBxgxtQAAQiecgaRkGjnBB0Ew5wwrFTjFWD28p1TLhDI4E4u1wGxCAA */
  id: 'jobStatus',
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

// const jobStatusActor = createActor(jobStateMachine).start();

// jobStatusActor.send({ type: 'pend' });

// const snap = jobStatusActor.getPersistedSnapshot();
// const snap2 = jobStatusActor.getSnapshot();

// console.log(snap2.can({ type: 'complete' }), 'cannnnnnnnn?');
// console.log(snap2.can({ type: 'abort' }), 'cannnnnnnnn?');

// console.log(snap, '000000000000000');
// const nextReqActor = createActor(jobStateMachine, { snapshot: snap }).start();

// const jobStatusActor = createActor(jobStateMachine).start();
// jobStatusActor.send({ type: 'pend' });
// const snap = jobStatusActor.getPersistedSnapshot();
// const snap2 = jobStatusActor.getSnapshot();
// console.log(snap2.can({ type: 'complete' }), 'cannnnnnnnn?');
// console.log(snap2.can({ type: 'abort' }), 'cannnnnnnnn?');
// console.log(snap, '000000000000000');
// const nextReqActor = createActor(jobStateMachine, { snapshot: snap }).start();
export { jobStateMachine /*, validateNextState*/, OperationStatusMapper };
