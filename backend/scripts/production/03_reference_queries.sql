-- ============================================================
-- BreakArena — Reference Queries
-- 03_reference_queries.sql
--
-- Handy queries for debugging and reporting in production.
-- Pick and run individual queries as needed — NOT a migration.
-- ============================================================


-- ── All groups ───────────────────────────────────────────────
SELECT id, name, is_active, created_at FROM groups ORDER BY created_at DESC;


-- ── All active players in a group ───────────────────────────
-- Replace <group_id> with the target group UUID
SELECT id, name, avatar, color, created_at
FROM players
WHERE group_id = '<group_id>'
  AND is_active = TRUE
ORDER BY name;


-- ── Lifetime stats for all players in a group ────────────────
SELECT player_id, name, total_matches, matches_won, win_percentage,
       total_score, total_rounds, avg_score_per_round
FROM v_player_stats
WHERE group_id = '<group_id>'
ORDER BY total_score DESC;


-- ── All matches for a group (newest first) ───────────────────
SELECT id, status, match_date, match_number, total_rounds, created_at, ended_at
FROM matches
WHERE group_id = '<group_id>'
ORDER BY created_at DESC;


-- ── Live rankings for a specific match ───────────────────────
SELECT current_rank, player_name, cumulative_score, rounds_played
FROM v_match_rankings
WHERE match_id = '<match_id>'
ORDER BY current_rank;


-- ── Round-by-round breakdown for a match ─────────────────────
SELECT
    rs.round_number,
    p.name        AS player,
    rs.bid,
    rs.actual_wins,
    rs.cumulative_score
FROM v_round_scores rs
JOIN players p ON p.id = rs.player_id
WHERE rs.match_id = '<match_id>'
ORDER BY rs.round_number, rs.seat_order;


-- ── Completed matches with winner ────────────────────────────
SELECT
    m.id,
    m.match_date,
    m.match_number,
    p.name AS winner,
    m.ended_at
FROM matches m
LEFT JOIN players p ON p.id = m.winner_id
WHERE m.status = 'completed'
  AND m.group_id = '<group_id>'
ORDER BY m.ended_at DESC;


-- ── Cumulative score progression per player (for charts) ─────
SELECT
    rs.round_number,
    p.name,
    rs.cumulative_score
FROM v_round_scores rs
JOIN players p ON p.id = rs.player_id
WHERE rs.match_id = '<match_id>'
ORDER BY rs.round_number, rs.seat_order;
