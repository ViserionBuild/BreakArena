-- ============================================================
-- 04_views.sql
-- Pre-built views for common analytical queries.
-- Run AFTER 01_create_tables.sql
-- ============================================================

-- ── v_match_players: virtual junction — unpivots p1..p4 into rows ──
CREATE OR REPLACE VIEW v_match_players AS
SELECT id AS match_id, 1 AS seat_order, p1_id AS user_id, p1_total_score AS total_score FROM matches WHERE p1_id IS NOT NULL
UNION ALL
SELECT id, 2, p2_id, p2_total_score FROM matches WHERE p2_id IS NOT NULL
UNION ALL
SELECT id, 3, p3_id, p3_total_score FROM matches WHERE p3_id IS NOT NULL
UNION ALL
SELECT id, 4, p4_id, p4_total_score FROM matches WHERE p4_id IS NOT NULL;

-- ── v_round_scores: unpivots p1..p4 columns in rounds into rows ──
-- Mirrors the old round_scores table shape for easy downstream use
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

-- ── v_match_scores: latest cumulative score per player per match ───
-- Reads directly from matches.p*_total_score (always up to date)
CREATE OR REPLACE VIEW v_match_scores AS
SELECT
    vmp.match_id,
    vmp.user_id,
    u.name        AS player_name,
    u.avatar      AS player_avatar,
    vmp.seat_order,
    vmp.total_score AS cumulative_score,
    (SELECT COUNT(*) FROM rounds r WHERE r.match_id = vmp.match_id) AS rounds_played
FROM v_match_players vmp
JOIN users u ON u.id = vmp.user_id;

-- ── v_match_rankings: live rankings within each match ───────
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

-- ── v_player_stats: lifetime stats per player ───────────────
CREATE OR REPLACE VIEW v_player_stats AS
SELECT
    u.id                                             AS player_id,
    u.name,
    u.avatar,
    COUNT(DISTINCT vmp.match_id)                     AS total_matches,
    COUNT(DISTINCT CASE
        WHEN m.status = 'completed'
         AND m.winner_id = u.id
        THEN m.id END)                               AS matches_won,
    ROUND(
        COUNT(DISTINCT CASE WHEN m.status = 'completed' AND m.winner_id = u.id THEN m.id END)::NUMERIC
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
FROM users u
LEFT JOIN v_match_players vmp  ON vmp.user_id = u.id
LEFT JOIN matches m            ON m.id = vmp.match_id
LEFT JOIN rounds r             ON r.match_id = vmp.match_id
GROUP BY u.id, u.name, u.avatar;
