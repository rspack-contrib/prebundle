import { parseTasks, resolveConfig } from './helper';
import { prebundle } from './prebundle';

export async function run() {
  const config = await resolveConfig();
  const parsedTasks = parseTasks(config.tasks);

  for (const task of parsedTasks) {
    await prebundle(task);
  }
}
