CREATE TABLE IF NOT EXISTS instagram_competitor_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(160),
  notes VARCHAR(2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, instagram_account_id, username)
);

CREATE INDEX IF NOT EXISTS instagram_competitor_profiles_account_idx
  ON instagram_competitor_profiles (user_id, instagram_account_id, created_at DESC);
