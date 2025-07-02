/*
  Warnings:

  - The values [Aborted,Paused] on the enum `task_operation_status_enum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "task_operation_status_enum_new" AS ENUM ('Pending', 'In-Progress', 'Completed', 'Failed', 'Created', 'Retried');
ALTER TABLE "task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "task" ALTER COLUMN "status" TYPE "task_operation_status_enum_new" USING ("status"::text::"task_operation_status_enum_new");
ALTER TYPE "task_operation_status_enum" RENAME TO "task_operation_status_enum_old";
ALTER TYPE "task_operation_status_enum_new" RENAME TO "task_operation_status_enum";
DROP TYPE "task_operation_status_enum_old";
ALTER TABLE "task" ALTER COLUMN "status" SET DEFAULT 'Created';
COMMIT;
