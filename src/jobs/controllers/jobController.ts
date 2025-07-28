import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { HttpError } from '@map-colonies/error-express-handler';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES, successMessages } from '@common/constants';
import { InvalidDeletionError, InvalidUpdateError } from '@common/errors';
import { JobManager } from '../models/manager';
import { type JobFindCriteriaArg } from '../models/models';
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
      const includeStages: boolean | undefined = req.query?.should_return_stages ?? false;

      const response = await this.manager.getJobById(req.params.jobId, includeStages);

      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
        this.logger.error({ msg: `Current job not found`, jobId: req.params.jobId, err });
      }

      return next(err);
    }
  };

  public updateUserMetadata: TypedRequestHandlers['PATCH /jobs/{jobId}/user-metadata'] = async (req, res, next) => {
    try {
      await this.manager.updateUserMetadata(req.params.jobId, req.body);

      return res.status(httpStatus.OK).json({ code: successMessages.jobModifiedSuccessfully });
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
        this.logger.error({ msg: `Job metadata update request failed: job with provided ID not found`, jobId: req.params.jobId, err });
      }

      return next(err);
    }
  };

  public updateJobPriority: TypedRequestHandlers['PATCH /jobs/{jobId}/priority'] = async (req, res, next) => {
    try {
      await this.manager.updatePriority(req.params.jobId, req.body.priority);
      return res.status(httpStatus.OK).json({ code: successMessages.jobModifiedSuccessfully });
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      } else if (err instanceof InvalidUpdateError) {
        this.logger.error({
          msg: `Job priority update failed: the priority entered is already assigned to the job`,
          priority: req.body.priority,
          err,
        });
        return res.status(httpStatus.NO_CONTENT).header('Reason', err.message).end();
      }

      return next(err);
    }
  };

  public updateStatus: TypedRequestHandlers['PUT /jobs/{jobId}/status'] = async (req, res, next) => {
    try {
      await this.manager.updateStatus(req.params.jobId, req.body.status);

      return res.status(httpStatus.OK).json({ code: successMessages.jobModifiedSuccessfully });
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      } else if (err instanceof InvalidUpdateError) {
        (err as HttpError).status = httpStatus.BAD_REQUEST;
        this.logger.error({ msg: `Job status update failed: invalid status transition`, status: req.body.status, err });
      }

      return next(err);
    }
  };

  public deleteJob: TypedRequestHandlers['DELETE /jobs/{jobId}'] = async (req, res, next) => {
    try {
      await this.manager.deleteJob(req.params.jobId);

      return res.status(httpStatus.OK).json({ code: successMessages.jobDeletedSuccessfully });
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      } else if (err instanceof InvalidDeletionError) {
        (err as HttpError).status = httpStatus.BAD_REQUEST;
      }

      return next(err);
    }
  };
}
