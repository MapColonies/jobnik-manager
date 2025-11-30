/**
 * This module provides bidirectional mapping between Prisma enum values (database values)
 * and API enum values (OpenAPI specification values).
 *
 * In Prisma 7, enum values now use the @map() database values (e.g., 'Pending', 'In-Progress')
 * instead of the TypeScript enum keys (e.g., 'PENDING', 'IN_PROGRESS').
 *
 * The API contract uses uppercase enum values to match the OpenAPI specification.
 */

import {
  JobOperationStatus as PrismaJobOperationStatus,
  StageOperationStatus as PrismaStageOperationStatus,
  TaskOperationStatus as PrismaTaskOperationStatus,
  Priority as PrismaPriority,
} from '@prismaClient';
import type { components } from '@src/openapi';

// API types from OpenAPI specification
type ApiJobOperationStatus = components['schemas']['jobOperationStatus'];
type ApiStageOperationStatus = components['schemas']['stageOperationStatusResponse'];
type ApiTaskOperationStatus = components['schemas']['taskOperationStatusResponse'];
type ApiPriority = components['schemas']['priority'];

// Bidirectional mapping for JobOperationStatus
const jobStatusPrismaToApi: Record<PrismaJobOperationStatus, ApiJobOperationStatus> = {
  [PrismaJobOperationStatus.PENDING]: 'PENDING',
  [PrismaJobOperationStatus.IN_PROGRESS]: 'IN_PROGRESS',
  [PrismaJobOperationStatus.COMPLETED]: 'COMPLETED',
  [PrismaJobOperationStatus.FAILED]: 'FAILED',
  [PrismaJobOperationStatus.ABORTED]: 'ABORTED',
  [PrismaJobOperationStatus.CREATED]: 'CREATED',
  [PrismaJobOperationStatus.PAUSED]: 'PAUSED',
};

const jobStatusApiToPrisma: Record<ApiJobOperationStatus, PrismaJobOperationStatus> = {
  PENDING: PrismaJobOperationStatus.PENDING,
  IN_PROGRESS: PrismaJobOperationStatus.IN_PROGRESS,
  COMPLETED: PrismaJobOperationStatus.COMPLETED,
  FAILED: PrismaJobOperationStatus.FAILED,
  ABORTED: PrismaJobOperationStatus.ABORTED,
  CREATED: PrismaJobOperationStatus.CREATED,
  PAUSED: PrismaJobOperationStatus.PAUSED,
};

// Bidirectional mapping for StageOperationStatus
const stageStatusPrismaToApi: Record<PrismaStageOperationStatus, ApiStageOperationStatus> = {
  [PrismaStageOperationStatus.PENDING]: 'PENDING',
  [PrismaStageOperationStatus.IN_PROGRESS]: 'IN_PROGRESS',
  [PrismaStageOperationStatus.COMPLETED]: 'COMPLETED',
  [PrismaStageOperationStatus.FAILED]: 'FAILED',
  [PrismaStageOperationStatus.ABORTED]: 'ABORTED',
  [PrismaStageOperationStatus.WAITING]: 'WAITING',
  [PrismaStageOperationStatus.CREATED]: 'CREATED',
};

const stageStatusApiToPrisma: Record<ApiStageOperationStatus, PrismaStageOperationStatus> = {
  PENDING: PrismaStageOperationStatus.PENDING,
  IN_PROGRESS: PrismaStageOperationStatus.IN_PROGRESS,
  COMPLETED: PrismaStageOperationStatus.COMPLETED,
  FAILED: PrismaStageOperationStatus.FAILED,
  ABORTED: PrismaStageOperationStatus.ABORTED,
  WAITING: PrismaStageOperationStatus.WAITING,
  CREATED: PrismaStageOperationStatus.CREATED,
};

// Bidirectional mapping for TaskOperationStatus
const taskStatusPrismaToApi: Record<PrismaTaskOperationStatus, ApiTaskOperationStatus> = {
  [PrismaTaskOperationStatus.PENDING]: 'PENDING',
  [PrismaTaskOperationStatus.IN_PROGRESS]: 'IN_PROGRESS',
  [PrismaTaskOperationStatus.COMPLETED]: 'COMPLETED',
  [PrismaTaskOperationStatus.FAILED]: 'FAILED',
  [PrismaTaskOperationStatus.CREATED]: 'CREATED',
  [PrismaTaskOperationStatus.RETRIED]: 'RETRIED',
};

const taskStatusApiToPrisma: Record<ApiTaskOperationStatus, PrismaTaskOperationStatus> = {
  PENDING: PrismaTaskOperationStatus.PENDING,
  IN_PROGRESS: PrismaTaskOperationStatus.IN_PROGRESS,
  COMPLETED: PrismaTaskOperationStatus.COMPLETED,
  FAILED: PrismaTaskOperationStatus.FAILED,
  CREATED: PrismaTaskOperationStatus.CREATED,
  RETRIED: PrismaTaskOperationStatus.RETRIED,
};

// Bidirectional mapping for Priority
const priorityPrismaToApi: Record<PrismaPriority, ApiPriority> = {
  [PrismaPriority.VERY_HIGH]: 'VERY_HIGH',
  [PrismaPriority.HIGH]: 'HIGH',
  [PrismaPriority.MEDIUM]: 'MEDIUM',
  [PrismaPriority.LOW]: 'LOW',
  [PrismaPriority.VERY_LOW]: 'VERY_LOW',
};

const priorityApiToPrisma: Record<ApiPriority, PrismaPriority> = {
  VERY_HIGH: PrismaPriority.VERY_HIGH,
  HIGH: PrismaPriority.HIGH,
  MEDIUM: PrismaPriority.MEDIUM,
  LOW: PrismaPriority.LOW,
  VERY_LOW: PrismaPriority.VERY_LOW,
};

// Conversion functions
export function convertJobStatusToApi(prismaStatus: PrismaJobOperationStatus): ApiJobOperationStatus {
  return jobStatusPrismaToApi[prismaStatus];
}

export function convertJobStatusToPrisma(apiStatus: ApiJobOperationStatus): PrismaJobOperationStatus {
  return jobStatusApiToPrisma[apiStatus];
}

export function convertStageStatusToApi(prismaStatus: PrismaStageOperationStatus): ApiStageOperationStatus {
  return stageStatusPrismaToApi[prismaStatus];
}

export function convertStageStatusToPrisma(apiStatus: ApiStageOperationStatus): PrismaStageOperationStatus {
  return stageStatusApiToPrisma[apiStatus];
}

export function convertTaskStatusToApi(prismaStatus: PrismaTaskOperationStatus): ApiTaskOperationStatus {
  return taskStatusPrismaToApi[prismaStatus];
}

export function convertTaskStatusToPrisma(apiStatus: ApiTaskOperationStatus): PrismaTaskOperationStatus {
  return taskStatusApiToPrisma[apiStatus];
}

export function convertPriorityToApi(prismaPriority: PrismaPriority): ApiPriority {
  return priorityPrismaToApi[prismaPriority];
}

export function convertPriorityToPrisma(apiPriority: ApiPriority): PrismaPriority {
  return priorityApiToPrisma[apiPriority];
}

// Export types for use in other modules
export type { ApiJobOperationStatus, ApiStageOperationStatus, ApiTaskOperationStatus, ApiPriority };
