CREATE TABLE IF NOT EXISTS instagram_content_plans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  content_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ideia',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT instagram_content_plans_type_check
    CHECK (content_type IN ('post', 'reels', 'story', 'carrossel')),
  CONSTRAINT instagram_content_plans_status_check
    CHECK (status IN ('ideia', 'planejado', 'publicado', 'cancelado'))
);

CREATE INDEX IF NOT EXISTS instagram_content_plans_account_schedule_idx
  ON instagram_content_plans (user_id, instagram_account_id, scheduled_at);

CREATE INDEX IF NOT EXISTS instagram_content_plans_account_status_idx
  ON instagram_content_plans (user_id, instagram_account_id, status);
