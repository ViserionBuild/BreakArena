-- ============================================================
-- BreakArena — Production Setup Script
-- 01_setup.sql
--
-- Run this on a FRESH database to build the entire schema.
-- Order: Extensions → Tables → Indexes → Triggers → Views → RLS
--
-- Compatible with: PostgreSQL 14+ / Supabase
-- Timezone: Asia/Kolkata (IST) for all timestamps
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- SECTION 1: EXTENSIONS
-- ════════════════════════════════════════════════════════════

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Case-insensitive text (useful for player name lookups)
CREATE EXTENSION IF NOT EXISTS "citext";

-- Password hashing (bcrypt via crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ════════════════════════════════════════════════════════════
-- SECTION 2: TABLES
-- ════════════════════════════════════════════════════════════

-- ── groups ───────────────────────────────────────────────────
-- Each group is an isolated namespace for players and matches.
CREATE TABLE IF NOT EXISTS groups (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(80) NOT NULL UNIQUE,
    passcode_hash TEXT        NOT NULL,               -- bcrypt hash stored by backend
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP   NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at    TIMESTAMP   NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- ── players ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(80) NOT NULL,
    avatar     TEXT,                                  -- emoji or image URL
    color      VARCHAR(7)  NOT NULL DEFAULT '#fbbf24',
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,     -- soft-delete flag
    is_bot     BOOLEAN     NOT NULL DEFAULT FALSE,
    group_id   UUID        REFERENCES groups(id) ON DELETE SET NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- ── matches ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
    id               UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    status           VARCHAR(20) NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'paused', 'completed')),
    group_id         UUID      REFERENCES groups(id) ON DELETE SET NULL,
    winner_id        UUID      REFERENCES players(id) ON DELETE SET NULL,
    sec_winner_id    UUID      REFERENCES players(id) ON DELETE SET NULL,
    third_winner_id  UUID      REFERENCES players(id) ON DELETE SET NULL,
    fourth_winner_id UUID      REFERENCES players(id) ON DELETE SET NULL,
    match_date       DATE      NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Kolkata')::DATE),
    match_number     SMALLINT  NOT NULL DEFAULT 1 CHECK (match_number >= 1),
    total_rounds     SMALLINT  NOT NULL DEFAULT 10 CHECK (total_rounds >= 1 AND total_rounds <= 50),
    -- Seat positions (p1 is the player who starts)
    p1_id            UUID      REFERENCES players(id) ON DELETE SET NULL,
    p1_total_score   NUMERIC(6, 2) NOT NULL DEFAULT 0,
    p2_id            UUID      REFERENCES players(id) ON DELETE SET NULL,
    p2_total_score   NUMERIC(6, 2) NOT NULL DEFAULT 0,
    p3_id            UUID      REFERENCES players(id) ON DELETE SET NULL,
    p3_total_score   NUMERIC(6, 2) NOT NULL DEFAULT 0,
    p4_id            UUID      REFERENCES players(id) ON DELETE SET NULL,
    p4_total_score   NUMERIC(6, 2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    ended_at         TIMESTAMP,
    UNIQUE (match_date, match_number)
);

-- ── rounds ────────────────────────────────────────────────────
-- Per-player bid, actual wins, and cumulative score are stored
-- as flat columns (p1_*, p2_*, …) to avoid a separate junction table.
CREATE TABLE IF NOT EXISTS rounds (
    id             UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id       UUID     NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    round_number   SMALLINT NOT NULL CHECK (round_number >= 1),
    p1_bid         SMALLINT NOT NULL CHECK (p1_bid BETWEEN 0 AND 13),
    p1_actual_wins NUMERIC(5, 1) NOT NULL CHECK (p1_actual_wins BETWEEN -13 AND 13),
    p1_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    p2_bid         SMALLINT NOT NULL CHECK (p2_bid BETWEEN 0 AND 13),
    p2_actual_wins NUMERIC(5, 1) NOT NULL CHECK (p2_actual_wins BETWEEN -13 AND 13),
    p2_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    p3_bid         SMALLINT NOT NULL CHECK (p3_bid BETWEEN 0 AND 13),
    p3_actual_wins NUMERIC(5, 1) NOT NULL CHECK (p3_actual_wins BETWEEN -13 AND 13),
    p3_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    p4_bid         SMALLINT NOT NULL CHECK (p4_bid BETWEEN 0 AND 13),
    p4_actual_wins NUMERIC(5, 1) NOT NULL CHECK (p4_actual_wins BETWEEN -13 AND 13),
    p4_total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    UNIQUE (match_id, round_number)
);


-- ════════════════════════════════════════════════════════════
-- SECTION 3: INDEXES
-- ════════════════════════════════════════════════════════════

-- groups
CREATE INDEX IF NOT EXISTS idx_groups_name      ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);

-- players
CREATE INDEX IF NOT EXISTS idx_players_group_id  ON players(group_id);
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);

-- matches
CREATE INDEX IF NOT EXISTS idx_matches_status     ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_group_id   ON matches(group_id);
CREATE INDEX IF NOT EXISTS idx_matches_p1_id      ON matches(p1_id);
CREATE INDEX IF NOT EXISTS idx_matches_p2_id      ON matches(p2_id);
CREATE INDEX IF NOT EXISTS idx_matches_p3_id      ON matches(p3_id);
CREATE INDEX IF NOT EXISTS idx_matches_p4_id      ON matches(p4_id);

-- rounds
CREATE INDEX IF NOT EXISTS idx_rounds_match_id_round_number ON rounds(match_id, round_number);


-- ════════════════════════════════════════════════════════════
-- SECTION 4: TRIGGERS
-- ════════════════════════════════════════════════════════════

-- Auto-bump groups.updated_at on every UPDATE
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


-- ════════════════════════════════════════════════════════════
-- SECTION 5: VIEWS
-- ════════════════════════════════════════════════════════════

-- ── v_match_players: unpivots p1..p4 seat columns into rows ──
CREATE OR REPLACE VIEW v_match_players AS
SELECT id AS match_id, 1 AS seat_order, p1_id AS player_id, p1_total_score AS total_score
FROM matches WHERE p1_id IS NOT NULL
UNION ALL
SELECT id, 2, p2_id, p2_total_score FROM matches WHERE p2_id IS NOT NULL
UNION ALL
SELECT id, 3, p3_id, p3_total_score FROM matches WHERE p3_id IS NOT NULL
UNION ALL
SELECT id, 4, p4_id, p4_total_score FROM matches WHERE p4_id IS NOT NULL;

-- ── v_round_scores: unpivots round p1..p4 columns into rows ──
CREATE OR REPLACE VIEW v_round_scores AS
SELECT r.id AS round_id, r.match_id, r.round_number,
       m.p1_id AS player_id, 1 AS seat_order,
       r.p1_bid AS bid, r.p1_actual_wins AS actual_wins, r.p1_total_score AS cumulative_score
FROM rounds r JOIN matches m ON m.id = r.match_id WHERE m.p1_id IS NOT NULL
UNION ALL
SELECT r.id, r.match_id, r.round_number,
       m.p2_id, 2, r.p2_bid, r.p2_actual_wins, r.p2_total_score
FROM rounds r JOIN matches m ON m.id = r.match_id WHERE m.p2_id IS NOT NULL
UNION ALL
SELECT r.id, r.match_id, r.round_number,
       m.p3_id, 3, r.p3_bid, r.p3_actual_wins, r.p3_total_score
FROM rounds r JOIN matches m ON m.id = r.match_id WHERE m.p3_id IS NOT NULL
UNION ALL
SELECT r.id, r.match_id, r.round_number,
       m.p4_id, 4, r.p4_bid, r.p4_actual_wins, r.p4_total_score
FROM rounds r JOIN matches m ON m.id = r.match_id WHERE m.p4_id IS NOT NULL;

-- ── v_match_scores: latest cumulative score per player per match ──
CREATE OR REPLACE VIEW v_match_scores AS
SELECT
    vmp.match_id,
    vmp.player_id,
    p.name         AS player_name,
    p.avatar       AS player_avatar,
    vmp.seat_order,
    vmp.total_score AS cumulative_score,
    (SELECT COUNT(*) FROM rounds r WHERE r.match_id = vmp.match_id) AS rounds_played
FROM v_match_players vmp
JOIN players p ON p.id = vmp.player_id;

-- ── v_match_rankings: live rank within each match ─────────────
CREATE OR REPLACE VIEW v_match_rankings AS
SELECT
    match_id,
    player_id,
    player_name,
    player_avatar,
    cumulative_score,
    rounds_played,
    RANK() OVER (
        PARTITION BY match_id
        ORDER BY cumulative_score DESC
    ) AS current_rank
FROM v_match_scores;

-- ── v_player_stats: lifetime stats per player ────────────────
CREATE OR REPLACE VIEW v_player_stats AS
SELECT
    p.id                                                         AS player_id,
    p.name,
    p.avatar,
    p.color,
    p.group_id,
    COUNT(DISTINCT vmp.match_id)                                 AS total_matches,
    COUNT(DISTINCT CASE
        WHEN m.status = 'completed' AND m.winner_id = p.id
        THEN m.id END)                                           AS matches_won,
    ROUND(
        COUNT(DISTINCT CASE WHEN m.status = 'completed' AND m.winner_id = p.id THEN m.id END)::NUMERIC
        / NULLIF(COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END), 0) * 100,
        1
    )                                                            AS win_percentage,
    COALESCE(MAX(vmp.total_score), 0)                            AS total_score,
    COUNT(DISTINCT r.id)                                         AS total_rounds,
    ROUND(
        COALESCE(MAX(vmp.total_score), 0)
        / NULLIF(COUNT(DISTINCT r.id), 0),
        2
    )                                                            AS avg_score_per_round
FROM players p
LEFT JOIN v_match_players vmp ON vmp.player_id = p.id
LEFT JOIN matches m           ON m.id = vmp.match_id
LEFT JOIN rounds r            ON r.match_id = vmp.match_id
GROUP BY p.id, p.name, p.avatar, p.color, p.group_id;


-- ════════════════════════════════════════════════════════════
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════
-- All tables use open public policies (read/write) because the
-- application enforces group-level auth via JWT in the backend.
-- Tighten these if you move auth into Supabase in the future.

-- Enable RLS
ALTER TABLE groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds  ENABLE ROW LEVEL SECURITY;

-- groups
CREATE POLICY "groups_select_public" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert_public" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update_public" ON groups FOR UPDATE USING (true);
CREATE POLICY "groups_delete_public" ON groups FOR DELETE USING (true);

-- players
CREATE POLICY "players_select_public" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert_public" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update_public" ON players FOR UPDATE USING (true);
CREATE POLICY "players_delete_public" ON players FOR DELETE USING (true);

-- matches
CREATE POLICY "matches_select_public" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert_public" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "matches_update_public" ON matches FOR UPDATE USING (true);
CREATE POLICY "matches_delete_public" ON matches FOR DELETE USING (true);

-- rounds
CREATE POLICY "rounds_select_public" ON rounds FOR SELECT USING (true);
CREATE POLICY "rounds_insert_public" ON rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "rounds_update_public" ON rounds FOR UPDATE USING (true);
CREATE POLICY "rounds_delete_public" ON rounds FOR DELETE USING (true);
