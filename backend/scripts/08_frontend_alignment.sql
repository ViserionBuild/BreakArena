-- ============================================================
-- 08_frontend_alignment.sql
-- Aligns DB schema with the React frontend requirements.
-- Run on an existing database after 01_create_tables.sql
-- ============================================================

-- Player color (used for charts / avatars in UI)
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS color VARCHAR(7) NOT NULL DEFAULT '#fbbf24';

-- Match total rounds (pre-created empty round rows)
ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS total_rounds SMALLINT NOT NULL DEFAULT 10
        CHECK (total_rounds >= 1 AND total_rounds <= 50);

-- Allow bid = 0 for empty cells; support decimal / negative actual wins
ALTER TABLE round_scores DROP CONSTRAINT IF EXISTS round_scores_bid_check;
ALTER TABLE round_scores DROP CONSTRAINT IF EXISTS round_scores_actual_wins_check;

ALTER TABLE round_scores
    ALTER COLUMN bid TYPE SMALLINT,
    ALTER COLUMN actual_wins TYPE NUMERIC(5, 1);

ALTER TABLE round_scores
    ADD CONSTRAINT round_scores_bid_check CHECK (bid BETWEEN 0 AND 13);

ALTER TABLE round_scores
    ADD CONSTRAINT round_scores_actual_wins_check CHECK (actual_wins BETWEEN -13 AND 13);
