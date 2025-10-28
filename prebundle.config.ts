import type { Config } from './src/types.js';

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
} satisfies Config;
