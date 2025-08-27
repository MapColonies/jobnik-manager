import type { CronConfig } from '@src/common/utils/cron';

export const createCronConfig = (overrides: Partial<CronConfig> = {}): CronConfig => ({
  enabled: true,
  schedule: '*/5 * * * *',
  timeDeltaPeriodInMinutes: 30,
  ...overrides,
});
