import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { paths, operations } from '@openapi';
import { initConfig } from '@src/common/config';
import { Creator, JobMode, JobName, PrismaClient } from '@prisma/client';
import { instancePerContainerCachingFactory } from 'tsyringe';
import { createPrismaClient } from '@src/db/createConnection';

describe('job', function () {
  let requestSender: RequestSender<paths, operations>;
  let prisma: PrismaClient;

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    const [app, container] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        {
          token: SERVICES.PRISMA,
          provider: {
            useFactory: instancePerContainerCachingFactory((container) => {
              return createPrismaClient(container.resolve(SERVICES.PG_POOL), 'job_manager');
            }),
          },
        },
      ],
      useChild: true,
    });
    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
    prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  });
  describe('Happy Path', function () {
    it('should return 200 status code and the job', async function () {
      const requestBody = {
        name: 'DEFAULT' as JobName,
        creator: 'UNKNOWN' as Creator,
        data: { stages: [] },
        type: 'PRE_DEFINED' as JobMode,
        notifications: {},
        userMetadata: {},
      };

      await requestSender.createJob({
        requestBody,
      });

      const response = await requestSender.findJobs({ queryParams: { creator: 'UNKNOWN' as Creator } });

      expect(response.status).toBe(httpStatusCodes.OK);
      if (response.status !== 200) {
        throw new Error();
      }
      const jobs = response.body;
      expect(response).toSatisfyApiSpec();
      expect(jobs[0].creator).toBe('UNKNOWN');
      expect(jobs[0].name).toBe('DEFAULT');
      expect(jobs[0].type).toBe('PRE_DEFINED');
    });

    it('should return 200 status code and create the job', async function () {
      const response = await requestSender.createJob({
        requestBody: {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.CREATED);
    });
  });
  describe('Bad Path', function () {
    it('Expected 400 status code and a relevant validation error message when the job mode is incorrect', async function () {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const response = await requestSender.findJobs({ queryParams: { job_mode: 'WRONG_VALUE' as JobMode } });
      if (response.status !== 400) {
        throw new Error();
      }
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response).toSatisfyApiSpec();
      expect(response.body.message).toContain('request/query/job_mode must be equal to one of the allowed values');
    });

    it('The system shall return a 400 status code along with a specific validation error message detailing the missing required parameters for job creation', async function () {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const response = await requestSender.createJob({
        requestBody: {
          name: 'DEFAULT',
        },
      });
      if (response.status !== 400) {
        throw new Error();
      }
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response).toSatisfyApiSpec();
      expect(response.text).toContain('request/body must have required property');
    });
  });

  describe('Sad Path', function () {
    it('should return 500 status code when the database is down on getting jobs', async function () {
      //const prisma = new PrismaClient();
      jest.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(new Error('Database error'));
      const response = await requestSender.findJobs({});
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response).toSatisfyApiSpec();
    });

    it('should return 500 status code when the database is down on create job', async function () {
      //const prisma = new PrismaClient();
      jest.spyOn(prisma.job, 'create').mockRejectedValueOnce(new Error('Database error'));
      const response = await requestSender.createJob({
        requestBody: {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        },
      });
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response).toSatisfyApiSpec();
    });
  });
});
