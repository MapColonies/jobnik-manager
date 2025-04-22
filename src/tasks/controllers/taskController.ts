import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { HttpError } from '@map-colonies/error-express-handler';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES, successMessages } from '@common/constants';
import { StageNotFoundError } from '@src/stages/models/errors';
import { TaskManager } from '../models/manager';
import { type TasksFindCriteriaArg } from '../models/models';
import { TaskNotFoundError } from '../models/errors';

@injectable()
export class TaskController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(TaskManager) private readonly manager: TaskManager
  ) {}

  public getTasks: TypedRequestHandlers['GET /tasks'] = async (req, res, next) => {
    const params: TasksFindCriteriaArg = req.query;
    try {
      const response = await this.manager.getTasks(params);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      this.logger.error(`Error occurred on getting tasks with error`, err);
      next(err);
    }
  };

  public getTaskById: TypedRequestHandlers['GET /tasks/{taskId}'] = async (req, res, next) => {
    try {
      const response = await this.manager.getTaskById(req.params.taskId);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof TaskNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };

  public getTaskByStageId: TypedRequestHandlers['GET /stages/{stageId}/tasks'] = async (req, res, next) => {
    try {
      const response = await this.manager.getTasksByStageId(req.params.stageId);
      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof StageNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }
      next(err);
    }
  };

  public updateUserMetadata: TypedRequestHandlers['PATCH /tasks/{taskId}/user-metadata'] = async (req, res, next) => {
    try {
      await this.manager.updateUserMetadata(req.params.taskId, req.body);
      return res.status(httpStatus.OK).json({ code: successMessages.taskModifiedSuccessfully });
    } catch (err) {
      if (err instanceof TaskNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      return next(err);
    }
  };
}
