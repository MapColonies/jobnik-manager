/*
  Warnings:

  - You are about to drop the column `expirationTime` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "expirationTime",
ADD COLUMN     "expiration_time" TIMESTAMP(3);
