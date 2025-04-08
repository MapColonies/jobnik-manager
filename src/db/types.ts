import { Snapshot } from 'xstate';
import { components } from '@openapi';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type JobData = components['schemas']['jobPayload'];
    type UserMetadata = components['schemas']['userMetadata'];
    type StageData = components['schemas']['stagePayload'];
    type StageSummary = components['schemas']['summary'];
    type TaskData = components['schemas']['taskPayload'];
    type PersistenceSnapshot = Snapshot<unknown>;
  }
}
