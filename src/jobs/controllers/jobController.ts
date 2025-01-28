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
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(JobManager) private readonly manager: JobManager
  ) {}

  public getJobs: TypedRequestHandlers['GET /jobs'] = async (req, res, next) => {
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
    try {
      const response = await this.manager.createJob(req.body);
      return res.status(httpStatus.CREATED).json(response);
    } catch (err) {
      this.logger.error(`Error occurred on creating new job with error`, err);
      return next(err);
    }
  };
}
