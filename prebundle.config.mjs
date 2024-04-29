// @ts-check

/** @type {import('./src/types').Config} */
export default {
  dependencies: [
    'rslog',
    'fs-extra',
    {
      name: 'fast-glob',
      ignoreDts: true,
    },
  ],
};
