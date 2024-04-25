import { dirname, join } from 'node:path';
import fs from 'fs-extra';
import { cwd, DIST_DIR } from './constant.js';
import type { Config, DependencyConfig, ParsedTask } from './types.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function findDepPath(name: string) {
  let entry = dirname(require.resolve(join(name), { paths: [cwd] }));

  while (!dirname(entry).endsWith('node_modules')) {
    entry = dirname(entry);
  }

  if (name.includes('/')) {
    return join(dirname(entry), name);
  }

  return entry;
}

export const resolveConfig = async () => {
  const configPath = join(cwd, 'prebundle.config.mjs');
  const config = await import(configPath);
  return config.default as Config;
};

export function parseTasks(dependencies: Array<string | DependencyConfig>) {
  const result: ParsedTask[] = [];

  for (const dep of dependencies) {
    const depName = typeof dep === 'string' ? dep : dep.name;
    const importPath = join(cwd, DIST_DIR, depName);
    const distPath = join(cwd, DIST_DIR, depName);
    const depPath = findDepPath(depName);
    const depEntry = require.resolve(depName, { paths: [cwd] });
    const info = {
      depName,
      depPath,
      depEntry,
      distPath,
      importPath,
    };

    if (typeof dep === 'string') {
      result.push({
        minify: true,
        externals: {},
        emitFiles: [],
        packageJsonField: [],
        ...info,
      });
    } else {
      result.push({
        minify: dep.minify ?? true,
        ignoreDts: dep.ignoreDts,
        externals: dep.externals ?? {},
        emitFiles: dep.emitFiles ?? [],
        afterBundle: dep.afterBundle,
        beforeBundle: dep.beforeBundle,
        packageJsonField: dep.packageJsonField ?? [],
        ...info,
      });
    }
  }

  return result;
}

export function pick<T, U extends keyof T>(obj: T, keys: ReadonlyArray<U>) {
  return keys.reduce(
    (ret, key) => {
      if (obj[key] !== undefined) {
        ret[key] = obj[key];
      }
      return ret;
    },
    {} as Pick<T, U>,
  );
}

export function replaceFileContent(
  filePath: string,
  replaceFn: (content: string) => string,
) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const newContent = replaceFn(content);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
  }
}
