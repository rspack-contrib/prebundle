// @ts-check

/** @type {import('./src/types').Config} */
export default {
  prettier: true,
  dependencies: [
    'rslog',
    'fs-extra',
    {
      name: 'fast-glob',
      ignoreDts: true,
    },
  ],
};
