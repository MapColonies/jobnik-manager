/*
  Warnings:

  - Made the column `xstate` on table `job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "job" ALTER COLUMN "xstate" SET NOT NULL;
