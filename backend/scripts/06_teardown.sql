-- ============================================================
-- 06_teardown.sql
-- Drops all tables, views, and extensions.
-- ⚠️  DESTRUCTIVE — development use only.
-- ============================================================

DROP VIEW  IF EXISTS v_player_stats    CASCADE;
DROP VIEW  IF EXISTS v_match_rankings  CASCADE;
DROP VIEW  IF EXISTS v_match_scores    CASCADE;

DROP TABLE IF EXISTS round_scores  CASCADE;
DROP TABLE IF EXISTS rounds        CASCADE;
DROP TABLE IF EXISTS match_players CASCADE;
DROP TABLE IF EXISTS matches       CASCADE;
DROP TABLE IF EXISTS players         CASCADE;

DROP EXTENSION IF EXISTS "citext";
DROP EXTENSION IF EXISTS "uuid-ossp";
