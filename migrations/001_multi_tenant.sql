-- LinkLeaf hosted (multi-tenant) schema.
-- Mirrors server/db.js's single-tenant SQLite tables, reshaped so every row
-- hangs off a page_id/user_id instead of being a single global row.
-- Only applied when APP_MODE=multi. Safe to re-run (IF NOT EXISTS everywhere).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL,
  plan              TEXT NOT NULL DEFAULT 'free', -- free | starter | pro | premium | lifetime
  whop_customer_id  TEXT,
  whop_subscription_id TEXT,
  lifetime_seat_no  INTEGER, -- set only for plan='lifetime', 1..100, enforces the founder cap
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_lifetime_seat ON users (lifetime_seat_no) WHERE lifetime_seat_no IS NOT NULL;

CREATE TABLE IF NOT EXISTS pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '' CHECK (char_length(bio) <= 160),
  avatar        TEXT NOT NULL DEFAULT '',
  socials       JSONB NOT NULL DEFAULT '{}',
  theme         TEXT NOT NULL DEFAULT 'gradient', -- gradient|glass|minimal|dark|neon|paper
  accent        TEXT NOT NULL DEFAULT '#f97316',  -- LinkLeaf orange, not Linktree purple
  bg_type       TEXT NOT NULL DEFAULT 'theme',    -- theme|color|gradient|image
  bg_value      TEXT NOT NULL DEFAULT '',
  font          TEXT NOT NULL DEFAULT 'system',
  custom_css    TEXT NOT NULL DEFAULT '',
  seo_title     TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_user ON pages (user_id);
CREATE INDEX IF NOT EXISTS idx_pages_username ON pages (username);

CREATE TABLE IF NOT EXISTS blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'link', -- link | header | youtube | email
  title       TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  thumbnail   TEXT NOT NULL DEFAULT '',
  animate     BOOLEAN NOT NULL DEFAULT false,
  position    INTEGER NOT NULL DEFAULT 0,
  start_at    TIMESTAMPTZ,
  end_at      TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks (page_id);

CREATE TABLE IF NOT EXISTS clicks (
  id        BIGSERIAL PRIMARY KEY,
  block_id  UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  ts        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clicks_block ON clicks (block_id);
CREATE INDEX IF NOT EXISTS idx_clicks_ts ON clicks (ts);

CREATE TABLE IF NOT EXISTS views (
  id        BIGSERIAL PRIMARY KEY,
  page_id   UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  ts        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_views_page ON views (page_id);
CREATE INDEX IF NOT EXISTS idx_views_ts ON views (ts);

CREATE TABLE IF NOT EXISTS subscribers (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id   UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  block_id  UUID REFERENCES blocks(id) ON DELETE SET NULL,
  email     TEXT NOT NULL,
  ts        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, email)
);

-- Sessions replace the old in-memory Set — must survive restarts and be
-- scoped to a single user so tenants can never see each other's session.
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY, -- random hex token, doubles as the cookie value
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

COMMIT;
