-- ============================================================
-- 07_useful_queries.sql
-- Handy reference queries for debugging / reporting.
-- Not meant to be run as a migration — pick and use as needed.
-- ============================================================

-- ── All players with lifetime stats ─────────────────────────
SELECT * FROM v_player_stats ORDER BY total_score DESC;

-- ── Live rankings for a specific match ───────────────────────
SELECT *
FROM v_match_rankings
WHERE match_id = '22222222-0000-0000-0000-000000000001'
ORDER BY current_rank;

-- ── Round-by-round score breakdown for a match ───────────────
SELECT
    r.round_number,
    u.name AS player,
    rs.bid,
    rs.actual_wins,
    rs.score
FROM rounds r
JOIN round_scores rs ON rs.round_id = r.id
JOIN players u ON u.id = rs.user_id
WHERE r.match_id = '22222222-0000-0000-0000-000000000001'
ORDER BY r.round_number, u.name;

-- ── Cumulative score per player per round (for graph) ────────
SELECT
    r.round_number,
    rs.user_id,
    u.name,
    SUM(rs.score) OVER (
        PARTITION BY rs.user_id
        ORDER BY r.round_number
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_score
FROM rounds r
JOIN round_scores rs ON rs.round_id = r.id
JOIN players u ON u.id = rs.user_id
WHERE r.match_id = '22222222-0000-0000-0000-000000000001'
ORDER BY r.round_number, rs.user_id;

-- ── All completed matches with winner name ───────────────────
SELECT
    m.id,
    m.created_at,
    m.ended_at,
    u.name AS winner
FROM matches m
LEFT JOIN players u ON u.id = m.winner_id
WHERE m.status = 'completed'
ORDER BY m.ended_at DESC;

-- ── Head-to-head: wins between two players ───────────────────
-- Replace the UUIDs with real player IDs
SELECT
    winner_id,
    u.name AS winner_name,
    COUNT(*) AS wins
FROM matches m
JOIN players u ON u.id = m.winner_id
WHERE m.status = 'completed'
  AND m.id IN (
      SELECT match_id FROM match_players WHERE user_id = '11111111-0000-0000-0000-000000000001'
  )
  AND m.id IN (
      SELECT match_id FROM match_players WHERE user_id = '11111111-0000-0000-0000-000000000002'
  )
GROUP BY winner_id, u.name;
