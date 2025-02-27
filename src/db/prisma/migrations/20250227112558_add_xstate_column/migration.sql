/*
  Warnings:

  - The values [Waiting-For-Approval] on the enum `operation_status_enum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `TTL` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `userMetadata` on the `job` table. All the data in the column will be lost.
  - Added the required column `xstate` to the `job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "operation_status_enum_new" AS ENUM ('Pending', 'In-Progress', 'Completed', 'Failed', 'Aborted', 'Waiting', 'Created', 'Paused');
ALTER TABLE "job" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "job" ALTER COLUMN "status" TYPE "operation_status_enum_new" USING ("status"::text::"operation_status_enum_new");
ALTER TYPE "operation_status_enum" RENAME TO "operation_status_enum_old";
ALTER TYPE "operation_status_enum_new" RENAME TO "operation_status_enum";
DROP TYPE "operation_status_enum_old";
ALTER TABLE "job" ALTER COLUMN "status" SET DEFAULT 'Created';
COMMIT;

-- AlterTable
ALTER TABLE "job" DROP COLUMN "TTL",
DROP COLUMN "userMetadata",
ADD COLUMN     "ttl" TIMESTAMP(3),
ADD COLUMN     "user_metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "xstate" JSONB NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Created';
