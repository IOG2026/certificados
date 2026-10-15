export const authSchema = [
  `CREATE TABLE IF NOT EXISTS io_users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','operator')),
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS io_sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES io_users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS io_sessions_user ON io_sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS io_login_attempts (
    key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL
  )`,
];
