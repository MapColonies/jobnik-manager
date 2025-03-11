import { Prisma, PrismaClient } from '@prisma/client';

export async function findJobById(jobId: string, prisma: PrismaClient): Promise<Prisma.JobGetPayload<Record<string, never>> | null> {
  const queryBody = {
    where: {
      id: jobId,
    },
  };

  const job = await prisma.job.findUnique(queryBody);

  return job;
}
