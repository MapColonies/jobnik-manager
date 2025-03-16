/*
  Warnings:

  - The `status` column on the `job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "job_operation_status_enum" AS ENUM ('Pending', 'In-Progress', 'Completed', 'Failed', 'Aborted', 'Waiting', 'Created', 'Paused');

-- CreateEnum
CREATE TYPE "stage_operation_status_enum" AS ENUM ('Pending', 'In-Progress', 'Completed', 'Failed', 'Aborted', 'Paused', 'Waiting', 'Created');

-- CreateEnum
CREATE TYPE "stage_name_enum" AS ENUM ('Tile-Seeding', 'Tile-Rendering', 'Publish-Catalog', 'Publish-Layer', 'Default');

-- AlterTable
ALTER TABLE "job" DROP COLUMN "status",
ADD COLUMN     "status" "job_operation_status_enum" NOT NULL DEFAULT 'Created';

-- DropEnum
DROP TYPE "operation_status_enum";

-- CreateTable
CREATE TABLE "stage" (
    "id" UUID NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "job_id" UUID NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "userMetadata" JSONB NOT NULL DEFAULT '{}',
    "summary" JSONB NOT NULL DEFAULT '{}',
    "status" "stage_operation_status_enum" NOT NULL DEFAULT 'Created',
    "xstate" JSONB NOT NULL,
    "name" "stage_name_enum" NOT NULL DEFAULT 'Default',

    CONSTRAINT "stage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stage" ADD CONSTRAINT "stage_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
