CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS oauth_states_expires_at_idx
  ON oauth_states (expires_at);
