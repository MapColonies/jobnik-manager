/*
  Warnings:

  - The `name` column on the `job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "name",
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'DEFAULT';

-- DropEnum
DROP TYPE "job_name_enum";
