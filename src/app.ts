import { Application } from 'express';
import { DependencyContainer } from 'tsyringe';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { schedule } from 'node-cron';
import { PrismaClient } from '@prismaClient';
import type { ConfigType } from '@common/config';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { ServerBuilder } from './serverBuilder';
import { SERVICES } from './common/constants';
import { verifyDbSetup } from './db/createConnection';
import { CronConfig } from './common/interfaces';
import { TaskManager } from './tasks/models/manager';

async function getApp(registerOptions?: RegisterOptions): Promise<[Application, DependencyContainer]> {
  const container = await registerExternalValues(registerOptions);
  const prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  // todo - remove after integrating with config managements
  const dbConfig = config.get('db') as commonDbFullV1Type;
  // todo - remove after integrating with config managements
  const cronConfig = config.get('staleTasksSweeper') as CronConfig;

  await verifyDbSetup(prisma, dbConfig.schema);

  const app = container.resolve(ServerBuilder).build();

  if (cronConfig.enabled) {
    const taskManager = container.resolve(TaskManager);
    schedule(cronConfig.schedule, async () => {
      await taskManager.cleanStaleTasks();
    });
  }

  return [app, container];
}

export { getApp };
