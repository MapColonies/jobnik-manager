/*
  Warnings:

  - Made the column `creation_time` on table `job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "job" ALTER COLUMN "creation_time" SET NOT NULL,
ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "metadata" SET DEFAULT '{}';
