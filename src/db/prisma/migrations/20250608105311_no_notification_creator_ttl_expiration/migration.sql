/*
  Warnings:

  - You are about to drop the column `creator` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_time` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `notifications` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `ttl` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "creator",
DROP COLUMN "expiration_time",
DROP COLUMN "notifications",
DROP COLUMN "ttl";

-- DropEnum
DROP TYPE "creator";
