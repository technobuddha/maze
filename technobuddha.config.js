//@ts-check
/** @type import("@technobuddha/project").TechnobuddhaConfig */
const config = {
  directories: {
    '.': {
      tsconfig: {
        references: ['./src'],
      },
    },
    'src': {
      environment: 'browser',
    },
  },
};

export default config;
