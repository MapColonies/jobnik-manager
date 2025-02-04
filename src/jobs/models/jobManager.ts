import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '@common/constants';
import { PrismaClient, Prisma } from '@prisma/client';
import { IJobCreateModel, IJobCreateResponse, IJobModel, JobFindCriteriaArg } from './models';

@injectable()
export class JobManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRISMA) private readonly prisma: PrismaClient
  ) {}

  public async getJobs(params: JobFindCriteriaArg): Promise<IJobModel[]> {
    let queryBody = undefined;
    if (params !== undefined) {
      queryBody = {
        where: {
          AND: {
            type: { equals: params.job_mode },
            name: { equals: params.job_name },
            priority: { equals: params.priority },
            creator: { equals: params.creator },
            creationTime: { gte: params.from_date, lte: params.till_date },
          },
        },
      };
    }

    const jobs = await this.prisma.job.findMany(queryBody);
    const result = jobs.map((job) => this.convertPrismaToJobResponse(job));
    return result;
  }

  public async createJob(body: IJobCreateModel): Promise<IJobCreateResponse> {
    try {
      const input: Prisma.JobCreateInput = { data: body.data };
      const res = this.convertPrismaToJobResponse(await this.prisma.job.create({ data: input }));

      // todo - will added logic that extract stages on predefined and generated also stages + tasks
      this.logger.debug({ msg: 'Created new job successfully', response: res });
      return res;
    } catch (error) {
      this.logger.error(`Failed creating job with error: ${(error as Error).message}`);
      throw error;
    }
  }

  private convertPrismaToJobResponse(prismaObjects: Prisma.JobGetPayload<Record<string, never>>): IJobModel {
    const jobObject: IJobModel = {
      type: prismaObjects.type,
      creator: prismaObjects.creator,
      data: prismaObjects.data as Record<string, never>,
      id: prismaObjects.id,
      creationTime: prismaObjects.creationTime.toISOString(),
      userMetadata: prismaObjects.userMetadata as Record<string, never>,
      expirationTime: prismaObjects.expirationTime ? prismaObjects.expirationTime.toISOString() : undefined,
      name: prismaObjects.name,
      notifications: prismaObjects.notifications as Record<string, never>,
      percentage: prismaObjects.percentage,
      updateTime: prismaObjects.updateTime.toISOString(),
      priority: prismaObjects.priority,
      status: prismaObjects.status,
      ttl: prismaObjects.ttl ? prismaObjects.ttl.toISOString() : undefined,
    };

    return jobObject;
  }
}
