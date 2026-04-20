#!/usr/bin/env tsx
import path from 'node:path';

import { builder, type Project } from '@technobuddha/builder';

const home = path.join(import.meta.dirname, '..');
const dirSrc = path.join(home, 'src');
const dirDist = path.join(home, 'dist');

const projects: Project[] = [
  {
    label: 'Maze',
    steps: [`rm -rf ${dirDist}`, `tsc -p ${dirSrc}`],
  },
];

await builder(projects);
