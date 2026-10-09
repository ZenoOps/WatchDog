# WatchDog backend

The backend is a TypeScript and Fastify API backed by a local SQLite database. It currently provides health checks and single-owner authentication.

## Requirements

- Node.js 22.13 or newer

No separate database server or container is required.

## Run locally

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API listens on `0.0.0.0:4000` by default so a phone on the same LAN can reach it.

Verify it from the development computer:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/ready
```

## Authentication behavior

- `POST /auth/signup` creates the first and only owner account.
- Further signup attempts are rejected after the owner exists.
- `POST /auth/login` creates a revocable session.
- `GET /auth/me` validates a bearer session token.
- `POST /auth/logout` revokes the current session.
- Passwords are hashed with Argon2id.
- Only SHA-256 hashes of session tokens are stored in SQLite.

The SQLite database is created at `backend/data/watchdog.db` by default. The database and its WAL files are ignored by Git.

## Test and build

```bash
npm run typecheck
npm test
npm run build
```

## Back up the database

Stop the backend before making a simple file-level backup, then copy `data/watchdog.db` to a protected backup location. The database contains account and session information and must be treated as sensitive.
