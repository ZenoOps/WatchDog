import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type UserWithPassword = PublicUser & {
  passwordHash: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
};

type SessionUserRow = UserRow & {
  session_id: string;
  session_expires_at: string;
};

export type AuthenticatedSession = {
  id: string;
  expiresAt: string;
  user: PublicUser;
};

function publicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

function userWithPassword(row: UserRow): UserWithPassword {
  return {
    ...publicUser(row),
    passwordHash: row.password_hash,
  };
}

export class WatchDogDatabase {
  readonly connection: DatabaseSync;

  constructor(path: string, migrationsDirectory = resolve(process.cwd(), 'migrations')) {
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true });
    }

    this.connection = new DatabaseSync(path, {
      enableForeignKeyConstraints: true,
      enableDoubleQuotedStringLiterals: false,
    });
    this.connection.exec('PRAGMA busy_timeout = 5000;');
    this.connection.exec('PRAGMA journal_mode = WAL;');
    this.connection.exec('PRAGMA synchronous = NORMAL;');
    this.runMigrations(migrationsDirectory);
  }

  private runMigrations(directory: string): void {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      ) STRICT;
    `);

    const applied = new Set(
      this.connection
        .prepare('SELECT name FROM schema_migrations')
        .all()
        .map((row) => String((row as { name: string }).name)),
    );

    const migrationFiles = readdirSync(directory)
      .filter((name) => /^\d+_.+\.sql$/.test(name))
      .sort();

    for (const name of migrationFiles) {
      if (applied.has(name)) {
        continue;
      }

      const sql = readFileSync(resolve(directory, name), 'utf8');
      this.transaction(() => {
        this.connection.exec(sql);
        this.connection
          .prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)')
          .run(name, new Date().toISOString());
      });
    }
  }

  transaction<T>(operation: () => T): T {
    this.connection.exec('BEGIN IMMEDIATE;');
    try {
      const result = operation();
      this.connection.exec('COMMIT;');
      return result;
    } catch (error) {
      this.connection.exec('ROLLBACK;');
      throw error;
    }
  }

  ping(): void {
    this.connection.prepare('SELECT 1').get();
  }

  userCount(): number {
    const row = this.connection.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    return Number(row.count);
  }

  createUser(input: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: string;
  }): PublicUser {
    this.connection
      .prepare(
        `INSERT INTO users (id, name, email, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(input.id, input.name, input.email, input.passwordHash, input.createdAt);

    return {
      id: input.id,
      name: input.name,
      email: input.email,
      createdAt: input.createdAt,
    };
  }

  findUserByEmail(email: string): UserWithPassword | null {
    const row = this.connection
      .prepare(
        `SELECT id, name, email, password_hash, created_at
         FROM users
         WHERE email = ?`,
      )
      .get(email) as UserRow | undefined;

    return row ? userWithPassword(row) : null;
  }

  createSession(input: {
    id: string;
    userId: string;
    tokenHash: string;
    createdAt: string;
    expiresAt: string;
    rememberMe: boolean;
  }): void {
    this.connection
      .prepare(
        `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, remember_me)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.id,
        input.userId,
        input.tokenHash,
        input.createdAt,
        input.expiresAt,
        input.rememberMe ? 1 : 0,
      );
  }

  findSession(tokenHash: string, now: string): AuthenticatedSession | null {
    this.connection.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);

    const row = this.connection
      .prepare(
        `SELECT
           sessions.id AS session_id,
           sessions.expires_at AS session_expires_at,
           users.id,
           users.name,
           users.email,
           users.password_hash,
           users.created_at
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
      )
      .get(tokenHash, now) as SessionUserRow | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.session_id,
      expiresAt: row.session_expires_at,
      user: publicUser(row),
    };
  }

  deleteSession(tokenHash: string): void {
    this.connection.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  }

  close(): void {
    this.connection.close();
  }
}
