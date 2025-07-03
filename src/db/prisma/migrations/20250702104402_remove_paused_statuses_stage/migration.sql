/*
  Warnings:

  - The values [Paused] on the enum `stage_operation_status_enum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "stage_operation_status_enum_new" AS ENUM ('Pending', 'In-Progress', 'Completed', 'Failed', 'Aborted', 'Waiting', 'Created');
ALTER TABLE "stage" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "stage" ALTER COLUMN "status" TYPE "stage_operation_status_enum_new" USING ("status"::text::"stage_operation_status_enum_new");
ALTER TYPE "stage_operation_status_enum" RENAME TO "stage_operation_status_enum_old";
ALTER TYPE "stage_operation_status_enum_new" RENAME TO "stage_operation_status_enum";
DROP TYPE "stage_operation_status_enum_old";
ALTER TABLE "stage" ALTER COLUMN "status" SET DEFAULT 'Created';
COMMIT;
