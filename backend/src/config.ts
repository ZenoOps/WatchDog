import { isAbsolute, resolve } from 'node:path';

export type WatchDogConfig = {
  host: string;
  port: number;
  databasePath: string;
  sessionHours: number;
  rememberDays: number;
  corsOrigins: string[];
  logLevel: string;
};

function positiveNumber(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return parsed;
}

function databasePath(value: string | undefined): string {
  const configured = value?.trim() || './data/watchdog.db';
  if (configured === ':memory:' || isAbsolute(configured)) {
    return configured;
  }

  return resolve(process.cwd(), configured);
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): WatchDogConfig {
  const port = positiveNumber(environment.WATCHDOG_PORT, 4000, 'WATCHDOG_PORT');
  if (!Number.isInteger(port) || port > 65_535) {
    throw new Error('WATCHDOG_PORT must be an integer between 1 and 65535.');
  }

  return {
    host: environment.WATCHDOG_HOST?.trim() || '0.0.0.0',
    port,
    databasePath: databasePath(environment.WATCHDOG_DATABASE_PATH),
    sessionHours: positiveNumber(environment.WATCHDOG_SESSION_HOURS, 12, 'WATCHDOG_SESSION_HOURS'),
    rememberDays: positiveNumber(environment.WATCHDOG_REMEMBER_DAYS, 30, 'WATCHDOG_REMEMBER_DAYS'),
    corsOrigins: (environment.WATCHDOG_CORS_ORIGINS || 'http://localhost:8081,http://localhost:19006')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    logLevel: environment.WATCHDOG_LOG_LEVEL?.trim() || 'info',
  };
}
