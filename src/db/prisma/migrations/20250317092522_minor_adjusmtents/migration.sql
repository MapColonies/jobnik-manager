/*
  Warnings:

  - You are about to drop the column `userMetadata` on the `stage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stage" DROP COLUMN "userMetadata",
ADD COLUMN     "user_metadata" JSONB NOT NULL DEFAULT '{}';
