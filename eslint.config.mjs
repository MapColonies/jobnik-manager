import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
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

// Get the base config naming convention rules
const baseNamingRules =
  tsBaseConfig.find((conf) => conf.rules?.['@typescript-eslint/naming-convention'])?.rules?.['@typescript-eslint/naming-convention'] ?? [];

// Create a new array with the base rules and our custom rule
const namingConvention = [...baseNamingRules, AllowedSqlOperators];

const customConfig = {
  ignores: ['**/*.js', 'dist/**', 'helm/**', 'coverage/**', 'reports/**', '.husky/**'],
  rules: {
    '@typescript-eslint/naming-convention': namingConvention,
  },
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
    },
  },
};

export default config(jestConfig, tsBaseConfig, customConfig);
