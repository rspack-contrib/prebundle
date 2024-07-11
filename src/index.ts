import { parseTasks, resolveConfig } from './helper.js';
import { prebundle } from './prebundle.js';

export async function run() {
  const config = await resolveConfig();
  const parsedTasks = parseTasks(config.dependencies, config.prettier);

  for (const task of parsedTasks) {
    await prebundle(task, config.externals);
  }
}

export type { Config } from './types.js';
