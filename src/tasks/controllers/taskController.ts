import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { HttpError } from '@map-colonies/error-express-handler';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES, successMessages } from '@common/constants';
import {
  IllegalJobStatusTransitionError,
  IllegalStageStatusTransitionError,
  IllegalTaskStatusTransitionError,
  JobNotFoundError,
  NotAllowedToAddTasksToInProgressStageError,
  StageInFiniteStateError,
  StageNotFoundError,
  TaskStatusUpdateFailedError,
  TaskNotFoundError,
} from '@src/common/generated/errors';
import { TaskManager } from '../models/manager';
import { type TasksFindCriteriaArg } from '../models/models';

/*
 * Checks if the error is a bad request error
 */
const isBadRequestError = (err: unknown): boolean => {
  return (
    err instanceof TaskStatusUpdateFailedError ||
    err instanceof IllegalTaskStatusTransitionError ||
    err instanceof IllegalStageStatusTransitionError ||
    err instanceof IllegalJobStatusTransitionError ||
    err instanceof JobNotFoundError ||
    err instanceof StageNotFoundError
  );
};

/*
 * Checks if the error is a internal error
 */
const isInternalError = (err: unknown): boolean => {
  return (
    err instanceof TaskStatusUpdateFailedError ||
    err instanceof IllegalTaskStatusTransitionError ||
    err instanceof IllegalStageStatusTransitionError ||
    err instanceof IllegalJobStatusTransitionError ||
    err instanceof JobNotFoundError ||
    err instanceof StageNotFoundError
  );
};
@injectable()
export class TaskController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(TaskManager) private readonly manager: TaskManager
  ) {}

  public addTasks: TypedRequestHandlers['POST /stages/{stageId}/tasks'] = async (req, res, next) => {
    try {
      const response = await this.manager.addTasks(req.params.stageId, req.body);

      return res.status(httpStatus.CREATED).json(response);
    } catch (err) {
      if (err instanceof StageNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      }

      if (err instanceof NotAllowedToAddTasksToInProgressStageError || err instanceof StageInFiniteStateError) {
        (err as HttpError).status = httpStatus.BAD_REQUEST;
      }

      return next(err);
    }
  };

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

  public updateStatus: TypedRequestHandlers['PUT /tasks/{taskId}/status'] = async (req, res, next) => {
    try {
      const response = await this.manager.updateStatus(req.params.taskId, req.body.status);

      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof TaskNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      } else if (isBadRequestError(err)) {
        (err as HttpError).status = httpStatus.BAD_REQUEST;
        this.logger.error({ msg: `Task status update failed: invalid status transition`, status: req.body.status, err });
      }

      return next(err);
    }
  };

  public dequeue: TypedRequestHandlers['PATCH /stages/{stageType}/tasks/dequeue'] = async (req, res, next) => {
    try {
      const response = await this.manager.dequeue(req.params.stageType);

      return res.status(httpStatus.OK).json(response);
    } catch (err) {
      if (err instanceof TaskNotFoundError) {
        (err as HttpError).status = httpStatus.NOT_FOUND;
      } else if (isInternalError(err)) {
        (err as HttpError).status = httpStatus.INTERNAL_SERVER_ERROR;
      }

      return next(err);
    }
  };
}
