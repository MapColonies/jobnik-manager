-- DropForeignKey
ALTER TABLE "stage" DROP CONSTRAINT "stage_job_id_fkey";

-- AddForeignKey
ALTER TABLE "stage" ADD CONSTRAINT "stage_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
