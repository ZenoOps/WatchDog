import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';

import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import type { WatchDogConfig } from '../src/config.js';

const testConfig: WatchDogConfig = {
  host: '127.0.0.1',
  port: 4000,
  databasePath: ':memory:',
  sessionHours: 12,
  rememberDays: 30,
  corsOrigins: ['http://localhost:8081'],
  logLevel: 'silent',
};

let app: FastifyInstance;

before(async () => {
  app = await buildApp({
    config: testConfig,
    logger: false,
    migrationsDirectory: resolve(process.cwd(), 'migrations'),
  });
  await app.ready();
});

after(async () => {
  await app.close();
});

test('health and readiness endpoints report a working API and SQLite database', async () => {
  const health = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().status, 'ok');

  const ready = await app.inject({ method: 'GET', url: '/ready' });
  assert.equal(ready.statusCode, 200);
  assert.deepEqual(ready.json(), { status: 'ready', database: 'sqlite' });
});

test('only the first owner can sign up and sessions can be revoked', async () => {
  const setupBefore = await app.inject({ method: 'GET', url: '/auth/setup' });
  assert.deepEqual(setupBefore.json(), { signupAllowed: true });

  const signup = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: {
      name: 'Zeno Ops',
      email: 'ZENO@example.com',
      password: 'correct-horse-battery-staple',
    },
  });
  assert.equal(signup.statusCode, 201);
  const signupBody = signup.json();
  assert.equal(signupBody.user.email, 'zeno@example.com');
  assert.equal(typeof signupBody.token, 'string');
  assert.ok(signupBody.token.length > 30);

  const secondSignup = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: {
      name: 'Another User',
      email: 'another@example.com',
      password: 'another-long-password',
    },
  });
  assert.equal(secondSignup.statusCode, 409);
  assert.equal(secondSignup.json().error.code, 'SETUP_COMPLETE');

  const setupAfter = await app.inject({ method: 'GET', url: '/auth/setup' });
  assert.deepEqual(setupAfter.json(), { signupAllowed: false });

  const me = await app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: { authorization: `Bearer ${signupBody.token}` },
  });
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().user.name, 'Zeno Ops');

  const logout = await app.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { authorization: `Bearer ${signupBody.token}` },
  });
  assert.equal(logout.statusCode, 204);

  const meAfterLogout = await app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: { authorization: `Bearer ${signupBody.token}` },
  });
  assert.equal(meAfterLogout.statusCode, 401);
});

test('login rejects invalid credentials and returns a new session for the owner', async () => {
  const invalid = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'zeno@example.com',
      password: 'wrong-password',
    },
  });
  assert.equal(invalid.statusCode, 401);
  assert.equal(invalid.json().error.code, 'INVALID_CREDENTIALS');

  const login = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'zeno@example.com',
      password: 'correct-horse-battery-staple',
      remember: true,
    },
  });
  assert.equal(login.statusCode, 200);
  assert.equal(login.json().user.email, 'zeno@example.com');
  assert.equal(typeof login.json().expiresAt, 'string');
});
