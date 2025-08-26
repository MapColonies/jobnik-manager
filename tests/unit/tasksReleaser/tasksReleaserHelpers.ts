import { type CronConfig } from '@src/common/config';

const MILLISECONDS_IN_A_SECOND = 1000;
const MINUTES_IN_SECONDS = 60;

export const createCronConfig = (overrides: Partial<CronConfig> = {}): CronConfig => ({
  enabled: true,
  schedule: '*/5 * * * *',
  timeDeltaPeriodInMinutes: 30,
  ...overrides,
});

/**
 * Creates a timestamp for a stale task (older than the cleanup threshold)
 * @param minutesAgo - How many minutes ago the task started
 * @param thresholdMinutes - The cleanup threshold in minutes (defaults to 30)
 * @returns Date representing when a stale task started
 */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const createStaleTaskStartTime = (minutesAgo: number, thresholdMinutes: number = 30): Date => {
  const effectiveMinutesAgo = Math.max(minutesAgo, thresholdMinutes + 1);
  return new Date(Date.now() - effectiveMinutesAgo * MINUTES_IN_SECONDS * MILLISECONDS_IN_A_SECOND);
};

/**
 * Creates a timestamp for a fresh task (newer than the cleanup threshold)
 * @param minutesAgo - How many minutes ago the task started
 * @param thresholdMinutes - The cleanup threshold in minutes (defaults to 30)
 * @returns Date representing when a fresh task started
 */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const createFreshTaskStartTime = (minutesAgo: number, thresholdMinutes: number = 30): Date => {
  const effectiveMinutesAgo = Math.min(minutesAgo, thresholdMinutes - 1);
  return new Date(Date.now() - effectiveMinutesAgo * MINUTES_IN_SECONDS * MILLISECONDS_IN_A_SECOND);
};
