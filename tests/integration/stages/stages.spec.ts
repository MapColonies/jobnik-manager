/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { StatusCodes } from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import type { paths, operations, components } from '@openapi';
import { initConfig } from '@src/common/config';
import { JobOperationStatus, type Prisma, type PrismaClient, type StageName } from '@prisma/client';
import { Snapshot } from 'xstate';
import { JOB_NOT_FOUND_MSG } from '@src/jobs/models/errors';

describe('stage', function () {
  let requestSender: RequestSender<paths, operations>;
  let prisma: PrismaClient;
  type JobPayload = components['schemas']['jobPayload'];
  type CreateJobPayload = components['schemas']['createJobPayload'];

  let createJobRecord: (body: JobPayload) => Promise<Prisma.JobGetPayload<Record<string, never>>>;
  let createStageRecord: (jobId: string) => Promise<Prisma.StageGetPayload<Record<string, never>>>;
  const dumpUuid = '54314600-c247-441b-b7ef-3066c57f0989';
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

  afterAll(async () => {
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
        } satisfies CreateJobPayload;

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
        const response = await requestSender.getStages({ queryParams: { job_id: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({
          status: StatusCodes.OK,
          body: [],
        });
      });

      it('should return 200 status code and all the stages if no query params were defined', async function () {
        const jobRequestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies CreateJobPayload;

        const job = await createJobRecord(jobRequestBody);
        const createdJobId = job.id;
        await createStageRecord(createdJobId);

        const response = await requestSender.getStages();

        if (response.status !== StatusCodes.OK) {
          throw new Error();
        }

        expect(response).toSatisfyApiSpec();
        expect(response).toHaveProperty('status', StatusCodes.OK);
        expect(response.body.length).toBeGreaterThan(0);
      });

      describe('Bad Path', function () {
        it('should return 400 status code and a relevant validation error message when the stage type is incorrect', async function () {
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
      it('should return 200 status code and return the stage', async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies CreateJobPayload;

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;

        const stage = await createStageRecord(createdJobId);
        const getStageResponse = await requestSender.getStageById({ pathParams: { stageId: stage.id } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: { status: JobOperationStatus.CREATED, type: 'DEFAULT' } });
      });
    });

    describe('Bad Path', function () {
      it('should return a 404 status code with a validation error message if the requested stage does not exist', async function () {
        const getJobResponse = await requestSender.getStageById({ pathParams: { stageId: dumpUuid } });

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

        const response = await requestSender.getStageById({ pathParams: { stageId: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getStageByJobId', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and return the stages', async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies CreateJobPayload;

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;

        const stage = await createStageRecord(createdJobId);
        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: createdJobId } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: [{ status: JobOperationStatus.CREATED, id: stage.id }] });
      });

      it('should return a 200 status code with empty array object if no stages exists for the requested job', async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies CreateJobPayload;

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

      it('should return status code 404 when a job with the given uuid does not exists', async function () {
        const getStageResponse = await requestSender.getStageByJobId({ pathParams: { jobId: '54314600-c247-441b-b7ef-3066c57f0988' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: JOB_NOT_FOUND_MSG },
        });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.job, 'findUnique').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.getStageByJobId({ pathParams: { jobId: dumpUuid } });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });

  describe('#getSummary', function () {
    describe('Happy Path', function () {
      it("should return 200 status code and return the stage's summary", async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies CreateJobPayload;

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;

        const stage = await createStageRecord(createdJobId);
        const getStageResponse = await requestSender.getStageSummary({ pathParams: { stageId: stage.id } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({ status: StatusCodes.OK, body: {} });
      });
    });

    describe('Bad Path', function () {
      it("should return a 404 status code and a validation error indicating the stage's non-existence should be returned", async function () {
        const getJobResponse = await requestSender.getStageSummary({ pathParams: { stageId: dumpUuid } });

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

        const response = await requestSender.getStageSummary({ pathParams: { stageId: dumpUuid } });

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
        } satisfies CreateJobPayload;
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
        const getStageResponse = await requestSender.updateStageUserMetadata({ pathParams: { stageId: dumpUuid }, requestBody: { avi: 'avi' } });

        expect(getStageResponse).toSatisfyApiSpec();
        expect(getStageResponse).toMatchObject({
          status: StatusCodes.NOT_FOUND,
          body: { message: 'STAGE_NOT_FOUND' },
        });
      });

      it('should return a 400 status code and a message indicating the request body has an invalid structure', async function () {
        const requestBody = {
          name: 'DEFAULT',
          creator: 'UNKNOWN',
          data: { stages: [] },
          type: 'PRE_DEFINED',
          notifications: {},
          userMetadata: {},
        } satisfies CreateJobPayload;

        const job = await createJobRecord(requestBody);
        const createdJobId = job.id;
        const stage = await createStageRecord(createdJobId);

        const response = await requestSender.updateStageUserMetadata({
          pathParams: { stageId: stage.id },
          requestBody: 'badInputString' as unknown as { [key: string]: string },
        });

        expect(response).toSatisfyApiSpec();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(response).toMatchObject({ status: StatusCodes.BAD_REQUEST, body: { message: expect.stringMatching('is not valid JSON') } });
      });
    });

    describe('Sad Path', function () {
      it('should return 500 status code when the database driver throws an error', async function () {
        jest.spyOn(prisma.stage, 'update').mockRejectedValueOnce(new Error('Database error'));

        const response = await requestSender.updateStageUserMetadata({ pathParams: { stageId: dumpUuid }, requestBody: {} });

        expect(response).toSatisfyApiSpec();
        expect(response).toMatchObject({ status: StatusCodes.INTERNAL_SERVER_ERROR, body: { message: 'Database error' } });
      });
    });
  });
});
