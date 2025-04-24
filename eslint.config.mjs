import tsBaseConfig, { namingConventions } from '@map-colonies/eslint-config/ts-base';
import jestConfig from '@map-colonies/eslint-config/jest';
import { config } from '@map-colonies/eslint-config/helpers';

const AllowedSqlOperators = {
  selector: 'objectLiteralProperty',
  format: null,
  filter: {
    match: true,
    regex: '^(AND|OR|Stage|job_id)$',
  },
};

// Create a new array with the base rules and our custom rule
const namingConvention = [...namingConventions, AllowedSqlOperators];

const customConfig = {
  rules: {
    '@typescript-eslint/naming-convention': namingConvention,
  },
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
    },
  },
};

export default config(jestConfig, tsBaseConfig, customConfig, {
  ignores: ['src/db/prisma/generated'],
});
