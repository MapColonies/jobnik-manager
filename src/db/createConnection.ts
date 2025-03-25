import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { commonDbFullV1Type } from '@map-colonies/schemas';
import { Pool, type PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

interface SchemaExistsResult {
  exists: boolean;
}

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
    // todo - should be tested on future development (current version not support cert full deployment)
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

export async function verifyDbSetup(prisma: PrismaClient, schema: string): Promise<void> {
  try {
    const checkSchemaExists = await prisma.$queryRaw<SchemaExistsResult[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.schemata
      WHERE schema_name = ${schema}
    )
  `;
    if (!(checkSchemaExists[0]?.exists ?? false)) {
      throw new Error(`Schema: ${schema} doesn't exists`);
    }

    await prisma.job.count(); // validate migration deployed job table
    // TODO - AFTER IMPLEMENTATION - await prisma.stage.count(); // validate migration deployed stage table
    // TODO - AFTER IMPLEMENTATION - await prisma.task.count(); // validate migration deployed task table
  } catch (error) {
    throw new Error(`Error on db connection: ${(error as Error).message}`);
  }
}
