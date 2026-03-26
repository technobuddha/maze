//@ts-check

/** @type {import('@technobuddha/project/build').Builds} */
const config = {
  dev: {
    watch: true,

    steps: [
      {
        name: 'Clean',
        command: 'rm -rf ./dist'
      },
      {
        name: 'Maze',
        directory: './src',
        command: 'npx tsc --build ./src',
      },
    ],
  },
  prod: {
    steps: [
      {
        name: 'Clean',
        command: 'rm -rf ./dist',
      },
      {
        name: 'Maze',
        command: 'npx tsc --build ./src',
      },
    ]
  },
  publish: {
    steps: [
      {
        name: 'Clean',
        command: 'rm -rf ./dist',
      },
      {
        name: 'Maze',
        command: 'npx tsc --build ./src',
      },
      {
        name: 'Version',
        command: 'yarn version patch',
      },
      {
        name: 'Publish',
        command: 'yarn npm publish --access public',
      }
    ]
  }
};

export default config;
