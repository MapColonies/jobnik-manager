/*
  Warnings:

  - You are about to drop the column `job_mode` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "job_mode";

-- DropEnum
DROP TYPE "job_mode_enum";
