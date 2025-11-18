import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';
import { execFile } from 'node:child_process';
import { promises as fs, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

type TargetPackage = {
  name: string;
  verify: (distPath: string) => Promise<void> | void;
};

const execFileAsync = promisify(execFile);
const testConfigPath = join(
  process.cwd(),
  'tests/fixtures/prebundle.test.config.mjs',
);
const targetPackages: TargetPackage[] = [
  {
    name: 'chalk',
    verify: async (distPath: string) => {
      const mod = await loadBundledModule(distPath);
      const chalkInstance = mod.default ?? mod;
      const message = chalkInstance.hex('#00ff88')('prebundle-ready');
      expect(message).toContain('prebundle-ready');
      expect(message).toContain('\u001b[');
    },
  },
  {
    name: '@astrojs/sitemap',
    verify: async (distPath: string) => {
      const mod = await loadBundledModule(distPath);
      const createPlugin = mod.default ?? mod;
      const integration = createPlugin();
      expect(integration.name).toBe('@astrojs/sitemap');
      expect(typeof integration.hooks['astro:build:done']).toBe('function');
    },
  },
];

const bundledPaths = new Map<string, string>();

beforeAll(async () => {
  for (const target of targetPackages) {
    const distPath = join(process.cwd(), 'compiled', target.name);
    bundledPaths.set(target.name, distPath);
    await resetDist(distPath);
  }
  await runPrebundle();
});

afterAll(async () => {
  for (const distPath of bundledPaths.values()) {
    await resetDist(distPath);
  }
});

describe('prebundle integration smoke tests', () => {
  it('chalk bundles the expected artifacts', async () => {
    await assertBundledPackage('chalk');
  });

  it('@astrojs/sitemap bundles the expected artifacts', async () => {
    await assertBundledPackage('@astrojs/sitemap');
  });
});

async function resetDist(distPath?: string) {
  if (!distPath) {
    return;
  }
  await fs.rm(distPath, { recursive: true, force: true });
}

function readRelativeFileTree(distPath: string) {
  const results: string[] = [];
  const walk = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (entry.isFile()) {
        const rel = relative(distPath, entryPath).split(sep).join('/');
        results.push(rel);
      }
    }
  };
  walk(distPath);
  return results.sort();
}

async function loadBundledModule(distPath: string) {
  const moduleUrl = pathToFileURL(join(distPath, 'index.js'));
  return import(moduleUrl.href);
}

async function runPrebundle() {
  const args = [join(process.cwd(), 'bin.js'), '--config', testConfigPath];
  await execFileAsync(process.execPath, args, {
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  });
}

async function assertBundledPackage(packageName: string) {
  const distPath = bundledPaths.get(packageName);
  expect(distPath).toBeDefined();
  const files = readRelativeFileTree(distPath!);
  const requiredFiles = ['index.d.ts', 'index.js', 'package.json'];
  for (const file of requiredFiles) {
    expect(files).toContain(file);
  }
  const extras = files.filter((file) => {
    return !requiredFiles.includes(file.toLowerCase());
  });
  if (extras.length) {
    expect(extras.map((file) => file.toLowerCase())).toEqual(['license']);
  }
  const target = targetPackages.find((item) => item.name === packageName);
  if (!target) {
    throw new Error(`Unknown target package: ${packageName}`);
  }
  await target.verify(distPath!);
}
