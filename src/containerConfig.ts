import type { Server } from 'node:http';
import { getOtelMixin } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import type { DependencyContainer } from 'tsyringe/dist/typings/types';
import { type Logger, jsLogger } from '@map-colonies/js-logger';
import { instanceCachingFactory, instancePerContainerCachingFactory } from 'tsyringe';
import { HealthCheckManager } from '@map-colonies/health-check';
import type { PrismaClient } from '@prismaClient';
import { type InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { DB_CONNECTION_TIMEOUT, ROUTERS, SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { promiseTimeout } from './common/utils/promiseTimeout';
import { getConfig } from './common/config';
import { createConnectionOptions, createPrismaClient } from './db/createConnection';
import { SERVICE_METRICS_SYMBOL, serviceMetricsFactory } from './common/serviceMetrics';
import { jobV1RouterFactory } from './api/v1/jobs/router';
import { stageV1RouterFactory } from './api/v1/stages/router';
import { taskV1RouterFactory } from './api/v1/tasks/router';
import { v1RouterFactory, V1_ROUTER_SYMBOL } from './api/v1';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();
  const dbConfig = configInstance.get('db');

  const loggerConfig = configInstance.get('telemetry.logger');
  const loggerRedactionSettings = { paths: ['data', 'response.data'], remove: true };
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin(), redact: loggerRedactionSettings });

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  const serviceMetricsRegistry = new Registry();

  configInstance.initializeMetrics(metricsRegistry);

  const prismaClientConfig = createConnectionOptions(dbConfig);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: SERVICES.SERVICE_METRICS, provider: { useValue: serviceMetricsRegistry } },
    { token: SERVICE_METRICS_SYMBOL, provider: { useFactory: serviceMetricsFactory } },
    {
      token: SERVICES.PRISMA,
      provider: {
        useFactory: instancePerContainerCachingFactory(() => {
          return createPrismaClient(prismaClientConfig, dbConfig.schema);
        }),
      },
    },
    {
      token: SERVICES.HEALTHCHECK,
      provider: {
        /* v8 ignore next 17 -- @preserve */
        useFactory: instanceCachingFactory((container) => {
          const server = container.resolve<Server>(SERVICES.SERVER);
          const logger = container.resolve<Logger>(SERVICES.LOGGER);
          const onSignal = container.resolve<() => Promise<void>>('onSignal');
          const prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);

          const manager = new HealthCheckManager(server, logger, { onSignal });

          manager.registerReadinessCheck('postgres', async () => {
            const check = prisma.$queryRaw`SELECT 1`.then(() => {
              return;
            });
            return promiseTimeout<void>(DB_CONNECTION_TIMEOUT, check);
          });

          manager.registerShutdownHook('postgres', async () => {
            await prisma.$disconnect();
          });

          return manager;
        }),
      },
    },

    { token: ROUTERS.JOBS_V1, provider: { useFactory: jobV1RouterFactory } },
    { token: ROUTERS.STAGES_V1, provider: { useFactory: stageV1RouterFactory } },
    { token: ROUTERS.TASKS_V1, provider: { useFactory: taskV1RouterFactory } },
    { token: V1_ROUTER_SYMBOL, provider: { useFactory: v1RouterFactory } },

    {
      token: 'onSignal',
      provider: {
        /* v8 ignore next 3 -- @preserve */
        useValue: async (): Promise<void> => {
          await Promise.all([getTracing().stop()]);
        },
      },
    },
  ];

  return Promise.resolve(registerDependencies(dependencies, options?.override, options?.useChild));
};
