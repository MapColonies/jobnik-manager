import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { paths, operations } from '@openapi';
import { initConfig } from '@src/common/config';
import { Creator, JobMode, JobName } from '@prisma/client';

describe('job', function () {
  let requestSender: RequestSender<paths, operations>;

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    const [app] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });
    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
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
      console.log(response);
      console.log(response.body);
      expect(response.status).toBe(httpStatusCodes.OK);

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
    // All requests with status code of 400
  });
  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
  });
});
