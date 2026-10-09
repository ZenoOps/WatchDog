CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  remember_me INTEGER NOT NULL DEFAULT 0 CHECK (remember_me IN (0, 1))
) STRICT;

CREATE INDEX sessions_user_id_index ON sessions(user_id);
CREATE INDEX sessions_expires_at_index ON sessions(expires_at);
