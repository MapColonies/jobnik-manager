// @ts-expect-error https://github.com/google/zx/issues/871
import { $ } from 'zx';
import { dbConnectUrlFromConfig } from '../../../src/db/helpers';

export default async function globalSetup(): Promise<void> {
  const connectionDbUrl = dbConnectUrlFromConfig();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const $$ = $({ env: { DATABASE_URL: connectionDbUrl } });
  await $$`node_modules/.bin/prisma migrate deploy --schema ./src/db/prisma/schema.prisma`;
}
