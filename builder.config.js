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
        command: 'tsc -p ./src',
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
        command: 'tsc -p ./src',
      },
    ]
  }
};

export default config;
