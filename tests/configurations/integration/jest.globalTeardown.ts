import config from 'config';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { createConnectionOptions, initPoolConnection } from '../../../src/db/createConnection';

export default async function globalSetup(): Promise<void> {
  const pool = await initPoolConnection(createConnectionOptions(config.get<commonDbFullV1Type>('db')));
  await pool.query('DROP SCHEMA IF EXISTS job_manager CASCADE');
  await pool.end();
}
