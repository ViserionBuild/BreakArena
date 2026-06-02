-- ============================================================
-- 04_views.sql
-- Pre-built views for common analytical queries.
-- Run AFTER 01_create_tables.sql
-- ============================================================

-- ── v_match_scores: cumulative score per player per match ───
CREATE OR REPLACE VIEW v_match_scores AS
SELECT
    mp.match_id,
    mp.user_id,
    u.name        AS player_name,
    u.avatar      AS player_avatar,
    mp.seat_order,
    COALESCE(SUM(rs.score), 0)          AS cumulative_score,
    COUNT(rs.id)                        AS rounds_played,
    COALESCE(SUM(rs.bid), 0)            AS total_bid,
    COALESCE(SUM(rs.actual_wins), 0)    AS total_wins
FROM match_players mp
JOIN users u ON u.id = mp.user_id
LEFT JOIN rounds r ON r.match_id = mp.match_id
LEFT JOIN round_scores rs ON rs.round_id = r.id AND rs.user_id = mp.user_id
GROUP BY mp.match_id, mp.user_id, u.name, u.avatar, mp.seat_order;

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
    COUNT(DISTINCT mp.match_id)                      AS total_matches,
    COUNT(DISTINCT CASE
        WHEN m.status = 'completed'
         AND m.winner_id = u.id
        THEN m.id END)                               AS matches_won,
    ROUND(
        COUNT(DISTINCT CASE WHEN m.status = 'completed' AND m.winner_id = u.id THEN m.id END)::NUMERIC
        / NULLIF(COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END), 0) * 100,
        1
    )                                                AS win_percentage,
    COALESCE(SUM(rs.score), 0)                       AS total_score,
    COUNT(rs.id)                                     AS total_rounds,
    ROUND(
        COALESCE(SUM(rs.score), 0)
        / NULLIF(COUNT(rs.id), 0),
        2
    )                                                AS avg_score_per_round
FROM users u
LEFT JOIN match_players mp   ON mp.user_id = u.id
LEFT JOIN matches m          ON m.id = mp.match_id
LEFT JOIN rounds r           ON r.match_id = mp.match_id
LEFT JOIN round_scores rs    ON rs.round_id = r.id AND rs.user_id = u.id
GROUP BY u.id, u.name, u.avatar;
