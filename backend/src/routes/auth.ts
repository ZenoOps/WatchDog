import { randomUUID } from 'node:crypto';

import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { WatchDogConfig } from '../config.js';
import type { AuthenticatedSession, PublicUser, WatchDogDatabase } from '../database.js';
import {
  consumePasswordVerificationTime,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from '../security.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMUM_PASSWORD_LENGTH = 8;
const MAXIMUM_PASSWORD_LENGTH = 256;

type SignupBody = {
  name: string;
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
  remember?: boolean;
};

type SessionResponse = {
  token: string;
  expiresAt: string;
  user: PublicUser;
};

const signupSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 80 },
      email: { type: 'string', minLength: 3, maxLength: 254 },
      password: { type: 'string', minLength: MINIMUM_PASSWORD_LENGTH, maxLength: MAXIMUM_PASSWORD_LENGTH },
    },
  },
} as const;

const loginSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', minLength: 3, maxLength: 254 },
      password: { type: 'string', minLength: 1, maxLength: MAXIMUM_PASSWORD_LENGTH },
      remember: { type: 'boolean' },
    },
  },
} as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function errorResponse(code: string, message: string): { error: { code: string; message: string } } {
  return { error: { code, message } };
}

function sessionExpiry(config: WatchDogConfig, remember: boolean, now: Date): Date {
  const duration = remember
    ? config.rememberDays * 24 * 60 * 60 * 1_000
    : config.sessionHours * 60 * 60 * 1_000;
  return new Date(now.getTime() + duration);
}

function createSession(
  database: WatchDogDatabase,
  config: WatchDogConfig,
  user: PublicUser,
  remember: boolean,
): SessionResponse {
  const now = new Date();
  const expiresAt = sessionExpiry(config, remember, now).toISOString();
  const { token, tokenHash } = createSessionToken();

  database.createSession({
    id: randomUUID(),
    userId: user.id,
    tokenHash,
    createdAt: now.toISOString(),
    expiresAt,
    rememberMe: remember,
  });

  return { token, expiresAt, user };
}

function bearerToken(request: FastifyRequest): string | null {
  const authorization = request.headers.authorization;
  if (!authorization) {
    return null;
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    return null;
  }

  return token;
}

function authenticate(database: WatchDogDatabase, request: FastifyRequest): {
  token: string;
  session: AuthenticatedSession;
} | null {
  const token = bearerToken(request);
  if (!token) {
    return null;
  }

  const session = database.findSession(hashSessionToken(token), new Date().toISOString());
  return session ? { token, session } : null;
}

export function registerAuthRoutes(
  app: FastifyInstance,
  database: WatchDogDatabase,
  config: WatchDogConfig,
): void {
  app.get('/auth/setup', async () => ({ signupAllowed: database.userCount() === 0 }));

  app.post<{ Body: SignupBody }>('/auth/signup', { schema: signupSchema }, async (request, reply) => {
    const name = request.body.name.trim();
    const email = normalizeEmail(request.body.email);

    if (name.length < 2) {
      return reply.code(400).send(errorResponse('INVALID_NAME', 'Enter your full name.'));
    }

    if (!EMAIL_PATTERN.test(email)) {
      return reply.code(400).send(errorResponse('INVALID_EMAIL', 'Enter a valid email address.'));
    }

    if (database.userCount() !== 0) {
      return reply
        .code(409)
        .send(errorResponse('SETUP_COMPLETE', 'WatchDog already has an owner. Log in with that account.'));
    }

    const passwordHash = await hashPassword(request.body.password);
    const now = new Date().toISOString();

    try {
      const user = database.transaction(() => {
        if (database.userCount() !== 0) {
          throw new Error('SETUP_COMPLETE');
        }

        return database.createUser({
          id: randomUUID(),
          name,
          email,
          passwordHash,
          createdAt: now,
        });
      });

      return reply.code(201).send(createSession(database, config, user, true));
    } catch (error) {
      if (error instanceof Error && error.message === 'SETUP_COMPLETE') {
        return reply
          .code(409)
          .send(errorResponse('SETUP_COMPLETE', 'WatchDog already has an owner. Log in with that account.'));
      }
      throw error;
    }
  });

  app.post<{ Body: LoginBody }>('/auth/login', { schema: loginSchema }, async (request, reply) => {
    const email = normalizeEmail(request.body.email);
    const user = EMAIL_PATTERN.test(email) ? database.findUserByEmail(email) : null;

    if (!user) {
      await consumePasswordVerificationTime(request.body.password);
      return reply
        .code(401)
        .send(errorResponse('INVALID_CREDENTIALS', 'The email or password is incorrect.'));
    }

    const passwordMatches = await verifyPassword(user.passwordHash, request.body.password);
    if (!passwordMatches) {
      return reply
        .code(401)
        .send(errorResponse('INVALID_CREDENTIALS', 'The email or password is incorrect.'));
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return createSession(database, config, safeUser, request.body.remember ?? false);
  });

  app.get('/auth/me', async (request, reply) => {
    const authenticated = authenticate(database, request);
    if (!authenticated) {
      return reply.code(401).send(errorResponse('UNAUTHORIZED', 'A valid session is required.'));
    }

    return {
      user: authenticated.session.user,
      expiresAt: authenticated.session.expiresAt,
    };
  });

  app.post('/auth/logout', async (request, reply) => {
    const authenticated = authenticate(database, request);
    if (!authenticated) {
      return reply.code(401).send(errorResponse('UNAUTHORIZED', 'A valid session is required.'));
    }

    database.deleteSession(hashSessionToken(authenticated.token));
    return reply.code(204).send();
  });
}
