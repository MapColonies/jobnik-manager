import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import type { Pool } from 'pg';
import jsLogger from '@map-colonies/js-logger';
import { commonDbFullV1Type } from '@map-colonies/schemas';
import { instanceCachingFactory, instancePerContainerCachingFactory } from 'tsyringe';
import { HealthCheck } from '@godaddy/terminus';
import { InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { DB_CONNECTION_TIMEOUT, SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { jobRouterFactory, JOB_ROUTER_SYMBOL } from './jobs/routes/jobRouter';
import { getConfig } from './common/config';
import { createConnectionOptions, createPrismaClient, initPoolConnection } from './db/createConnection';
import { promiseTimeout } from './common/utils/promiseTimeout';
import { stageRouterFactory, STAGE_ROUTER_SYMBOL } from './stages/routes/stageRouter';
import { taskRouterFactory, TASK_ROUTER_SYMBOL } from './tasks/routes/taskRouter';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();
  const dbConfig = configInstance.get('db') as commonDbFullV1Type;

  const loggerConfig = configInstance.get('telemetry.logger');
  const loggerRedactionSettings = { paths: ['data', 'response.data'], remove: true };
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin(), redact: loggerRedactionSettings });

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  let pool: Pool;
  try {
    pool = await initPoolConnection(createConnectionOptions(dbConfig));
  } catch (error) {
    const errMsg = (error as Error).message;
    throw new Error(`Failed to connect to the database with error: ${errMsg}`);
  }

  const healthCheck = (pool: Pool): HealthCheck => {
    return async (): Promise<void> => {
      const check = pool.query('SELECT 1').then(() => {
        return;
      });
      return promiseTimeout<void>(DB_CONNECTION_TIMEOUT, check);
    };
  };

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: SERVICES.PG_POOL, provider: { useValue: pool } },
    {
      token: SERVICES.HEALTHCHECK,
      provider: {
        useFactory: instanceCachingFactory((container) => {
          const pool = container.resolve<Pool>(SERVICES.PG_POOL);
          return healthCheck(pool);
        }),
      },
    },
    {
      token: SERVICES.PRISMA,
      provider: {
        useFactory: instancePerContainerCachingFactory((container) => {
          return createPrismaClient(container.resolve(SERVICES.PG_POOL), dbConfig.schema);
        }),
      },
    },
    { token: JOB_ROUTER_SYMBOL, provider: { useFactory: jobRouterFactory } },
    { token: STAGE_ROUTER_SYMBOL, provider: { useFactory: stageRouterFactory } },
    { token: TASK_ROUTER_SYMBOL, provider: { useFactory: taskRouterFactory } },

    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([getTracing().stop()]);
          },
        },
      },
    },
  ];

  return Promise.resolve(registerDependencies(dependencies, options?.override, options?.useChild));
};
