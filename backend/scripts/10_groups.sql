-- ============================================================
-- 10_groups.sql
-- Adds group-based access control to BreakArena.
--
-- 1. Creates `groups` table (id, name, passcode_hash, is_active, timestamps)
-- 2. Adds nullable `group_id` FK column to `matches`
--
-- Run in Supabase SQL editor (or psql) AFTER the existing migrations.
-- ============================================================

-- ── Enable pgcrypto for password hashing (needed for crypt/gen_salt) ──────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Groups table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(80) NOT NULL UNIQUE,
    passcode_hash   TEXT        NOT NULL,               -- bcrypt hash stored by backend
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP   NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at      TIMESTAMP   NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'Asia/Kolkata';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Add group_id FK to matches ────────────────────────────────────────────────
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_group_id ON matches(group_id);

-- ── Add group_id FK to players ────────────────────────────────────────────────
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_players_group_id ON players(group_id);

-- ── Indexes on groups ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_groups_name      ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);
