/* eslint-disable no-console */
import path from 'node:path';
import * as fs from 'fs';
import * as compose from 'docker-compose';
import { $ } from 'zx';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { getPort, checkPort } from 'get-port-please';
import { initConfig, getConfig } from '../../../src/common/config';
import { createDbConnectUrl } from '../../../src/db/helpers';

const configPath = path.join(process.cwd(), 'config', 'local-test.json');
interface Config {
  db?: {
    port?: number;
  };
}

async function getSelectedPort(config: Config): Promise<number> {
  let port: number;

  if (config.db?.port !== undefined) {
    port = config.db.port;
    console.log(`Found custom port in local-test.json. Using port: ${port}`);
  } else {
    // If a port was not defined in the config file, find an available one and write it to local-test.json
    port = await getPort({ port: 5433 });
    console.log(`No custom port defined. Using available port: ${port}`);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    fs.writeFileSync(configPath, JSON.stringify({ ...config, db: { ...config.db, port } }, null, 2), 'utf-8');
  }

  return port;
}

export default async function globalSetup(): Promise<void> {
  // Check if the config file exists first
  const config = fs.existsSync(configPath) ? (JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Config) : {};
  const port = await getSelectedPort(config);

  if ((await checkPort(port)) === false) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    await compose.upAll({ cwd: path.join(__dirname), log: true, env: { POSTGRES_PORT: port.toString() } });
  }

  await initConfig(true);
  const configInstance = getConfig();
  const dbConfig = configInstance.get('db') as commonDbFullV1Type; // todo - temporary - will removed after dedicated schema with db will be published
  const connectionDbUrl = createDbConnectUrl(dbConfig);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const $$ = $({ env: { ...process.env, DATABASE_URL: connectionDbUrl } });
  await $$`node_modules/.bin/prisma migrate deploy --schema ./src/db/prisma/schema.prisma`;
}
