-- ============================================================
-- 01_create_tables.sql
-- Creates all core tables for the Call Break Scoreboard tool.
-- Run AFTER 00_extensions.sql
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- USERS (Players)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(80) NOT NULL,
    avatar      TEXT,                        -- URL to avatar image
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- MATCHES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    status      VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'paused', 'completed')),
    winner_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ
);

-- ──────────────────────────────────────────────────────────
-- MATCH_PLAYERS  (junction: match ↔ users, preserves seat order)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_players (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id    UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    seat_order  SMALLINT    NOT NULL CHECK (seat_order BETWEEN 1 AND 4),
    UNIQUE (match_id, user_id),
    UNIQUE (match_id, seat_order)
);

-- ──────────────────────────────────────────────────────────
-- ROUNDS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rounds (
    id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id      UUID      NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    round_number  SMALLINT  NOT NULL CHECK (round_number >= 1),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (match_id, round_number)
);

-- ──────────────────────────────────────────────────────────
-- ROUND_SCORES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS round_scores (
    id           UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id     UUID     NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    user_id      UUID     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    bid          SMALLINT NOT NULL CHECK (bid BETWEEN 1 AND 13),
    actual_wins  SMALLINT NOT NULL CHECK (actual_wins BETWEEN 0 AND 13),
    score        NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- calculated by the app
    UNIQUE (round_id, user_id)
);
