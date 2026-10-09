import type { FastifyInstance } from 'fastify';

import type { WatchDogDatabase } from '../database.js';

export function registerHealthRoutes(app: FastifyInstance, database: WatchDogDatabase): void {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'watchdog-backend',
    timestamp: new Date().toISOString(),
  }));

  app.get('/ready', async (_request, reply) => {
    try {
      database.ping();
      return { status: 'ready', database: 'sqlite' };
    } catch (error) {
      app.log.error({ err: error }, 'SQLite readiness check failed');
      return reply.code(503).send({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'The WatchDog database is unavailable.',
        },
      });
    }
  });
}
