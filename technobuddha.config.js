//@ts-check
/** @type import("@technobuddha/project").TechnobuddhaConfig */
const config = {
  directories: {
    'src': {
      platform: 'browser',
    },
  },
  npm: {
    ignore: ['diagrams'],
  }
};

export default config;
