import { join } from 'node:path';
import ncc from '@vercel/ncc';
import { Package as DtsPacker } from 'dts-packer';
import fastGlob from '../compiled/fast-glob/index.js';
import fs from '../compiled/fs-extra/index.js';
import rslog from '../compiled/rslog/index.js';
import { cwd, DEFAULT_EXTERNALS } from './constant.js';
import { pick, replaceFileContent } from './helper.js';
import type { ParsedTask } from './types.js';

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

function emitIndex(code: string, distPath: string) {
  const distIndex = join(distPath, 'index.js');
  fs.outputFileSync(distIndex, code);
}

function fixTypeExternalPath(
  file: string,
  task: ParsedTask,
  externals: Record<string, string>,
) {
  const filepath = join(task.distPath, file);

  replaceFileContent(filepath, (content) => {
    let newContent = content;

    for (const name of Object.keys(externals)) {
      newContent = newContent.replace(
        new RegExp(`../../${name}`, 'g'),
        externals[name],
      );
    }
    return newContent;
  });
}

function emitDts(task: ParsedTask, externals: Record<string, string>) {
  if (task.ignoreDts) {
    fs.writeFileSync(join(task.distPath, 'index.d.ts'), 'export = any;\n');
    return;
  }

  try {
    const { files } = new DtsPacker({
      cwd,
      name: task.depName,
      typesRoot: task.distPath,
      externals: Object.keys(externals),
    });

    for (const file of Object.keys(files)) {
      fixTypeExternalPath(file, task, externals);
    }
  } catch (error) {
    logger.error(`DtsPacker failed: ${task.depName}`);
    logger.error(error);
  }
}

function emitPackageJson(task: ParsedTask) {
  const packageJsonPath = join(task.depPath, 'package.json');
  const packageJson = fs.readJsonSync(packageJsonPath, 'utf-8');
  const outputPath = join(task.distPath, 'package.json');

  const pickedPackageJson = pick(packageJson, [
    'name',
    'author',
    'version',
    'funding',
    'license',
    'types',
    'typing',
    'typings',
    ...task.packageJsonField,
  ]);

  if (task.depName !== pickedPackageJson.name) {
    pickedPackageJson.name = task.depName;
  }

  if (task.ignoreDts) {
    delete pickedPackageJson.typing;
    delete pickedPackageJson.typings;
    pickedPackageJson.types = 'index.d.ts';
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

  // compiled packages are always use commonjs
  pkgJson.type = 'commonjs';

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

  logger.info(`prebundle: ${task.depName}`);

  fs.removeSync(task.distPath);

  if (task.beforeBundle) {
    await task.beforeBundle(task);
  }

  const mergedExternals = {
    ...DEFAULT_EXTERNALS,
    ...commonExternals,
    ...task.externals,
  };

  const { code, assets } = await ncc(task.depEntry, {
    minify: task.minify,
    target: task.target,
    externals: mergedExternals,
    assetBuilds: false,
  });

  emitIndex(code, task.distPath);
  emitAssets(assets, task.distPath);
  emitDts(task, mergedExternals);
  emitLicense(task);
  emitPackageJson(task);
  removeSourceMap(task);
  renameDistFolder(task);
  emitExtraFiles(task);

  if (task.afterBundle) {
    await task.afterBundle(task);
  }

  logger.success(`prebundle: ${task.depName}\n\n`);
}
