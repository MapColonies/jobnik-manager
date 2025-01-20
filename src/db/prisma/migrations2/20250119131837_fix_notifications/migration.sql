/*
  Warnings:

  - You are about to drop the column `notification` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "notification",
ADD COLUMN     "notifications" JSONB;
