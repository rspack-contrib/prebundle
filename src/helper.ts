import { dirname, join } from 'node:path';
import fs from '../compiled/fs-extra/index.js';
import { cwd, DIST_DIR } from './constant.js';
import type { Config, DependencyConfig, ParsedTask } from './types.js';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

export function findDepPath(name: string) {
  try {
    let entry = dirname(require.resolve(join(name), { paths: [cwd] }));

    while (!dirname(entry).endsWith('node_modules')) {
      entry = dirname(entry);
    }

    if (name.includes('/')) {
      return join(dirname(entry), name);
    }

    return entry;
  } catch (err) {
    return null;
  }
}

export const resolveConfig = async () => {
  const configPath = join(cwd, 'prebundle.config.mjs');
  const config = await import(pathToFileURL(configPath).href);
  return config.default as Config;
};

export function parseTasks(dependencies: Array<string | DependencyConfig>) {
  const result: ParsedTask[] = [];

  for (const dep of dependencies) {
    const depName = typeof dep === 'string' ? dep : dep.name;
    const importPath = join(cwd, DIST_DIR, depName);
    const distPath = join(cwd, DIST_DIR, depName);
    const depPath = findDepPath(depName);

    if (!depPath) {
      throw new Error(`Failed to resolve dependency: ${depName}`);
    }

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
        minify: false,
        target: 'es2019',
        externals: {},
        dtsExternals: [],
        emitFiles: [],
        packageJsonField: [],
        ...info,
      });
    } else {
      result.push({
        minify: dep.minify ?? false,
        target: dep.target ?? 'es2019',
        ignoreDts: dep.ignoreDts,
        externals: dep.externals ?? {},
        dtsExternals: dep.dtsExternals ?? [],
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
