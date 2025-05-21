import jsLogger from '@map-colonies/js-logger';
import { faker } from '@faker-js/faker';
import { PrismaClient, TaskOperationStatus } from '@prismaClient';
import { UpdateSummaryCount } from '@src/stages/models/models';
import { defaultStatusCounts } from '@src/stages/models/helper';
import { StageRepository } from '@src/stages/DAL/stageRepository';
import { createStageEntity } from '../generator';

const prisma = new PrismaClient();
let stageRepository: StageRepository;

describe('JobManager', () => {
  beforeEach(function () {
    stageRepository = new StageRepository(jsLogger({ enabled: false }), prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#StageRepository', () => {
    describe('#updateStageSummary', () => {
      describe('#HappyPath', () => {
        it('should increase total count and created count', async function () {
          const stageId = faker.string.uuid();
          const stageEntity = createStageEntity({ id: stageId, summary: { ...defaultStatusCounts, total: 1, created: 1 } });

          const summaryUpdatePayload = {
            add: { status: TaskOperationStatus.CREATED, count: 1 },
          } satisfies UpdateSummaryCount;

          jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ summary: { defaultStatusCounts, total: 2, created: 2 } }]);

          await expect(stageRepository.updateStageSummary(stageEntity.id, summaryUpdatePayload)).toResolve();
        });

        it('should not increase total count and change counting of other', async function () {
          const stageId = faker.string.uuid();
          const stageEntity = createStageEntity({ id: stageId, summary: { ...defaultStatusCounts, total: 1, created: 1 } });

          const summaryUpdatePayload = {
            add: { status: TaskOperationStatus.PENDING, count: 1 },
            remove: { status: TaskOperationStatus.CREATED, count: 1 },
          } satisfies UpdateSummaryCount;

          jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ summary: { defaultStatusCounts, total: 1, created: 0, pending: 1 } }]);

          await expect(stageRepository.updateStageSummary(stageEntity.id, summaryUpdatePayload)).toResolve();
        });
      });

      describe('#SadPath', () => {
        it('should fail on summary internal failure (result not returned)', async function () {
          const stageId = faker.string.uuid();
          const stageEntity = createStageEntity({ id: stageId, summary: { ...defaultStatusCounts, total: 1, created: 1 } });

          const summaryUpdatePayload = {
            add: { status: TaskOperationStatus.PENDING, count: 1 },
            remove: { status: TaskOperationStatus.CREATED, count: 1 },
          } satisfies UpdateSummaryCount;

          jest.spyOn(prisma, '$queryRaw').mockResolvedValue([]);

          await expect(stageRepository.updateStageSummary(stageEntity.id, summaryUpdatePayload)).rejects.toThrow(
            'Failed to update stage summary: No summary returned from database.'
          );
        });

        it('should fail with a database error when updating status', async function () {
          const summaryUpdatePayload = {
            add: { status: TaskOperationStatus.PENDING, count: 1 },
            remove: { status: TaskOperationStatus.CREATED, count: 1 },
          } satisfies UpdateSummaryCount;

          jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('db connection error'));

          await expect(stageRepository.updateStageSummary('someId', summaryUpdatePayload)).rejects.toThrow('db connection error');
        });
      });
    });
  });
});
