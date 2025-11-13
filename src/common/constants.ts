import { readPackageJsonSync } from '@map-colonies/read-pkg';
import { CamelCase, ScreamingSnakeCase } from 'type-fest';
import { components } from '@src/openapi';

type SuccessMessages = components['schemas']['successMessages'];
type SuccessMessagesObj = {
  [key in CamelCase<SuccessMessages>]: ScreamingSnakeCase<key>;
};

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';
export const DEFAULT_SERVER_PORT = 80;
export const DB_CONNECTION_TIMEOUT = 5000;
export const NODE_VERSION = process.versions.node;

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  METRICS: Symbol('METRICS'),
  SERVICE_METRICS: Symbol('SERVICE_METRICS'),
  PRISMA: Symbol('Prisma'),
  HEALTHCHECK: Symbol('Healthcheck'),
} satisfies Record<string, symbol>;
/* eslint-enable @typescript-eslint/naming-convention */

export const successMessages: SuccessMessagesObj = {
  jobModifiedSuccessfully: 'JOB_MODIFIED_SUCCESSFULLY',
  stageModifiedSuccessfully: 'STAGE_MODIFIED_SUCCESSFULLY',
  jobDeletedSuccessfully: 'JOB_DELETED_SUCCESSFULLY',
  taskModifiedSuccessfully: 'TASK_MODIFIED_SUCCESSFULLY',
};

/**
 * The value representing the final state in XState state machine
 */
export const XSTATE_DONE_STATE = 'done';
