/*
  Warnings:

  - The `name` column on the `job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "job_name_enum" AS ENUM ('Ingestion', 'Export', 'Default');

-- AlterTable
ALTER TABLE "job" DROP COLUMN "name",
ADD COLUMN     "name" "job_name_enum" NOT NULL DEFAULT 'Default';

