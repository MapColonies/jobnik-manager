import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { JobController } from '../controllers/jobController';

const jobRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(JobController);

  router.get('/', controller.getJobs);
  router.post('/', controller.createJob);
  return router;
};

export const JOB_ROUTER_SYMBOL = Symbol('jobRouterFactory');

export { jobRouterFactory };
