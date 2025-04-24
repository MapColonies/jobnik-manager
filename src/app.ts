import { Application } from 'express';
import { DependencyContainer } from 'tsyringe';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { PrismaClient } from '@prismaClient';
import type { ConfigType } from '@common/config';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { ServerBuilder } from './serverBuilder';
import { SERVICES } from './common/constants';
import { verifyDbSetup } from './db/createConnection';

async function getApp(registerOptions?: RegisterOptions): Promise<[Application, DependencyContainer]> {
  const container = await registerExternalValues(registerOptions);
  const prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  const dbConfig = config.get('db') as commonDbFullV1Type;

  await verifyDbSetup(prisma, dbConfig.schema);

  const app = container.resolve(ServerBuilder).build();
  return [app, container];
}

export { getApp };
