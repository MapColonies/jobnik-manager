import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { JobController } from '../controllers/jobController';

const jobRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(JobController);

  router.get('/', controller.getJobs);
  router.post('/', controller.createJob);
  router.get('/:jobId', controller.getJobById);
  router.patch('/:jobId/user-metadata', controller.updateUserMetadata);
  router.patch('/:jobId/priority', controller.updateJobPriority);
  router.put('/:jobId/status', controller.updateStatus);
  return router;
};

export const JOB_ROUTER_SYMBOL = Symbol('jobRouterFactory');

export { jobRouterFactory };
