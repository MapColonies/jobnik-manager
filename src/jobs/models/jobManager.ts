import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { components } from '@src/openapi';
import { SERVICES } from '@common/constants';

const jobInstance: IJobModel = {
  type: 'Tile-Export',
  creator: 'vv',
  data: {},
  id: '37e0d875-7023-4a13-8733-9e19f7fa09fb',
  creationTime: '2025-01-16 08:11:08.051',
  expirationTime: '2025-01-16 08:11:08.051',
  notifications: {},
  percentage: 0,
  priority: 'High',
  status: 'Aborted',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TTL: '2025-01-16 08:11:08.051',
  updateTime: '2025-01-16 08:11:08.051',
  userMetadata: {},
};

const jobCreateInstance: IJobCreateResponse = {
  id: '37e0d875-7023-4a13-8733-9e19f7fa09fb',
  taskIds: undefined,
};

export type IJobModel = components['schemas']['jobResponse'];
export type IJobCreateModel = components['schemas']['createJobPayload'];
export type IJobCreateResponse = components['schemas']['createJobResponse'];

@injectable()
export class JobManager {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}
  public getJobs(): IJobModel[] {
    this.logger.info('logging');
    return [jobInstance];
  }

  public createJob(body: IJobCreateModel): IJobCreateResponse {
    this.logger.info(body);
    return jobCreateInstance;
  }
}
