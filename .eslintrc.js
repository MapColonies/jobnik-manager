const tsBase = require('@map-colonies/eslint-config/ts-base');

const originalConvention = structuredClone(tsBase.rules['@typescript-eslint/naming-convention']);

const AllowedSqlOperators = {
  selector: 'objectLiteralProperty',
  format: null,
  filter: {
    match: true,
    regex: '^(AND|OR|Stage|job_id)$',
  },
};

originalConvention.push(AllowedSqlOperators);

/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  ignorePatterns: ['**/*.js', 'dist', 'helm', 'coverage', 'reports', '.husky'],
  extends: ['@map-colonies/eslint-config/jest', '@map-colonies/eslint-config/ts-base'],
  parserOptions: {
    project: './tsconfig.lint.json',
  },
  rules: {
    '@typescript-eslint/naming-convention': originalConvention,
  },
};
