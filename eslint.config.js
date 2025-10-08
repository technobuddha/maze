// @ts-check
// 🚨
// 🚨 CHANGES TO THIS FILE WILL BE OVERRIDDEN
// 🚨
import { app } from '@technobuddha/project';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // .
  app.lint({ files: ['*.config.js'], ignores: [], environment: 'node' }),
  // scripts
  app.lint({
    files: ['scripts/**/*.ts'],
    ignores: [],
    environment: 'node',
    tsConfig: 'scripts/tsconfig.json',
  }),
  // src
  app.lint({
    files: ['src/**/*.ts'],
    ignores: [],
    environment: 'browser',
    tsConfig: 'src/tsconfig.json',
  }),
];

export default config;
