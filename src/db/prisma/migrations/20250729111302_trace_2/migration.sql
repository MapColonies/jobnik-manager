-- AlterTable
ALTER TABLE "job" ALTER COLUMN "tracestate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "stage" ALTER COLUMN "tracestate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "task" ALTER COLUMN "tracestate" DROP NOT NULL;
