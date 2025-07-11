import { dirname, join } from 'node:path';
import ncc from '@vercel/ncc';
import fastGlob from '../compiled/fast-glob/index.js';
import fs from '../compiled/fs-extra/index.js';
import rslog from '../compiled/rslog/index.js';
import { DEFAULT_EXTERNALS, NODE_BUILTINS } from './constant.js';
import {
  findDepPath,
  findDirectTypeFile,
  pick,
  pkgNameToAtTypes,
} from './helper.js';
import type { ParsedTask } from './types.js';
import { dts } from 'rollup-plugin-dts';
import { rollup, type InputOptions, type OutputOptions } from 'rollup';
import { minify } from 'terser';
import { format } from 'prettier';
import { existsSync } from 'node:fs';

const { logger } = rslog;

function emitAssets(
  assets: Record<string, { source: string }>,
  distPath: string,
) {
  for (const key of Object.keys(assets)) {
    const asset = assets[key];
    fs.outputFileSync(join(distPath, key), asset.source);
  }
}

async function emitIndex(code: string, distPath: string, prettier?: boolean) {
  const distIndex = join(distPath, 'index.js');

  // use terser to strip comments and use prettier to format the code
  if (prettier) {
    const minimized = await minify(code, {
      compress: false,
      mangle: false,
      ecma: 2019,
    });

    if (!minimized.code) {
      throw new Error('terser minify failed');
    }

    const formatted = await format(minimized.code, {
      filepath: distIndex,
    });
    await fs.outputFile(distIndex, formatted);
  } else {
    await fs.outputFile(distIndex, code);
  }
}

const getTypes = (json: Record<string, string>): string | null =>
  (json &&
    (json.types ||
      json.typing ||
      json.typings ||
      // for those who use `exports` only
      getTypes((json as any).exports?.['.']))) ||
  null;

async function emitDts(task: ParsedTask, externals: Record<string, string>) {
  const outputDefaultDts = () => {
    fs.outputFileSync(join(task.distPath, 'index.d.ts'), 'export = any;\n');
  };

  if (task.ignoreDts) {
    outputDefaultDts();
    return;
  }

  if (task.copyDts) {
    const dtsFiles = fastGlob.sync('**/*.d.ts', {
      cwd: task.depPath,
      absolute: false,
    });
    for (const dtsFile of dtsFiles) {
      fs.copySync(join(task.depPath, dtsFile), join(task.distPath, dtsFile));
    }
    return;
  }

  const getInput = () => {
    const pkgPath = join(task.depPath, 'package.json');
    const pkgJson = fs.readJsonSync(pkgPath, 'utf-8');
    const types = getTypes(pkgJson);
    if (types) {
      return join(task.depPath, types);
    }

    const directTypeFile = findDirectTypeFile(task.depEntry);
    if (directTypeFile) {
      return directTypeFile;
    }

    const depTypesPath = findDepPath(
      `${pkgNameToAtTypes(task.depName)}/package.json`,
    );
    if (!depTypesPath) {
      return null;
    }

    const depTypesPkg = fs.readJsonSync(depTypesPath, 'utf-8');
    const depTypes = getTypes(depTypesPkg);
    return depTypes ? join(dirname(depTypesPath), depTypes) : null;
  };

  const input = getInput();

  if (!input) {
    outputDefaultDts();
    return;
  }

  try {
    const inputConfig: InputOptions = {
      input,
      external: [
        ...Object.keys(externals),
        ...task.dtsExternals,
        ...NODE_BUILTINS,
      ],
      plugins: [
        dts({
          respectExternal: true,
          compilerOptions: {
            skipLibCheck: true,
            // https://github.com/Swatinem/rollup-plugin-dts/issues/143,
            // but it will cause error when bundle ts which import another ts file.
            preserveSymlinks: false,
            // https://github.com/Swatinem/rollup-plugin-dts/issues/127
            composite: false,
            // https://github.com/Swatinem/rollup-plugin-dts/issues/113
            declarationMap: false,
            // Ensure ".d.ts" modules are generated
            declaration: true,
            // Skip ".js" generation
            noEmit: false,
            emitDeclarationOnly: true,
            // Skip code generation when error occurs
            noEmitOnError: true,
            // Avoid extra work
            checkJs: false,
            // Ensure we can parse the latest code
            // @ts-expect-error
            target: task.target,
          },
        }),
      ],
    };

    const outputConfig: OutputOptions = {
      dir: task.distPath,
      format: 'esm',
      exports: 'named',
      entryFileNames: 'index.d.ts',
    };

    const bundle = await rollup(inputConfig);
    await bundle.write(outputConfig);
  } catch (error) {
    logger.error(`rollup-plugin-dts failed: ${task.depName}`);
    logger.error(error);
  }
}

function emitPackageJson(
  task: ParsedTask,
  assets: Record<string, { source: string }>,
) {
  const packageJsonPath = join(task.depPath, 'package.json');
  const packageJson = fs.readJsonSync(packageJsonPath, 'utf-8');
  const outputPath = join(task.distPath, 'package.json');

  const pickedPackageJson = pick(packageJson, [
    'name',
    'author',
    'version',
    'funding',
    'license',
    ...task.packageJsonField,
  ]);

  if (task.depName !== pickedPackageJson.name) {
    pickedPackageJson.name = task.depName;
  }

  pickedPackageJson.types = task.copyDts ? getTypes(packageJson) : 'index.d.ts';

  pickedPackageJson.type = 'commonjs';

  if (assets['package.json']) {
    try {
      Object.assign(
        pickedPackageJson,
        // will be `{"type":"module"}` if the output is of esm format
        pick(JSON.parse(assets['package.json'].source), ['type']),
      );
    } catch {}
  }

  fs.writeJSONSync(outputPath, pickedPackageJson);
}

function emitLicense(task: ParsedTask) {
  const licensePath = join(task.depPath, 'LICENSE');
  if (fs.existsSync(licensePath)) {
    fs.copySync(licensePath, join(task.distPath, 'license'));
  }
}

function emitExtraFiles(task: ParsedTask) {
  const { emitFiles } = task;
  for (const item of emitFiles) {
    const path = join(task.distPath, item.path);
    fs.outputFileSync(path, item.content);
  }
}

function removeSourceMap(task: ParsedTask) {
  const maps = fastGlob.sync(join(task.distPath, '**/*.map'));
  for (const mapPath of maps) {
    fs.removeSync(mapPath);
  }
}

function renameDistFolder(task: ParsedTask) {
  const pkgPath = join(task.distPath, 'package.json');
  const pkgJson = fs.readJsonSync(pkgPath, 'utf-8');

  for (const key of ['types', 'typing', 'typings']) {
    if (pkgJson[key]?.startsWith('dist/')) {
      pkgJson[key] = pkgJson[key].replace('dist/', 'types/');

      const distFolder = join(task.distPath, 'dist');
      const typesFolder = join(task.distPath, 'types');
      if (fs.existsSync(distFolder)) {
        fs.renameSync(distFolder, typesFolder);
      }
    }
  }

  fs.writeJSONSync(pkgPath, pkgJson);
}

const pkgName = process.argv[2];

export async function prebundle(
  task: ParsedTask,
  commonExternals: Record<string, string> = {},
) {
  if (pkgName && task.depName !== pkgName) {
    return;
  }

  logger.start(`prebundle: ${task.depName}`);

  fs.removeSync(task.distPath);

  if (task.beforeBundle) {
    await task.beforeBundle(task);
  }

  const mergedExternals = {
    ...DEFAULT_EXTERNALS,
    ...commonExternals,
    ...task.externals,
  };

  const nodeModulesPath = join(process.cwd(), 'node_modules');
  const hasNodeModules = existsSync(nodeModulesPath);
  const enableCache = !process.env.CI && hasNodeModules;

  const { code, assets } = await ncc(task.depEntry, {
    minify: task.minify,
    target: task.target,
    externals: mergedExternals,
    assetBuilds: false,
    cache: enableCache ? join(nodeModulesPath, '.cache', 'ncc-cache') : false,
  });

  await emitIndex(code, task.distPath, task.prettier && !task.minify);
  emitAssets(assets, task.distPath);
  await emitDts(task, mergedExternals);
  emitLicense(task);
  emitPackageJson(task, assets);
  removeSourceMap(task);
  renameDistFolder(task);
  emitExtraFiles(task);

  if (task.afterBundle) {
    await task.afterBundle(task);
  }

  logger.success(`prebundle: ${task.depName}\n\n`);
}
