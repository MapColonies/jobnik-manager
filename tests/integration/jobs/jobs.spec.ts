import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import type { paths, operations } from '@openapi';
import { initConfig } from '@src/common/config';
import type { Creator, JobMode, JobName, PrismaClient } from '@prisma/client';

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
      ],
      useChild: true,
    });

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
    prisma = container.resolve<PrismaClient>(SERVICES.PRISMA);
  });

  describe('#FindJobs', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching job', async function () {
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

        if (response.status !== 200) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: httpStatusCodes.OK, body: [requestBody] });
      });
    });

    describe('Bad Path', function () {
      it('Expected 400 status code and a relevant validation error message when the job mode is incorrect', async function () {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const response = await requestSender.findJobs({ queryParams: { job_mode: 'WRONG_VALUE' as JobMode } });

        if (response.status !== 400) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: httpStatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/query\/job_mode must be equal to one of the allowed values/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database is down on getting jobs', async function () {
        jest.spyOn(prisma.job, 'findMany').mockRejectedValueOnce(new Error('Database error'));
        const response = await requestSender.findJobs({});

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: httpStatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#CreateJob', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and create the job', async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        };

        const response = await requestSender.createJob({
          requestBody: requestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: httpStatusCodes.CREATED, body: { status: 'PENDING', ...requestBody } });
      });
    });

    describe('Bad Path', function () {
      it('The system shall return a 400 status code along with a specific validation error message detailing the missing required parameters for job creation', async function () {
        const badRequestBody = {
          name: 'DEFAULT',
        };

        const response = await requestSender.createJob({
          requestBody: badRequestBody,
        });

        if (response.status !== 400) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: httpStatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/body must have required property/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database is down on create job', async function () {
        jest.spyOn(prisma.job, 'create').mockRejectedValueOnce(new Error('Database error'));
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        };

        const response = await requestSender.createJob({
          requestBody: requestBody,
        });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: httpStatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });
});
