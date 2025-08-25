import { Application } from 'express';
import { DependencyContainer } from 'tsyringe';
import { PrismaClient } from '@prismaClient';
import type { ConfigType } from '@common/config';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { ServerBuilder } from './serverBuilder';
import { SERVICES } from './common/constants';
import { verifyDbSetup } from './db/createConnection';
import { getTaskReleaserCron } from './common/utils/cron';
import { TaskReleaser } from './tasks/models/taskReleaser';

async function getApp(registerOptions?: RegisterOptions): Promise<[Application, DependencyContainer]> {
  const container = await registerExternalValues(registerOptions);
  const prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  const dbConfig = config.get('db');

  await verifyDbSetup(prisma, dbConfig.schema);

  const app = container.resolve(ServerBuilder).build();

  const taskReleaser = container.resolve<TaskReleaser>(TaskReleaser);
  const cronConfig = config.get('cron');
  const taskCron = getTaskReleaserCron(cronConfig, taskReleaser);

  if (cronConfig.enabled) {
    await taskCron.start();
  }

  return [app, container];
}

export { getApp };
