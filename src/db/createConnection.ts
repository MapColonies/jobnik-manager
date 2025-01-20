import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { commonDbFullV1Type } from '@map-colonies/schemas';
import { Pool, type PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export type DbConfig = {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
} & PoolConfig;

export const createConnectionOptions = (dbConfig: commonDbFullV1Type): PoolConfig => {
  const dataSourceOptions: PoolConfig = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    application_name: `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}`,
    user: dbConfig.username,
    host: dbConfig.host,
    password: dbConfig.password,
    database: dbConfig.database,
  };
  const sslParams = dbConfig.ssl;
  if (sslParams.enabled) {
    dataSourceOptions.ssl = { key: readFileSync(sslParams.key), cert: readFileSync(sslParams.cert), ca: readFileSync(sslParams.ca) };
  }
  return dataSourceOptions;
};

export async function initPoolConnection(dbConfig: PoolConfig): Promise<Pool> {
  const pool = new Pool(dbConfig);
  await pool.query('SELECT NOW()');
  return pool;
}

export function createPrismaClient(pool: Pool, schema: string): PrismaClient {
  const adapter = new PrismaPg(pool, { schema });
  const prisma = new PrismaClient({ adapter });
  return prisma;
}
