/*
  Warnings:

  - Made the column `update_time` on table `job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `notifications` on table `job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "job" ALTER COLUMN "update_time" SET NOT NULL,
ALTER COLUMN "notifications" SET NOT NULL,
ALTER COLUMN "notifications" SET DEFAULT '{}';
