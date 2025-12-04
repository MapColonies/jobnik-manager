import path from 'node:path';
import { defineConfig } from 'prisma/config';

// DATABASE_URL is only needed for Prisma migrations
// At runtime, the PrismaClient uses the adapter configured in createConnection.ts
// Use an obviously placeholder URL for client generation if DATABASE_URL is not present
const migrateUrl = process.env.DATABASE_URL ?? 'postgresql://prisma-migrations-only:not-a-real-connection@localhost:5432/dummy?schema=public';

export default defineConfig({
  earlyAccess: true,
  schema: path.join('src', 'db', 'prisma', 'schema.prisma'),
  migrate: {
    url: migrateUrl,
  },
});
