-- ============================================================
-- 02_indexes.sql
-- Performance indexes for common query patterns.
-- Run AFTER 01_create_tables.sql
-- ============================================================

-- Match lookups by status (e.g. listing active matches)
CREATE INDEX IF NOT EXISTS idx_matches_status
    ON matches(status);

-- Match history sorted by creation time
CREATE INDEX IF NOT EXISTS idx_matches_created_at
    ON matches(created_at DESC);

-- Find all matches a player is in
CREATE INDEX IF NOT EXISTS idx_match_players_user_id
    ON match_players(user_id);

-- Find all players in a match (common join)
CREATE INDEX IF NOT EXISTS idx_match_players_match_id
    ON match_players(match_id);

-- Rounds ordered within a match
CREATE INDEX IF NOT EXISTS idx_rounds_match_id_round_number
    ON rounds(match_id, round_number);

-- Score lookup by round
CREATE INDEX IF NOT EXISTS idx_round_scores_round_id
    ON round_scores(round_id);

-- Score lookup by player (for stats)
CREATE INDEX IF NOT EXISTS idx_round_scores_user_id
    ON round_scores(user_id);
