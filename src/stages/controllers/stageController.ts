import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { HttpError } from '@map-colonies/error-express-handler';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES, successMessages } from '@common/constants';
import { JobNotFoundError } from '@src/jobs/models/errors';
import { InvalidUpdateError } from '@src/common/errors';
import { StageManager } from '../models/manager';
import type { StageFindCriteriaArg } from '../models/models';
import { StageNotFoundError } from '../models/errors';

@injectable()
export class StageController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(StageManager) private readonly manager: StageManager
  ) {}

  public getStages: TypedRequestHandlers['GET /stages'] = async (req, res, next) => {
    const params: StageFindCriteriaArg = req.query;
    try {
      const response = await this.manager.getStages(params);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      this.logger.error(`Error occurred on getting stage with error`, err);
      next(err);
    }
  };

  public getStageById: TypedRequestHandlers['GET /stages/{stageId}'] = async (req, res, next) => {
    try {
      const response = await this.manager.getStageById(req.params.stageId);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof StageNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };

  public getStagesByJobId: TypedRequestHandlers['GET /jobs/{jobId}/stages'] = async (req, res, next) => {
    try {
      const response = await this.manager.getStagesByJobId(req.params.jobId);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }
      next(err);
    }
  };

  public addStages: TypedRequestHandlers['POST /jobs/{jobId}/stages'] = async (req, res, next) => {
    try {
      const response = await this.manager.addStages(req.params.jobId, req.body);

      return res.status(httpStatus.CREATED).json(response);
    } catch (err) {
      if (err instanceof JobNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      if (err instanceof InvalidUpdateError) {
        (err as HttpError).status = httpStatus.BAD_REQUEST;
      }

      return next(err);
    }
  };

  public getSummaryByStageId: TypedRequestHandlers['GET /stages/{stageId}'] = async (req, res, next) => {
    try {
      const response = await this.manager.getSummaryByStageId(req.params.stageId);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof StageNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };

  public updateUserMetadata: TypedRequestHandlers['PATCH /stages/{stageId}/user-metadata'] = async (req, res, next) => {
    try {
      await this.manager.updateUserMetadata(req.params.stageId, req.body);
      return res.status(httpStatus.OK).json({ code: successMessages.stageModifiedSuccessfully });
    } catch (err) {
      if (err instanceof StageNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };

  public updateStatus: TypedRequestHandlers['PUT /stages/{stageId}/status'] = async (req, res, next) => {
    try {
      await this.manager.updateStatus(req.params.stageId, req.body.status);

      return res.status(httpStatus.OK).json({ code: successMessages.stageModifiedSuccessfully });
    } catch (err) {
      if (err instanceof StageNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      } else if (err instanceof InvalidUpdateError) {
        (err as HttpError).status = httpStatus.BAD_REQUEST;
        this.logger.error({ msg: `Stage status update failed: invalid status transition`, status: req.body.status, err });
      }

      return next(err);
    }
  };
}
