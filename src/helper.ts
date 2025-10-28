import { dirname, extname, join } from 'node:path';
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
  const configFiles = [
    'prebundle.config.ts',
    'prebundle.config.mts',
    'prebundle.config.mjs',
    'prebundle.config.js',
  ] as const;

  for (const filename of configFiles) {
    const configPath = join(cwd, filename);
    if (fs.existsSync(configPath)) {
      const config = await import(pathToFileURL(configPath).href);
      return config.default as Config;
    }
  }

  throw new Error('Unable to locate prebundle config file.');
};

export function parseTasks(
  dependencies: Array<string | DependencyConfig>,
  globalPrettier?: boolean,
) {
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
        prettier: globalPrettier,
        ...info,
      });
    } else {
      result.push({
        minify: dep.minify ?? false,
        target: dep.target ?? 'es2019',
        ignoreDts: dep.ignoreDts,
        copyDts: dep.copyDts,
        externals: dep.externals ?? {},
        dtsOnly: dep.dtsOnly ?? false,
        dtsExternals: dep.dtsExternals ?? [],
        emitFiles: dep.emitFiles ?? [],
        prettier: dep.prettier ?? globalPrettier,
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

export function pkgNameToAtTypes(name: string) {
  const mangled = name.replace(
    //  111111    222222
    /^@([^\/]+)\/([^\/]+)/,
    '$1__$2',
  );
  return `@types/${mangled}`;
}

/**
 * Find the direct type file for a given file path.
 * @param filepath
 */
export function findDirectTypeFile(filepath: string) {
  if (/\.d\.[cm]?ts/.test(filepath)) {
    return filepath;
  }
  const ext = extname(filepath);
  const base = filepath.slice(0, -ext.length);
  const _find = (list: string[]) => {
    for (const f of list) {
      try {
        return require.resolve(f, { paths: [cwd] });
      } catch {}
    }
  };
  switch (ext) {
    case '.js':
    case '.ts':
      return _find([base + '.d.ts']);
    case '.mjs':
    case '.mts':
      return _find([base + '.d.mts', base + '.d.ts']);
    case '.cjs':
    case '.cts':
      return _find([base + '.d.cts', base + '.d.ts']);
    default:
  }
}
