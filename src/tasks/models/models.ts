import { Prisma } from '@prisma/client';
import type { components, operations } from '@src/openapi';

type TaskModel = components['schemas']['taskResponse'];
type TasksFindCriteriaArg = operations['getTasksByCriteria']['parameters']['query'];
type TaskPrismaObject = Prisma.TaskGetPayload<Prisma.TaskDefaultArgs>;

export type { TaskModel, TasksFindCriteriaArg, TaskPrismaObject };
