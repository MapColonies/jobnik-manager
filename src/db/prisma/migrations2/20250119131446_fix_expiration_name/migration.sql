/*
  Warnings:

  - You are about to drop the column `expiration_time` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "expiration_time",
ADD COLUMN     "expirationTime" TIMESTAMP(3);
