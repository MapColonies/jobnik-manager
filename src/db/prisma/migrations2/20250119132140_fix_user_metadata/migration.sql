/*
  Warnings:

  - You are about to drop the column `metadata` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "metadata",
ADD COLUMN     "userMetadata" JSONB NOT NULL DEFAULT '{}';
