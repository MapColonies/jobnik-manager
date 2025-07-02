import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { JobController } from '../controllers/jobController';
import { StageController } from '../../stages/controllers/stageController';

const jobRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(JobController);
  const stageController = dependencyContainer.resolve(StageController);

  router.get('/', controller.getJobs);
  router.post('/', controller.createJob);
  router.get('/:jobId', controller.getJobById);
  router.delete('/:jobId', controller.deleteJob);
  router.patch('/:jobId/user-metadata', controller.updateUserMetadata);
  router.patch('/:jobId/priority', controller.updateJobPriority);
  router.put('/:jobId/status', controller.updateStatus);
  router.get('/:jobId/stages', stageController.getStagesByJobId);
  router.post('/:jobId/stage', stageController.addStage);
  return router;
};

export const JOB_ROUTER_SYMBOL = Symbol('jobRouterFactory');

export { jobRouterFactory };
