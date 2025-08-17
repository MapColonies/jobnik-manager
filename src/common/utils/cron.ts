import { createTask, validate } from 'node-cron';

import type { ScheduledTask } from 'node-cron';
import type { TaskReleaser } from '@src/tasks/models/taskReleaser';

export function getTaskReleaserCron(cronConfig: CronConfig, taskReleaser: TaskReleaser): ScheduledTask {
  if (!validate(cronConfig.schedule)) {
    throw new Error(`Invalid cron schedule: ${cronConfig.schedule}`);
  }

  const task = createTask(
    cronConfig.schedule,
    async () => {
      await taskReleaser.cleanStaleTasks(cronConfig);
    },
    {
      name: 'task-releaser',
      noOverlap: true,
    }
  );

  return task;
}

// todo - temporary until will be integrated with config server
export interface CronConfig {
  readonly enabled: boolean;
  readonly schedule: string;
  readonly timeDeltaPeriodInMinutes: number;
}
