import { Logger } from '@map-colonies/js-logger';
import client, { Registry } from 'prom-client';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '@common/constants';
import type { TypedRequestHandlers } from '@openapi';
import { JobManager } from '../models/jobManager';
import { JobFindCriteriaArg } from '../repositories/jobRepository';

@injectable()
export class JobController {
  private readonly getJobsCounter: client.Counter;
  private readonly createJobCounter: client.Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(JobManager) private readonly manager: JobManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    this.getJobsCounter = new client.Counter({
      name: 'get_jobs',
      help: 'number of get jobs requests',
      registers: [this.metricsRegistry],
    });

    this.createJobCounter = new client.Counter({
      name: 'create_job',
      help: 'number of create jobs requests',
      registers: [this.metricsRegistry],
    });
  }

  public getJobs: TypedRequestHandlers['GET /jobs'] = async (req, res, next) => {
    this.getJobsCounter.inc(1);
    const params: JobFindCriteriaArg = req.query;
    try {
      const response = await this.manager.getJobs(params);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      this.logger.error(`Error occurred on getting job with error`, err);
      next(err);
    }
  };

  public createJob: TypedRequestHandlers['POST /jobs'] = async (req, res, next) => {
    this.createJobCounter.inc(1);
    try {
      const response = await this.manager.createJob(req.body);
      return res.status(httpStatus.CREATED).json(response);
    } catch (err) {
      this.logger.error(`Error occurred on creating new job with error`, err);
      return next(err);
    }
  };
}
