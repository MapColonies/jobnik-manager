import { components } from '@openapi';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type JobData = components['schemas']['jobPayload'];
  }
}
