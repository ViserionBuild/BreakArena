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

-- Find all matches a player is in (via p1..p4 columns)
CREATE INDEX IF NOT EXISTS idx_matches_p1_id ON matches(p1_id);
CREATE INDEX IF NOT EXISTS idx_matches_p2_id ON matches(p2_id);
CREATE INDEX IF NOT EXISTS idx_matches_p3_id ON matches(p3_id);
CREATE INDEX IF NOT EXISTS idx_matches_p4_id ON matches(p4_id);

-- Rounds ordered within a match
CREATE INDEX IF NOT EXISTS idx_rounds_match_id_round_number
    ON rounds(match_id, round_number);

-- round_scores table removed; scores are now columns on the rounds table
