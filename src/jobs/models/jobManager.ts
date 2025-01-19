import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { components } from '@src/openapi';
import { SERVICES } from '@common/constants';
import { PrismaClient, Prisma } from '@prisma/client';

// todo - temporally for development
const jobInstance: IJobModel = {
  type: 'PRE_DEFINED',
  creator: 'UNKNOWN',
  data: {},
  id: '37e0d875-7023-4a13-8733-9e19f7fa09fb',
  creationTime: '2025-01-16 08:11:08.051',
  expirationTime: '2025-01-16 08:11:08.051',
  notifications: {},
  percentage: 0,
  priority: 'HIGH',
  status: 'ABORTED',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TTL: '2025-01-16 08:11:08.051',
  updateTime: '2025-01-16 08:11:08.051',
  userMetadata: {},
};

// todo - temporally for development
const jobCreateInstance: IJobCreateResponse = {
  id: '37e0d875-7023-4a13-8733-9e19f7fa09fb',
  taskIds: undefined,
};

export type IJobModel = components['schemas']['jobResponse'];
export type IJobCreateModel = components['schemas']['createJobPayload'];
export type IJobCreateResponse = components['schemas']['createJobResponse'];
export type IJobGetParams = components['parameters'];

@injectable()
export class JobManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient
  ) {}

  public async getJobs(params: IJobGetParams): Promise<IJobModel[]> {
    await this.prisma.job.findMany({
      where: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AND: {
          type: { equals: params.jmode },
        },
      },
    });
    this.logger.info('logging');
    // console.log(parameters)
    return [jobInstance];
  }

  public async createJob(body: IJobCreateModel): Promise<IJobCreateResponse> {
    try {
      const res: IJobCreateResponse = await this.prisma.job.create({ data: body });
      // todo - will added logic that extract stages on predefined and generated also stages + tasks
      this.logger.debug('Created new job successfully', body);
      return res;
    } catch (error) {
      this.logger.error(`Failed creating job with error: ${(error as Error).message}`);
      throw error;
    }
  }
}
