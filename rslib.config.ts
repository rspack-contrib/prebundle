import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [{ format: 'esm', syntax: 'es2021', dts: { bundle: false } }],
  output: {
    target: 'node',
  },
  tools: {
    rspack: {
      externals: [/[\\/]compiled[\\/]/],
    },
  },
});
