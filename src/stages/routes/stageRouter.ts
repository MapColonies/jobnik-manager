import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { StageController } from '../controllers/stageController';
import { TaskController } from '../../tasks/controllers/taskController';

const stageRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(StageController);
  const taskController = dependencyContainer.resolve(TaskController);

  router.get('/', controller.getStages);
  router.get('/:stageId', controller.getStageById);
  router.get('/:stageId/summary', controller.getSummaryByStageId);
  router.patch('/:stageId/user-metadata', controller.updateUserMetadata);
  router.put('/:stageId/status', controller.updateStatus);
  router.get('/:stageId/tasks', taskController.getTaskByStageId);
  router.post('/:stageId/tasks', taskController.addTasks);
  router.patch('/:stageType/dequeue/tasks', taskController.dequeue);

  return router;
};

export const STAGE_ROUTER_SYMBOL = Symbol('stageRouterFactory');

export { stageRouterFactory };
