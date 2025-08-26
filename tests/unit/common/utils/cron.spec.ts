import { validate, createTask, type ScheduledTask } from 'node-cron';
import { getTaskReleaserCron } from '@src/common/utils/cron';
import { type TaskReleaser } from '@src/tasks/models/taskReleaser';
import { type CronConfig } from '@src/common/config';

// Mock node-cron module
jest.mock('node-cron');

const mockValidate = jest.mocked(validate);
const mockCreateTask = jest.mocked(createTask);

// Helper function to extract task function from mock call
const getTaskFunction = (): (() => Promise<void>) => {
  const mockCall = mockCreateTask.mock.calls[0];
  expect(mockCall).toBeDefined();
  const taskFn = mockCall?.[1];
  expect(typeof taskFn).toBe('function');
  return taskFn as () => Promise<void>;
};

describe('cron utilities', () => {
  const mockTaskReleaser: TaskReleaser = {
    cleanStaleTasks: jest.fn(),
  } as unknown as TaskReleaser;

  const validCronConfig: CronConfig = {
    enabled: true,
    schedule: '*/5 * * * *',
    timeDeltaPeriodInMinutes: 30,
  };

  const mockScheduledTask: ScheduledTask = {
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    getStatus: jest.fn(),
  } as unknown as ScheduledTask;

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidate.mockReturnValue(true);
    mockCreateTask.mockReturnValue(mockScheduledTask);
  });

  describe('#getTaskReleaserCron', () => {
    describe('HappyPath', () => {
      it('should create a scheduled task with valid configuration', () => {
        const result = getTaskReleaserCron(validCronConfig, mockTaskReleaser);

        expect(mockValidate).toHaveBeenCalledWith(validCronConfig.schedule);
        expect(mockCreateTask).toHaveBeenCalledWith(validCronConfig.schedule, expect.any(Function), {
          name: 'task-releaser',
          noOverlap: true,
        });
        expect(result).toBe(mockScheduledTask);
      });

      it('should create task with correct schedule pattern', () => {
        const schedules = [
          '*/5 * * * *', // Every 5 minutes
          '0 */2 * * *', // Every 2 hours
          '0 0 * * *', // Daily at midnight
          '0 0 * * 0', // Weekly on Sunday
        ];

        for (const schedule of schedules) {
          const config: CronConfig = {
            ...validCronConfig,
            schedule,
          };

          getTaskReleaserCron(config, mockTaskReleaser);

          expect(mockCreateTask).toHaveBeenCalledWith(
            schedule,
            expect.any(Function),
            expect.objectContaining({
              name: 'task-releaser',
              noOverlap: true,
            })
          );
        }
      });

      it('should handle different time delta periods correctly', async () => {
        const timePeriods = [15, 30, 60, 120, 1440]; // 15 min, 30 min, 1 hour, 2 hours, 1 day

        for (const timeDeltaPeriodInMinutes of timePeriods) {
          const config: CronConfig = {
            ...validCronConfig,
            timeDeltaPeriodInMinutes,
          };

          const cleanStaleTasksMock = jest.fn().mockResolvedValue(undefined);
          const taskReleaser = {
            cleanStaleTasks: cleanStaleTasksMock,
          } as unknown as TaskReleaser;

          // Clear previous mock calls
          jest.clearAllMocks();
          mockValidate.mockReturnValue(true);
          mockCreateTask.mockReturnValue(mockScheduledTask);

          getTaskReleaserCron(config, taskReleaser);

          // Execute the task function
          const taskFunction = getTaskFunction();
          await taskFunction();

          expect(cleanStaleTasksMock).toHaveBeenCalledWith(config);
        }
      });
    });

    describe('SadPath', () => {
      it('should throw error when cron schedule is invalid', () => {
        const invalidConfig: CronConfig = {
          ...validCronConfig,
          schedule: 'invalid-cron-expression',
        };

        mockValidate.mockReturnValue(false);

        expect(() => getTaskReleaserCron(invalidConfig, mockTaskReleaser)).toThrow('Invalid cron schedule: invalid-cron-expression');
      });

      it('should throw error for malformed cron expressions', () => {
        const invalidSchedules = [
          '', // Empty string
          '* * * *', // Missing field
          '60 * * * *', // Invalid minute (60)
          '* 25 * * *', // Invalid hour (25)
          '* * 32 * *', // Invalid day of month (32)
          '* * * 13 *', // Invalid month (13)
          '* * * * 8', // Invalid day of week (8)
          'not-a-cron-expression',
          '*/61 * * * *', // Invalid step value
        ];

        mockValidate.mockReturnValue(false);

        for (const schedule of invalidSchedules) {
          const config: CronConfig = {
            ...validCronConfig,
            schedule,
          };

          expect(() => getTaskReleaserCron(config, mockTaskReleaser)).toThrow(`Invalid cron schedule: ${schedule}`);
        }
      });
    });

    describe('Configuration Validation', () => {
      it('should handle configuration with different enabled states', () => {
        const configs = [
          { ...validCronConfig, enabled: true },
          { ...validCronConfig, enabled: false },
        ];

        for (const config of configs) {
          expect(() => getTaskReleaserCron(config, mockTaskReleaser)).not.toThrow();
        }
      });

      it('should handle various valid cron expressions', () => {
        const validSchedules = [
          '0 */6 * * *', // Every 6 hours
          '30 2 * * *', // Daily at 2:30 AM
          '0 0 1 * *', // First day of every month
          '0 0 * * 1', // Every Monday
          '*/15 9-17 * * 1-5', // Every 15 minutes during business hours on weekdays
        ];

        for (const schedule of validSchedules) {
          const config: CronConfig = {
            ...validCronConfig,
            schedule,
          };

          expect(() => getTaskReleaserCron(config, mockTaskReleaser)).not.toThrow();
        }
      });

      it('should handle edge cases for time delta periods', () => {
        const timePeriods = [
          1, // 1 minute
          59, // 59 minutes
          60, // 1 hour
          1439, // 23 hours 59 minutes
          1440, // 24 hours
          10080, // 1 week
        ];

        for (const timeDeltaPeriodInMinutes of timePeriods) {
          const config: CronConfig = {
            ...validCronConfig,
            timeDeltaPeriodInMinutes,
          };

          expect(() => getTaskReleaserCron(config, mockTaskReleaser)).not.toThrow();
        }
      });
    });
  });

  describe('CronConfig interface', () => {
    it('should accept valid configuration objects', () => {
      const validConfigs: CronConfig[] = [
        {
          enabled: true,
          schedule: '*/5 * * * *',
          timeDeltaPeriodInMinutes: 30,
        },
        {
          enabled: false,
          schedule: '0 0 * * *',
          timeDeltaPeriodInMinutes: 60,
        },
      ];

      for (const config of validConfigs) {
        expect(() => getTaskReleaserCron(config, mockTaskReleaser)).not.toThrow();
      }
    });
  });
});
