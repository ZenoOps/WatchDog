import { createHash, randomBytes, randomUUID } from 'node:crypto';

import * as argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} satisfies argon2.HashOptions;

let dummyPasswordHash: Promise<string> | undefined;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}

export async function consumePasswordVerificationTime(password: string): Promise<void> {
  dummyPasswordHash ??= hashPassword(`watchdog-dummy-${randomUUID()}`);
  await verifyPassword(await dummyPasswordHash, password);
}

export function createSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashSessionToken(token) };
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
