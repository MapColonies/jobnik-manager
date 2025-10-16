import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Histogram } from 'prom-client';
import type { Registry } from 'prom-client';
import { JobOperationStatus, type Priority } from '@prismaClient';
import { SERVICES } from '@common/constants';

// Histogram bucket constants for job processing duration (in seconds)
const BUCKET_100_MS = 0.1;
const BUCKET_1_SEC = 1;
const BUCKET_5_SEC = 5;
const BUCKET_10_SEC = 10;
const BUCKET_30_SEC = 30;
const BUCKET_1_MIN = 60;
const BUCKET_5_MIN = 300;
const BUCKET_10_MIN = 600;
const BUCKET_30_MIN = 1800;
const BUCKET_1_HOUR = 3600;
const BUCKET_2_HOURS = 7200;
const BUCKET_4_HOURS = 14400;
const BUCKET_8_HOURS = 28800;
const BUCKET_24_HOURS = 86400;

const JOB_PROCESSING_DURATION_BUCKETS = [
  BUCKET_100_MS,
  BUCKET_1_SEC,
  BUCKET_5_SEC,
  BUCKET_10_SEC,
  BUCKET_30_SEC,
  BUCKET_1_MIN,
  BUCKET_5_MIN,
  BUCKET_10_MIN,
  BUCKET_30_MIN,
  BUCKET_1_HOUR,
  BUCKET_2_HOURS,
  BUCKET_4_HOURS,
  BUCKET_8_HOURS,
  BUCKET_24_HOURS,
];

/**
 * Job metrics manager for tracking job activity and performance per pod
 */
@injectable()
export class JobMetrics {
  private readonly jobProcessingDurationHistogram: Histogram;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    // Histogram for job processing duration (time between status changes)
    // This also provides a _count metric that can be used for tracking activity
    const existingHistogram = this.metricsRegistry.getSingleMetric('jobnik_job_processing_duration_seconds');
    if (!existingHistogram) {
      this.jobProcessingDurationHistogram = new Histogram({
        name: 'jobnik_job_processing_duration_seconds',
        help: 'Time in seconds for job processing between status transitions',
        labelNames: ['job_name', 'priority', 'from_status', 'to_status'],
        buckets: JOB_PROCESSING_DURATION_BUCKETS,
        registers: [this.metricsRegistry],
      });
    } else {
      this.jobProcessingDurationHistogram = existingHistogram as Histogram;
    }

    /* istanbul ignore next */
  }

  /**
   * Records job processing duration metrics
   * @param jobName - The name of the job
   * @param fromStatus - The previous status
   * @param toStatus - The new status
   * @param priority - The job priority
   * @param processingDurationSeconds - Time spent in the previous status (required for histogram)
   */
  /* istanbul ignore next */
  public recordJobStatusTransition(
    jobName: string,
    fromStatus: JobOperationStatus,
    toStatus: JobOperationStatus,
    priority: Priority,
    processingDurationSeconds: number
  ): void {
    /* istanbul ignore next */
    try {
      const labels = {
        job_name: jobName, // eslint-disable-line @typescript-eslint/naming-convention
        priority,
        from_status: fromStatus, // eslint-disable-line @typescript-eslint/naming-convention
        to_status: toStatus, // eslint-disable-line @typescript-eslint/naming-convention
      };

      // Record processing duration (this also increments the _count metric)
      this.jobProcessingDurationHistogram.observe(labels, processingDurationSeconds);

      this.logger.debug({
        msg: 'Job processing duration metric recorded successfully',
        jobName,
        priority,
        fromStatus,
        toStatus,
        processingDurationSeconds,
      });
    } catch (error) {
      /* istanbul ignore next */
      this.logger.warn({
        msg: 'Failed to record job processing duration metric',
        jobName,
        priority,
        fromStatus,
        toStatus,
        processingDurationSeconds,
        error,
      });
    }
  }
}
