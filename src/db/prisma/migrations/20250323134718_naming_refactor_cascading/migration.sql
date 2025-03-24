/*
  Warnings:

  - You are about to drop the column `type` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `userMetadata` on the `stage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "stage" DROP CONSTRAINT "stage_job_id_fkey";

-- AlterTable
ALTER TABLE "job" DROP COLUMN "type",
ADD COLUMN     "job_mode" "job_mode_enum" NOT NULL DEFAULT 'Pre-Defined';

-- AlterTable
ALTER TABLE "stage" DROP COLUMN "userMetadata",
ADD COLUMN     "user_metadata" JSONB NOT NULL DEFAULT '{}';

-- AddForeignKey
ALTER TABLE "stage" ADD CONSTRAINT "stage_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
