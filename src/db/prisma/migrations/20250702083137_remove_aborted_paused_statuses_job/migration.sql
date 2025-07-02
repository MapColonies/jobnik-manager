/*
  Warnings:

  - The values [Waiting] on the enum `job_operation_status_enum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "job_operation_status_enum_new" AS ENUM ('Pending', 'In-Progress', 'Completed', 'Failed', 'Aborted', 'Created', 'Paused');
ALTER TABLE "job" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "job" ALTER COLUMN "status" TYPE "job_operation_status_enum_new" USING ("status"::text::"job_operation_status_enum_new");
ALTER TYPE "job_operation_status_enum" RENAME TO "job_operation_status_enum_old";
ALTER TYPE "job_operation_status_enum_new" RENAME TO "job_operation_status_enum";
DROP TYPE "job_operation_status_enum_old";
ALTER TABLE "job" ALTER COLUMN "status" SET DEFAULT 'Created';
COMMIT;
