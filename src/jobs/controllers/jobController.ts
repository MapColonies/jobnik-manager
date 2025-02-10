import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '@common/constants';
import type { TypedRequestHandlers } from '@openapi';
import { HttpError } from '@map-colonies/error-express-handler';
import { JobManager } from '../models/jobManager';
import type { JobFindCriteriaArg } from '../models/models';
import { JobNotFoundError } from '../models/errors';

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

  public getJobById: TypedRequestHandlers['GET /jobs/{jobId}'] = async (req, res, next) => {
    try {
      const response = await this.manager.getJobById(req.params.jobId);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };

  public updateUserMetadata: TypedRequestHandlers['PATCH /jobs/{jobId}/user-metadata'] = async (req, res, next) => {
    try {
      await this.manager.updateUserMetadata(req.params.jobId, req.body);
      return res.status(httpStatus.OK).json({ code: 'JOB_MODIFIED_SUCCESSFULLY' });
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };

  public updateJobPriority: TypedRequestHandlers['PATCH /jobs/{jobId}/priority'] = async (req, res, next) => {
    try {
      await this.manager.updatePriority(req.params.jobId, req.body.priority);
      return res.status(httpStatus.OK).json({ code: 'JOB_MODIFIED_SUCCESSFULLY' });
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };

  public updateStatus: TypedRequestHandlers['PUT /jobs/{jobId}/status'] = async (req, res, next) => {
    try {
      await this.manager.updateStatus(req.params.jobId, req.body.status);
      return res.status(httpStatus.OK).json({ code: 'JOB_MODIFIED_SUCCESSFULLY' });
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };
}
