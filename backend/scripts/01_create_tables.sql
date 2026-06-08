-- ============================================================
-- 00_extensions.sql
-- Enable required PostgreSQL extensions.
-- Run this FIRST before any other scripts.
-- ============================================================

-- UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- For case-insensitive text matching (optional, useful for player name search)
CREATE EXTENSION IF NOT EXISTS "citext";



-- ============================================================
-- 01_create_tables.sql
-- Creates all core tables for the Call Break Scoreboard tool.
-- Run AFTER 00_extensions.sql
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- players (Players)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(80) NOT NULL,
    avatar      TEXT,                        -- emoji or image URL
    color       VARCHAR(7)  NOT NULL DEFAULT '#fbbf24',
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    is_bot      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- ──────────────────────────────────────────────────────────
-- MATCHES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    status      VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'paused', 'completed')),
    winner_id   UUID        REFERENCES players(id) ON DELETE SET NULL,
    sec_winner_id UUID        REFERENCES players(id) ON DELETE SET NULL,
    third_winner_id UUID        REFERENCES players(id) ON DELETE SET NULL,
    fourth_winner_id UUID        REFERENCES players(id) ON DELETE SET NULL,
    match_date   DATE        NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Kolkata')::DATE),
    match_number SMALLINT    NOT NULL CHECK (match_number >= 1) DEFAULT 1,
    total_rounds SMALLINT    NOT NULL DEFAULT 10 CHECK (total_rounds >= 1 AND total_rounds <= 50),
    p1_id UUID REFERENCES players(id) ON DELETE SET NULL, -- p1 is the player who starts the match
    p1_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- Total sum till this round for p1
    p2_id UUID REFERENCES players(id) ON DELETE SET NULL, -- p2 2nd player, order wise 
    p2_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- Total sum till this round for p2
    p3_id UUID REFERENCES players(id) ON DELETE SET NULL, -- p3 3rd player, order wise 
    p3_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- Total sum till this round for p3
    p4_id UUID REFERENCES players(id) ON DELETE SET NULL, -- p4 4th player, order wise 
    p4_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- Total sum till this round for p4
    created_at   TIMESTAMP   NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    ended_at     TIMESTAMP,
    UNIQUE (match_date, match_number)
);

-- ──────────────────────────────────────────────────────────
-- ROUNDS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rounds (
    id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id      UUID      NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    round_number  SMALLINT  NOT NULL CHECK (round_number >= 1),
    p1_bid        SMALLINT  NOT NULL CHECK (p1_bid BETWEEN 0 AND 13),
    p1_actual_wins NUMERIC(5, 1)  NOT NULL CHECK (p1_actual_wins BETWEEN -13 AND 13),
    p1_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- Total sum till this round for p1
    p2_bid        SMALLINT  NOT NULL CHECK (p2_bid BETWEEN 0 AND 13),
    p2_actual_wins NUMERIC(5, 1)  NOT NULL CHECK (p2_actual_wins BETWEEN -13 AND 13),
    p2_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- Total sum till this round for p2
    p3_bid        SMALLINT  NOT NULL CHECK (p3_bid BETWEEN 0 AND 13),
    p3_actual_wins NUMERIC(5, 1)  NOT NULL CHECK (p3_actual_wins BETWEEN -13 AND 13),
    p3_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- Total sum till this round for p3
    p4_bid        SMALLINT  NOT NULL CHECK (p4_bid BETWEEN 0 AND 13),
    p4_actual_wins NUMERIC(5, 1)  NOT NULL CHECK (p4_actual_wins BETWEEN -13 AND 13),
    p4_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,    -- Total sum till this round for p4
    created_at    TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    UNIQUE (match_id, round_number)
);

-- round_scores table removed: per-player bid/wins/score are now columns on the rounds table (p1_bid, p1_actual_wins, p1_total_score, etc.)
