import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { JOB_ROUTER_V1_SYMBOL } from './jobs/router';
import { STAGE_ROUTER_V1_SYMBOL } from './stages/router';
import { TASK_ROUTER_V1_SYMBOL } from './tasks/router';

/**
 * V1 API Router Aggregator
 * Aggregates all v1 resource routers under /v1 prefix
 */
export const v1RouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();

  // Resolve v1 routers from DI container with explicit type
  const jobRouter = dependencyContainer.resolve<Router>(JOB_ROUTER_V1_SYMBOL);
  const stageRouter = dependencyContainer.resolve<Router>(STAGE_ROUTER_V1_SYMBOL);
  const taskRouter = dependencyContainer.resolve<Router>(TASK_ROUTER_V1_SYMBOL);

  // Mount under v1 namespace
  router.use('/jobs', jobRouter);
  router.use('/stages', stageRouter);
  router.use('/tasks', taskRouter);

  return router;
};

export const V1_ROUTER_SYMBOL = Symbol('v1RouterFactory');
