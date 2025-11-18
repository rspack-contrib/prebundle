#!/usr/bin/env node
import cac from 'cac';
import { createRequire } from 'node:module';
import { run } from './dist/index.js';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const cli = cac('prebundle');

cli
  .command('[...packages]', 'Prebundle configured dependencies')
  .option('--config <path>', 'Path to a custom config file')
  .action(async (packages = [], options) => {
    try {
      await run({
        config: options.config,
        packages,
      });
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });

cli.help();
cli.version(pkg.version);
cli.parse();
