-- ============================================================
-- BreakArena — Production Teardown Script
-- 02_teardown.sql
--
-- ⚠️  DESTRUCTIVE — drops ALL BreakArena objects from the database.
-- Use this to fully reset before re-running 01_setup.sql.
-- ============================================================

-- Views (drop dependents first via CASCADE)
DROP VIEW IF EXISTS v_player_stats   CASCADE;
DROP VIEW IF EXISTS v_match_rankings CASCADE;
DROP VIEW IF EXISTS v_match_scores   CASCADE;
DROP VIEW IF EXISTS v_round_scores   CASCADE;
DROP VIEW IF EXISTS v_match_players  CASCADE;

-- Trigger + function
DROP TRIGGER IF EXISTS trg_groups_updated_at ON groups;
DROP FUNCTION IF EXISTS set_updated_at();

-- Tables (rounds/matches reference players; groups referenced by both)
DROP TABLE IF EXISTS rounds  CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS groups  CASCADE;

-- Extensions (only drop if no other apps rely on them)
DROP EXTENSION IF EXISTS "pgcrypto";
DROP EXTENSION IF EXISTS "citext";
DROP EXTENSION IF EXISTS "uuid-ossp";
