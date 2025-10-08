//@ts-check
/** @type import("@technobuddha/project").TechnobuddhaConfig */
const config = {
  directories: {
    '.': {
      tsconfig: {
        references: ['./src'],
      },
    },
    'scripts': {
      environment: 'node',
    },
    'src': {
      environment: 'browser',
    },
  },
  npm: {
    ignore: ['diagrams', 'scripts'],
  }
};

export default config;
