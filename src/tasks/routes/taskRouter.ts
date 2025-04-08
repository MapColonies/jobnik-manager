import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { TaskController } from '../controllers/taskController';

const taskRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(TaskController);

  router.get('/', controller.getTasks);
  router.get('/:taskId', controller.getTaskById);
  router.patch('/:taskId/user-metadata', controller.updateUserMetadata);

  return router;
};

export const TASK_ROUTER_SYMBOL = Symbol('taskRouterFactory');

export { taskRouterFactory };
