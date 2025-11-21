//@ts-check

/** @type {import('@technobuddha/builder').Builds} */
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
        command: 'tsc --build ./src',
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
        command: 'tsc --build ./src',
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
        command: 'tsc --build ./src',
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
