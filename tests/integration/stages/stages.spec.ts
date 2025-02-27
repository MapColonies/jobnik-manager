/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import type { paths, operations, components } from '@openapi';
import { initConfig } from '@src/common/config';
import type { Prisma, PrismaClient, StageName } from '@prisma/client';
import { Snapshot } from 'xstate';

describe('stage', function () {
  let requestSender: RequestSender<paths, operations>;
  let prisma: PrismaClient;
  type JobPayload = components['schemas']['jobPayload'];

  let createJobRecord: (body: JobPayload) => Promise<Prisma.JobGetPayload<Record<string, never>>>;
  let createStageRecord: (jobId: string) => Promise<Prisma.StageGetPayload<Record<string, never>>>;
  const dumpUuidId = '54314600-c247-441b-b7ef-3066c57f0989';
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

    createJobRecord = async (body: JobPayload): Promise<Prisma.JobGetPayload<Record<string, never>>> => {
      const res = await prisma.job.create({ data: { ...body, xstate: { status: 'active', error: undefined, output: undefined } } });
      return res;
    };

    createStageRecord = async (jobId: string): Promise<Prisma.StageGetPayload<Record<string, never>>> => {
      const requestBody = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        job_id: jobId,
        name: 'DEFAULT' as StageName,
        data: {},
        xstate: { status: 'active', error: undefined, output: undefined } as Snapshot<unknown>,
        userMetadata: {},
      };
      const res = await prisma.stage.create({ data: requestBody });
      return res;
    };
  });

  afterEach(async () => {
    // Close any open resources
    await prisma.$disconnect();
  });

  afterAll(async () => {
    // Additional cleanup if needed
    await prisma.$disconnect();
  });

  describe('#getStages', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the matching stage', async function () {
        const jobRequestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies components['schemas']['createJobPayload'];

        const job = await createJobRecord(jobRequestBody);
        const createdJobId = job.id;
        await createStageRecord(createdJobId);

        const response = await requestSender.getStages({ queryParams: { stage_type: 'DEFAULT' as StageName } });

        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [{ jobId: createdJobId, type: 'DEFAULT', userMetadata: {} }],
        });
      });

      it('should return 200 status code and empty array', async function () {
        const response = await requestSender.getStages({ queryParams: { job_id: dumpUuidId } });

        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [],
        });
      });

      it('should return 200 status code and all the matching stages for empty query params', async function () {
        const jobRequestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies components['schemas']['createJobPayload'];

        const job = await createJobRecord(jobRequestBody);
        const createdJobId = job.id;
        await createStageRecord(createdJobId);

        const response = await requestSender.getStages();

        if (!Array.isArray(response.body)) {
          throw new Error('Wrong value returned');
        }

        expect(response).toHaveProperty('status', StatusCodes.OK);
        expect(response.body.length).toBeGreaterThan(0);
      });

      describe('Bad Path', function () {
        it('Expected 400 status code and a relevant validation error message when the stage type is incorrect', async function () {
          const response = await requestSender.getStages({ queryParams: { stage_type: 'NOT_VALID_TYPE' as StageName } });

          if (response.status !== StatusCodes.BAD_REQUEST) {
            throw new Error();
          }

          expect(response).toSatisfyApiSpec();
          expect(response).toMatchObject({
            status: StatusCodes.BAD_REQUEST,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            body: { message: expect.stringMatching(/request\/query\/stage_type must be equal to one of the allowed values/) },
          });
        });
      });

      describe('Sad Path', function () {
        it('should return 500 status code when the database driver throws an error', async function () {
          jest.spyOn(prisma.stage, 'findMany').mockRejectedValueOnce(new Error('Database error'));
          const response = await requestSender.getStages({});

          expect(response).toSatisfyApiSpec();
          expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
        });
      });
    });
  });

  describe('#getStageById', function () {
    describe('Happy Path', function () {
      it('should return 201 status code and return the stage', async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies components['schemas']['createJobPayload'];

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;

        const stage = await createStageRecord(createdJobId);
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: { stageOperationStatus: 'CREATED', type: 'DEFAULT' } });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a specific validation error message detailing the non exists stage', async function () {
        const getJobResponse = await requestSender.getStageById({ pathParams: { stageId: dumpUuidId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: 'STAGE_NOT_FOUND' },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.getStageById({ pathParams: { stageId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/params\/stageId must match format "uuid"/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getStageById({ pathParams: { stageId: dumpUuidId } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getStageByJobId', function () {
    describe('Happy Path', function () {
      it('should return 201 status code and return the job', async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies components['schemas']['createJobPayload'];

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;

        const stage = await createStageRecord(createdJobId);
        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: createdJobId } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: [{ stageOperationStatus: 'CREATED', id: stage.id }] });
      });

      it('should return a 200 status code with empty array object', async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies components['schemas']['createJobPayload'];

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;

        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: createdJobId } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.OK,
          body: [],
        });
      });
    });

    describe('Bad Path', function () {
      it('should return status code 400 when supplying bad uuid', async function () {
        const getJobResponse = await requestSender.getStageByJobId({ pathParams: { jobId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) },
        });
      });

      it("should return status code 404 when supplying not exists job's uuid", async function () {
        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: '54314600-c247-441b-b7ef-3066c57f0988' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          // body: { message: expect.stringMatching(/request\/params\/jobId must match format "uuid"/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getStageByJobId({ pathParams: { jobId: dumpUuidId } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getSummary', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and return the stage's summary", async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies components['schemas']['createJobPayload'];

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;

        const stage = await createStageRecord(createdJobId);
        const getStageResponse = await requestSender.getStageSummary({ pathParams: { stageId: stage.id } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: {} });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a specific validation error message detailing the non exists stage', async function () {
        const getJobResponse = await requestSender.getStageSummary({ pathParams: { stageId: dumpUuidId } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: 'STAGE_NOT_FOUND' },
        });
      });

      it('should return status code 400 when supplying bad uuid as part of the request', async function () {
        const getJobResponse = await requestSender.getStageSummary({ pathParams: { stageId: 'someInvalidJobId' } });

        expect(getJobResponse).toSatisfyApiSpec();
        expect(getJobResponse).toMatchObject({
          status: StatusCodes.BAD_REQUEST,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: { message: expect.stringMatching(/request\/params\/stageId must match format "uuid"/) },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getStageSummary({ pathParams: { stageId: dumpUuidId } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#updateUserMetadata', function () {
    describe('Happy Path', function () {
      it("should return 201 status code and modify stages's userMetadata object", async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies components['schemas']['createJobPayload'];
        const userMetadataInput = { someTestKey: 'someTestData' };

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;
        const stage = await createStageRecord(createdJobId);

        const updateUserMetadataResponse = await requestSender.updateStageUserMetadata({
          pathParams: { stageId: stage.id },
          requestBody: userMetadataInput,
        });

        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(updateUserMetadataResponse).toSatisfyApiSpec();
        expect(getStageResponse.body).toMatchObject({ userMetadata: userMetadataInput });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code along with a message that specifies that a stage with the given id was not found', async function () {
        const getStageResponse = await requestSender.updateStageUserMetadata({ pathParams: { stageId: dumpUuidId }, requestBody: { avi: 'avi' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: 'STAGE_NOT_FOUND' },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'update').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateStageUserMetadata({ pathParams: { stageId: dumpUuidId }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });
});
