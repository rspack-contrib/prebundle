import { parseTasks, resolveConfig } from './helper.js';
import { prebundle } from './prebundle.js';

export async function run() {
  const config = await resolveConfig();
  const parsedTasks = parseTasks(config.dependencies);

  await Promise.all(parsedTasks.map(task => prebundle(task, config.externals)));
}

export type { Config } from './types.js';
