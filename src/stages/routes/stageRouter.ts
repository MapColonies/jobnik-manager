import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { StageController } from '../controllers/stageController';

const stageRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(StageController);

  router.get('/', controller.getStages);
  router.get('/:stageId', controller.getStageById);
  router.get('/:stageId/summary', controller.getSummaryByStageId);
  router.patch('/:stageId/user-metadata', controller.updateUserMetadata);
  router.put('/:stageId/status', controller.updateStatus);

  return router;
};

export const STAGE_ROUTER_SYMBOL = Symbol('stageRouterFactory');

export { stageRouterFactory };
