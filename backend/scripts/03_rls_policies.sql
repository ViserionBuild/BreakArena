-- ============================================================
-- 03_rls_policies.sql
-- Row Level Security policies for Supabase.
-- These allow public (anonymous) read/write for a guest-friendly
-- scoreboard app. Tighten these if you add auth later.
-- Run AFTER 01_create_tables.sql
-- ============================================================

-- ── Enable RLS on all tables ────────────────────────────────
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_scores  ENABLE ROW LEVEL SECURITY;

-- ── USERS ───────────────────────────────────────────────────
-- Public can read all players
CREATE POLICY "users_select_public"
    ON users FOR SELECT
    USING (true);

-- Public can insert new players
CREATE POLICY "users_insert_public"
    ON users FOR INSERT
    WITH CHECK (true);

-- Public can update players
CREATE POLICY "users_update_public"
    ON users FOR UPDATE
    USING (true);

-- Public can delete players
CREATE POLICY "users_delete_public"
    ON users FOR DELETE
    USING (true);

-- ── MATCHES ─────────────────────────────────────────────────
CREATE POLICY "matches_select_public"
    ON matches FOR SELECT USING (true);

CREATE POLICY "matches_insert_public"
    ON matches FOR INSERT WITH CHECK (true);

CREATE POLICY "matches_update_public"
    ON matches FOR UPDATE USING (true);

CREATE POLICY "matches_delete_public"
    ON matches FOR DELETE USING (true);

-- ── MATCH_PLAYERS ────────────────────────────────────────────
CREATE POLICY "match_players_select_public"
    ON match_players FOR SELECT USING (true);

CREATE POLICY "match_players_insert_public"
    ON match_players FOR INSERT WITH CHECK (true);

CREATE POLICY "match_players_delete_public"
    ON match_players FOR DELETE USING (true);

-- ── ROUNDS ───────────────────────────────────────────────────
CREATE POLICY "rounds_select_public"
    ON rounds FOR SELECT USING (true);

CREATE POLICY "rounds_insert_public"
    ON rounds FOR INSERT WITH CHECK (true);

CREATE POLICY "rounds_delete_public"
    ON rounds FOR DELETE USING (true);

-- ── ROUND_SCORES ─────────────────────────────────────────────
CREATE POLICY "round_scores_select_public"
    ON round_scores FOR SELECT USING (true);

CREATE POLICY "round_scores_insert_public"
    ON round_scores FOR INSERT WITH CHECK (true);

CREATE POLICY "round_scores_update_public"
    ON round_scores FOR UPDATE USING (true);

CREATE POLICY "round_scores_delete_public"
    ON round_scores FOR DELETE USING (true);
