/*
  Warnings:

  - You are about to drop the column `type` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `userMetadata` on the `stage` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "task_operation_status_enum" AS ENUM ('Pending', 'In-Progress', 'Completed', 'Failed', 'Aborted', 'Paused', 'Waiting', 'Created', 'Retried');

-- CreateEnum
CREATE TYPE "task_type_enum" AS ENUM ('Tile-Seeding', 'Tile-Rendering', 'Publish-Catalog', 'Publish-Layer', 'Default');

-- DropForeignKey
ALTER TABLE "stage" DROP CONSTRAINT "stage_job_id_fkey";

-- AlterTable
ALTER TABLE "job" DROP COLUMN "type",
ADD COLUMN     "job_mode" "job_mode_enum" NOT NULL DEFAULT 'Pre-Defined';

-- AlterTable
ALTER TABLE "stage" DROP COLUMN "userMetadata",
ADD COLUMN     "user_metadata" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "task" (
    "id" UUID NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" "task_operation_status_enum" NOT NULL DEFAULT 'Created',
    "xstate" JSONB NOT NULL,
    "type" "task_type_enum" NOT NULL DEFAULT 'Default',
    "creation_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP(3) NOT NULL,
    "user_metadata" JSONB NOT NULL DEFAULT '{}',
    "stage_id" UUID NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stage" ADD CONSTRAINT "stage_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
