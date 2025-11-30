import path from 'node:path';
import { defineConfig } from 'prisma/config';

// DATABASE_URL is only needed for Prisma migrations
// Use a dummy URL for client generation if not present
const migrateUrl =
  process.env.DATABASE_URL ?? 'postgresql://localhost:5432/dummy?schema=public';

export default defineConfig({
  earlyAccess: true,
  schema: path.join('src', 'db', 'prisma', 'schema.prisma'),
  migrate: {
    url: migrateUrl,
  },
});
