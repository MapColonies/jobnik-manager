import type { components, operations } from '@src/openapi';
import type { CamelCase, ScreamingSnakeCase } from 'type-fest';

type SuccessMessages = components['schemas']['successMessages'];
type SuccessMessagesObj = {
  [key in CamelCase<SuccessMessages>]: ScreamingSnakeCase<key>;
};

const successMessages: SuccessMessagesObj = {
  jobModifiedSuccessfully: 'JOB_MODIFIED_SUCCESSFULLY',
  stageModifiedSuccessfully: 'STAGE_MODIFIED_SUCCESSFULLY',
  jobDeletedSuccessfully: 'JOB_DELETED_SUCCESSFULLY',
};

type StageModel = components['schemas']['stageResponse'];
type StageCreateModel = components['schemas']['createStagePayload'];
type StageSummary = components['schemas']['summary'];
type StageFindCriteriaArg = operations['getStages']['parameters']['query'];

export { successMessages };
export type { StageSummary, StageModel, StageFindCriteriaArg, StageCreateModel };
