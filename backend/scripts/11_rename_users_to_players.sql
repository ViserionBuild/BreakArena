-- ============================================================
-- 11_rename_players_to_players.sql
-- Renames the `players` table to `players` throughout the schema.
--
-- Run in Supabase SQL editor (or psql) AFTER all previous migrations.
-- ============================================================

-- ── 1. Rename the table ───────────────────────────────────────────────────────
ALTER TABLE players RENAME TO players;

-- ── 2. Rename the primary index (Postgres auto-names it players_pkey) ──────────
ALTER INDEX IF EXISTS players_pkey RENAME TO players_pkey;

-- ── 3. Rename group_id index created in 10_groups.sql ────────────────────────
ALTER INDEX IF EXISTS idx_players_group_id RENAME TO idx_players_group_id;

-- ── 4. Rename RLS policies (drop old, recreate on new name) ──────────────────
-- SELECT
DROP POLICY IF EXISTS "players_select_public" ON players;
CREATE POLICY "players_select_public"
    ON players FOR SELECT
    USING (true);

-- INSERT
DROP POLICY IF EXISTS "players_insert_public" ON players;
CREATE POLICY "players_insert_public"
    ON players FOR INSERT
    WITH CHECK (true);

-- UPDATE
DROP POLICY IF EXISTS "players_update_public" ON players;
CREATE POLICY "players_update_public"
    ON players FOR UPDATE
    USING (true);

-- DELETE
DROP POLICY IF EXISTS "players_delete_public" ON players;
CREATE POLICY "players_delete_public"
    ON players FOR DELETE
    USING (true);

-- ── 5. Recreate views that reference the old table name ───────────────────────
-- CASCADE drops v_match_scores, v_match_rankings, v_player_stats automatically
DROP VIEW IF EXISTS v_match_players CASCADE;
DROP VIEW IF EXISTS v_round_scores  CASCADE;

-- Recreate v_match_players
CREATE OR REPLACE VIEW v_match_players AS
SELECT id AS match_id, 1 AS seat_order, p1_id AS user_id, p1_total_score AS total_score FROM matches WHERE p1_id IS NOT NULL
UNION ALL
SELECT id, 2, p2_id, p2_total_score FROM matches WHERE p2_id IS NOT NULL
UNION ALL
SELECT id, 3, p3_id, p3_total_score FROM matches WHERE p3_id IS NOT NULL
UNION ALL
SELECT id, 4, p4_id, p4_total_score FROM matches WHERE p4_id IS NOT NULL;

-- Recreate v_round_scores
CREATE OR REPLACE VIEW v_round_scores AS
SELECT r.id AS round_id, r.match_id, r.round_number,
       m.p1_id AS user_id, 1 AS seat_order,
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

-- Recreate v_match_scores  (join players instead of players)
CREATE OR REPLACE VIEW v_match_scores AS
SELECT
    vmp.match_id,
    vmp.user_id,
    p.name        AS player_name,
    p.avatar      AS player_avatar,
    vmp.seat_order,
    vmp.total_score AS cumulative_score,
    (SELECT COUNT(*) FROM rounds r WHERE r.match_id = vmp.match_id) AS rounds_played
FROM v_match_players vmp
JOIN players p ON p.id = vmp.user_id;

-- Recreate v_match_rankings  (depends on v_match_scores — no direct table ref)
CREATE OR REPLACE VIEW v_match_rankings AS
SELECT
    match_id,
    user_id,
    player_name,
    player_avatar,
    cumulative_score,
    rounds_played,
    RANK() OVER (
        PARTITION BY match_id
        ORDER BY cumulative_score DESC
    ) AS current_rank
FROM v_match_scores;

-- Recreate v_player_stats  (join players instead of players)
CREATE OR REPLACE VIEW v_player_stats AS
SELECT
    p.id                                             AS player_id,
    p.name,
    p.avatar,
    COUNT(DISTINCT vmp.match_id)                     AS total_matches,
    COUNT(DISTINCT CASE
        WHEN m.status = 'completed'
         AND m.winner_id = p.id
        THEN m.id END)                               AS matches_won,
    ROUND(
        COUNT(DISTINCT CASE WHEN m.status = 'completed' AND m.winner_id = p.id THEN m.id END)::NUMERIC
        / NULLIF(COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END), 0) * 100,
        1
    )                                                AS win_percentage,
    COALESCE(MAX(vmp.total_score), 0)                AS total_score,
    COUNT(DISTINCT r.id)                             AS total_rounds,
    ROUND(
        COALESCE(MAX(vmp.total_score), 0)
        / NULLIF(COUNT(DISTINCT r.id), 0),
        2
    )                                                AS avg_score_per_round
FROM players p
LEFT JOIN v_match_players vmp  ON vmp.user_id = p.id
LEFT JOIN matches m            ON m.id = vmp.match_id
LEFT JOIN rounds r             ON r.match_id = vmp.match_id
GROUP BY p.id, p.name, p.avatar;

