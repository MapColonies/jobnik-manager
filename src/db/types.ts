import { components } from '@openapi';
import { Snapshot } from 'xstate';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type JobData = components['schemas']['jobPayload'];
    type StageData = components['schemas']['stagePayload'];
    type StageSummary = components['schemas']['summary'];
    type PersistenceSnapshot = Snapshot<unknown>;
  }
}
