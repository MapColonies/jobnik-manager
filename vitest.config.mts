import { defineConfig, ViteUserConfig } from 'vitest/config';
import tsconfig from './tsconfig.json';
import path from 'path';

// Create an alias object from the paths in tsconfig.json
const pathAlias = Object.fromEntries(
  // For Each Path in tsconfig.json
  Object.entries(tsconfig.compilerOptions.paths).map(([key, [value]]) => [
    // Remove the "/*" from the key and resolve the path
    key.replace('/*', ''),
    // Remove the "/*" from the value Resolve the relative path
    path.resolve(__dirname, value.replace('/*', '')),
  ])
);

const reporters: Exclude<ViteUserConfig['test'], undefined>['reporters'] = ['default', 'html'];

if (process.env.GITHUB_ACTIONS) {
  reporters.push('github-actions');
}

export default defineConfig({
  test: {
    // Integration spec files share one physical Postgres database and each test truncates it
    // before running (see truncateAllTables), so no two test files may run concurrently or one
    // file's truncation could wipe data another file is mid-test with. `fileParallelism` only
    // has effect at this top level (it controls the global worker pool size) - it is silently
    // ignored if set inside an individual project's config.
    fileParallelism: false,
    projects: [
      {
        test: {
          name: 'unit',
          setupFiles: ['./tests/configurations/initJestOpenapi.setup.ts', './tests/configurations/vite.setup.ts'],
          include: ['tests/unit/**/*.spec.ts'],
          environment: 'node',
          server: {
            deps: {
              external: ['node-cron', /prisma[\/]generated[\/]client[\/]runtime[\/]library/],
            },
          },
        },
        resolve: {
          alias: pathAlias,
        },
      },
      {
        test: {
          name: 'integration',
          globalSetup: './tests/configurations/integration/globalSetup.ts',
          setupFiles: ['./tests/configurations/initJestOpenapi.setup.ts', './tests/configurations/vite.setup.ts'],
          include: ['tests/integration/**/*.spec.ts'],
          environment: 'node',
          server: {
            deps: {
              external: ['node-cron', /prisma[\/]generated[\/]client[\/]runtime[\/]library/],
            },
          },
        },
        resolve: {
          alias: pathAlias,
        },
      },
    ],
    reporters,
    coverage: {
      enabled: true,
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/vendor/**',
        'node_modules/**',
        '**/openapi.d.ts',
        '**/index.ts',
        '**/constants.ts',
        '**/dependencyRegistration.ts',
        '**/interfaces.ts',
        '**/serviceMetrics.ts',
        '**/tracing.ts',
        '**/generated/**',
        '**/error-express-handler.ts',
        '**/promiseTimeout.ts',
        'src/db/**',
        '**/models.ts',
      ],
      reportOnFailure: true,
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
