import cors from '@fastify/cors';
import Fastify, { type FastifyServerOptions } from 'fastify';

import { loadConfig, type WatchDogConfig } from './config.js';
import { WatchDogDatabase } from './database.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';

export type BuildAppOptions = {
  config?: WatchDogConfig;
  logger?: FastifyServerOptions['logger'];
  migrationsDirectory?: string;
};

export async function buildApp(options: BuildAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const logger = options.logger ?? {
    level: config.logLevel,
    redact: ['req.headers.authorization'],
  };

  const app = Fastify({
    logger,
    requestTimeout: 15_000,
    bodyLimit: 64 * 1_024,
  });
  const database = new WatchDogDatabase(config.databasePath, options.migrationsDirectory);

  await app.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
  });

  registerHealthRoutes(app, database);
  registerAuthRoutes(app, database, config);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof Error && 'validation' in error) {
      void reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'The request body is invalid.',
        },
      });
      return;
    }

    app.log.error({ err: error }, 'Unhandled request error');
    void reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'WatchDog could not complete the request.',
      },
    });
  });

  app.addHook('onClose', async () => {
    database.close();
  });

  return app;
}
