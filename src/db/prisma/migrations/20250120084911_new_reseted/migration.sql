-- CreateEnum
CREATE TYPE "operation_status_enum" AS ENUM ('Pending', 'In-Progress', 'Completed', 'Failed', 'Aborted', 'Waiting', 'Waiting-For-Approval', 'Paused');

-- CreateEnum
CREATE TYPE "priority_enum" AS ENUM ('Very-High', 'High', 'Medium', 'Low', 'Very-Low');

-- CreateEnum
CREATE TYPE "job_mode_enum" AS ENUM ('Pre-Defined', 'Dynamic');

-- CreateEnum
CREATE TYPE "creator" AS ENUM ('Map-Colonies', 'Unknown');

-- CreateEnum
CREATE TYPE "job_name_enum" AS ENUM ('Ingestion', 'Export', 'Default');

-- CreateTable
CREATE TABLE "job" (
    "id" UUID NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" "operation_status_enum" NOT NULL DEFAULT 'Pending',
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "creation_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP(3),
    "expiration_time" TIMESTAMP(3),
    "type" "job_mode_enum" NOT NULL DEFAULT 'Pre-Defined',
    "userMetadata" JSONB NOT NULL DEFAULT '{}',
    "priority" "priority_enum" NOT NULL DEFAULT 'Very-Low',
    "creator" "creator" NOT NULL DEFAULT 'Unknown',
    "TTL" TIMESTAMP(3),
    "notifications" JSONB,
    "name" "job_name_enum" NOT NULL DEFAULT 'Default',

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);
