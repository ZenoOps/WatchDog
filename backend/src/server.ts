import 'dotenv/config';

import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await buildApp({ config });

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'Stopping WatchDog backend');
  await app.close();
};

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});
process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

try {
  const address = await app.listen({ host: config.host, port: config.port });
  app.log.info({ address, databasePath: config.databasePath }, 'WatchDog backend is ready');
} catch (error) {
  app.log.error(error, 'WatchDog backend failed to start');
  process.exitCode = 1;
}
