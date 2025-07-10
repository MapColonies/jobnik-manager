/*
  Warnings:

  - You are about to drop the column `name` on the `stage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stage" DROP COLUMN "name",
ADD COLUMN     "type" VARCHAR(50) NOT NULL DEFAULT 'unknown';
