import { parseTasks, resolveConfig } from './helper.js';
import { prebundle } from './prebundle.js';

export interface RunOptions {
  config?: string;
  packages?: string[];
}

export async function run(options: RunOptions = {}) {
  const config = await resolveConfig(options.config);
  const parsedTasks = parseTasks(config.dependencies, config.prettier);
  const filters = options.packages?.length
    ? new Set(options.packages)
    : null;

  for (const task of parsedTasks) {
    if (filters && !filters.has(task.depName)) {
      continue;
    }
    await prebundle(task, config.externals);
  }
}

export type { Config } from './types.js';
