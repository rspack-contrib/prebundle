import { parseTasks, resolveConfig } from './helper.js';
import { prebundle } from './prebundle.js';

export async function run() {
  const config = await resolveConfig();
  const parsedTasks = parseTasks(config.dependencies);

  for (const task of parsedTasks) {
    await prebundle(task);
  }
}
