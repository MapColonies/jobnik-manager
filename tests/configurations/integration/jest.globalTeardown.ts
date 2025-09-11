/* eslint-disable no-console */
import path from 'node:path';
import isCI from 'is-ci';
import { downAll } from 'docker-compose';
import { getConfig } from '../../../src/common/config';
import { createConnectionOptions, createPrismaClient } from '../../../src/db/createConnection';
import { getLocalTestConfig } from './utils';

export default async function globalSetup(): Promise<void> {
  const configInstance = getConfig();
  const dbConfig = configInstance.get('db');
  const pgPoolConfig = createConnectionOptions(dbConfig);
  const prisma = createPrismaClient(pgPoolConfig, dbConfig.schema);
  await prisma.$queryRaw`DROP SCHEMA IF EXISTS job_manager CASCADE`;
  await prisma.$disconnect();

  if (isCI) {
    console.log('Running in CI environment, downing postgres');
    const port = getLocalTestConfig().db!.port!;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    await downAll({ cwd: path.join(__dirname), log: true, env: { POSTGRES_PORT: port.toString() } });
  }
}
