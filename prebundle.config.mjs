// @ts-check

/** @type {import('./src/types').Config} */
export default {
  dependencies: [
    'fs-extra',
    {
      name: 'fast-glob',
      ignoreDts: true,
    },
  ],
};
