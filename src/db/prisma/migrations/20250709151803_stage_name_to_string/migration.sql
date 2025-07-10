/*
  Warnings:

  - The `name` column on the `stage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "stage" DROP COLUMN "name",
ADD COLUMN     "name" VARCHAR(50) NOT NULL DEFAULT 'unknown';

-- DropEnum
DROP TYPE "stage_name_enum";
