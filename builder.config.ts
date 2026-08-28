import { defineBuilds } from '@technobuddha/project/build';

export default defineBuilds({
  default: {
    steps: [
      {
        display: 'Clean',
        command: 'rm -rf ./dist',
      },
      {
        display: 'Maze',
        command: 'npx tsc --build ./src',
      },
    ],
  },
  publish: {
    steps: [
      { build: 'default' },
      {
        display: 'Version',
        command: 'yarn version prerelease',
      },
      {
        display: 'Publish',
        command: 'yarn npm publish --access=public',
      },
    ],
  },
});
