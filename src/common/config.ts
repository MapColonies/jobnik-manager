import 'reflect-metadata';
import { type ConfigInstance, config } from '@map-colonies/config';
import { infraJobnikManagerV1, type infraJobnikManagerV1Type } from '@map-colonies/schemas';
import { container } from 'tsyringe';
import type { HealthCheckManager } from '@map-colonies/health-check';
import type { Logger } from '@map-colonies/js-logger';
import { SERVICES } from './constants';

// Choose here the type of the config instance and import this type from the entire application
type ConfigType = ConfigInstance<infraJobnikManagerV1Type>;

let configInstance: ConfigType | undefined;

/**
 * Initializes the configuration by fetching it from the server.
 * This should only be called from the instrumentation file.
 * @returns A Promise that resolves when the configuration is successfully initialized.
 */
async function initConfig(offlineMode?: boolean): Promise<void> {
  const terminatePod = process.env.TERMINATE_POD !== 'false';

  configInstance = await config({
    configName: 'infra-jobnik-manager',
    terminatePod,
    schema: infraJobnikManagerV1,
    offlineMode: offlineMode,
    pollIntervalMs: 1000,
    async onChange() {
      const logger = container.resolve<Logger>(SERVICES.LOGGER);

      if (!container.isRegistered(SERVICES.HEALTHCHECK)) {
        logger.warn('Configuration changed, but healthcheck manager is not yet registered.');
        return;
      }
      const readinessManager = container.resolve<HealthCheckManager>(SERVICES.HEALTHCHECK);

      logger.info('Configuration changed! Blocking readiness and waiting for active requests to finish.');
      readinessManager.setReady(false);

      await readinessManager.waitUntilZeroActiveRequests();

      logger.info('All active requests finished.');

      if (terminatePod) {
        logger.info('Triggering graceful shutdown...');
        process.kill(process.pid, 'SIGTERM');
      } else {
        logger.info('Applying new configuration locally and restoring readiness...');

        // Handle local hot reload logic here

        readinessManager.setReady(true);
      }
    },
  });
}

function getConfig(): ConfigType {
  /* v8 ignore next 3 -- @preserve */
  if (!configInstance) {
    throw new Error('config not initialized');
  }
  return configInstance;
}

export { getConfig, initConfig };
export type { ConfigType };
