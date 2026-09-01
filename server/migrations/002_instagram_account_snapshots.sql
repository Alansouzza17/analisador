CREATE TABLE IF NOT EXISTS instagram_account_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER NOT NULL CHECK (followers_count >= 0),
  follows_count INTEGER NOT NULL CHECK (follows_count >= 0),
  media_count INTEGER NOT NULL CHECK (media_count >= 0),
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS instagram_account_snapshots_account_date_idx
  ON instagram_account_snapshots (instagram_account_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS instagram_account_snapshots_user_account_date_idx
  ON instagram_account_snapshots (user_id, instagram_account_id, captured_at DESC);
