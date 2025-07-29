/*
  Warnings:

  - Added the required column `traceparent` to the `job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tracestate` to the `job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `traceparent` to the `stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tracestate` to the `stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `traceparent` to the `task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tracestate` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "job" ADD COLUMN     "traceparent" TEXT NOT NULL,
ADD COLUMN     "tracestate" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stage" ADD COLUMN     "traceparent" TEXT NOT NULL,
ADD COLUMN     "tracestate" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "task" ADD COLUMN     "traceparent" TEXT NOT NULL,
ADD COLUMN     "tracestate" TEXT NOT NULL;
