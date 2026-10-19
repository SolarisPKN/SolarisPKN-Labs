-- 0001: SolarisPKN ID, private D1 storage.
-- Never include user data, tokens or production database snapshots in Git.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  alias TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  disabled_at INTEGER,
  CHECK(alias IS NULL OR length(alias) BETWEEN 3 AND 32)
);
CREATE TABLE IF NOT EXISTS identities (
  provider TEXT NOT NULL,
  subject_digest TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(provider, subject_digest)
);
CREATE INDEX IF NOT EXISTS idx_identities_user ON identities(user_id);
CREATE TABLE IF NOT EXISTS oauth_flows (
  state_digest TEXT PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL,
  pkce_verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  consumed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_oauth_flows_created ON oauth_flows(created_at);
CREATE TABLE IF NOT EXISTS sessions (
  token_digest TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS rate_buckets (
  bucket TEXT NOT NULL,
  window INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(bucket, window)
);
CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, project)
);
CREATE TABLE IF NOT EXISTS follows (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, project)
);
CREATE TABLE IF NOT EXISTS preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'es' CHECK(language IN ('es', 'en')),
  theme TEXT NOT NULL DEFAULT 'system' CHECK(theme IN ('system', 'dark', 'light'))
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_slug TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_comments_public ON comments(post_slug, status, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_owner ON comments(user_id, created_at);
-- No PII, OAuth credentials, plaintext tokens or user IP addresses are stored in these tables.
