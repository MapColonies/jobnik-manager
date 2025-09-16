import { Application } from 'express';
import { DependencyContainer } from 'tsyringe';
import { schedule, validate } from 'node-cron';
import { PrismaClient } from '@prismaClient';
import type { ConfigType } from '@common/config';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { ServerBuilder } from './serverBuilder';
import { SERVICES } from './common/constants';
import { verifyDbSetup } from './db/createConnection';
import { TaskManager } from './tasks/models/manager';

async function getApp(registerOptions?: RegisterOptions): Promise<[Application, DependencyContainer]> {
  const container = await registerExternalValues(registerOptions);
  const prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  const dbConfig = config.get('db');
  const cronConfig = config.get('staleTasksSweeperCron');

  await verifyDbSetup(prisma, dbConfig.schema);

  const app = container.resolve(ServerBuilder).build();

  if (cronConfig.enabled) {
    const taskManager = container.resolve(TaskManager);
    if (!validate(cronConfig.schedule)) {
      throw new Error(`Invalid cron schedule: ${cronConfig.schedule}`);
    }

    schedule(cronConfig.schedule, async () => {
      await taskManager.cleanStaleTasks();
    });
  }

  return [app, container];
}

export { getApp };
