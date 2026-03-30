//@ts-check
/** @type import("@technobuddha/project").TechnobuddhaConfig */
const config = {
  directories: {
    'src': {
      environment: 'browser',
    },
  },
  npm: {
    ignore: ['diagrams'],
  }
};

export default config;
