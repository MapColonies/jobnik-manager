// @ts-expect-error https://github.com/google/zx/issues/871
import { $ } from 'zx';
import { commonDbFullV1Type } from '@map-colonies/schemas';
import { initConfig, getConfig } from '../../../src/common/config';
import { createDbConnectUrl } from '../../../src/db/helpers';

export default async function globalSetup(): Promise<void> {
  await initConfig(true);
  const configInstance = getConfig();
  const dbConfig = configInstance.get('db') as commonDbFullV1Type; // todo - temporary - will removed after dedicated schema with db will be published
  const connectionDbUrl = createDbConnectUrl(dbConfig);
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const $$ = $({ env: { DATABASE_URL: connectionDbUrl } });
  // await $$`node_modules/.bin/prisma generate --schema ./src/db/prisma/schema.prisma`;
  await $$`node_modules/.bin/prisma migrate deploy --schema ./src/db/prisma/schema.prisma`;
}
