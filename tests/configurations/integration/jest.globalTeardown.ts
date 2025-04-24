import config from 'config';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { createConnectionOptions, createPrismaClient } from '../../../src/db/createConnection';

export default async function globalSetup(): Promise<void> {
  const dbConfig = config.get<commonDbFullV1Type>('db');
  const pgPoolConfig = createConnectionOptions(dbConfig);
  const prisma = createPrismaClient(pgPoolConfig, dbConfig.schema);
  await prisma.$queryRaw`DROP SCHEMA IF EXISTS job_manager CASCADE`;
  await prisma.$disconnect();
}
