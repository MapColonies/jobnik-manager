import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { StageController } from '../controllers/stageController';

const stageRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(StageController);

  router.get('/', controller.getStages);
  router.get('/:stageId', controller.getStageById);
  router.get('/:stageId/summary', controller.getSummaryByStageId);
  router.get('/job/:jobId', controller.getStagesByJobId);
  router.patch('/:stageId/user-metadata', controller.updateUserMetadata);

  return router;
};

export const STAGE_ROUTER_SYMBOL = Symbol('stageRouterFactory');

export { stageRouterFactory };
