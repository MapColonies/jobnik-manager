import tsBaseConfig, { namingConventions } from '@map-colonies/eslint-config/ts-base';
import { defineConfig } from '@map-colonies/eslint-config/helpers';
import vitestConfig from '@map-colonies/eslint-config/vitest';

const AllowedSqlOperators = {
  selector: 'objectLiteralProperty',
  format: null,
  filter: {
    match: true,
    regex: '^(AND|OR|job_id|_max)$',
  },
};

// Create a new array with the base rules and our custom rule
const namingConvention = [...namingConventions, AllowedSqlOperators];

const customConfig = {
  rules: {
    '@typescript-eslint/naming-convention': namingConvention,
    'no-console': 'error',
  },
};

export default defineConfig(vitestConfig, tsBaseConfig, customConfig, {
  ignores: ['src/db/prisma/generated', 'src/common/generated', 'vitest.config.mts'],
});
