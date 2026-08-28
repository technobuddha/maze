import { defineConfig } from '@technobuddha/project/config';

export default defineConfig({
  directories: {
    src: {
      platform: 'browser',
    },
  },
  npm: {
    ignore: ['diagrams'],
  },
});
