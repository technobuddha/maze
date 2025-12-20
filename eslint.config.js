// 🚨
// 🚨 CHANGES TO THIS FILE WILL BE OVERRIDDEN
// 🚨
// @ts-check
// 🚨
// 🚨 CHANGES TO THIS FILE WILL BE OVERRIDDEN
// 🚨
import { app } from '@technobuddha/project';

/** @type import('eslint').Linter.Config[] */
const config = [
  { ignores: ['coverage', 'dist'] },
  // .
  app.lint({ files: ['*.config.js'], ignores: [], environment: 'node' }),
  // .
  app.lint({
    files: ['*.config.ts', '*.setup.ts'],
    ignores: [],
    environment: 'node',
    tsConfig: 'tsconfig.json',
  }),
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
