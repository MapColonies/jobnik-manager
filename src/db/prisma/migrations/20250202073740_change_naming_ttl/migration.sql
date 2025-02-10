/*
  Warnings:

  - You are about to drop the column `TTL` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "TTL",
ADD COLUMN     "ttl" TIMESTAMP(3);
