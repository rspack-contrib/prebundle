export const DIST_DIR = 'compiled';

export const DEFAULT_EXTERNALS = {
  // ncc bundled wrong package.json, using external to avoid this problem
  './package.json': './package.json',
  '../package.json': './package.json',
  '../../package.json': './package.json',
};

export const cwd = process.cwd();
