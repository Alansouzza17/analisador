ALTER TABLE instagram_accounts
  ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT;

ALTER TABLE instagram_accounts
  ADD COLUMN IF NOT EXISTS token_last_error_at TIMESTAMPTZ;
