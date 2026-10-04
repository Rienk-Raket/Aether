import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'vendor/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['sw.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js', 'eslint.config.js', 'vitest.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
