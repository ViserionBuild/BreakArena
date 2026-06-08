-- ============================================================
-- 03_rls_policies.sql
-- Row Level Security policies for Supabase.
-- These allow public (anonymous) read/write for a guest-friendly
-- scoreboard app. Tighten these if you add auth later.
-- Run AFTER 01_create_tables.sql
-- ============================================================

-- ── Enable RLS on all tables ────────────────────────────────
ALTER TABLE players         ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds        ENABLE ROW LEVEL SECURITY;

-- ── players ───────────────────────────────────────────────────
-- Public can read all players
CREATE POLICY "players_select_public"
    ON players FOR SELECT
    USING (true);

-- Public can insert new players
CREATE POLICY "players_insert_public"
    ON players FOR INSERT
    WITH CHECK (true);

-- Public can update players
CREATE POLICY "players_update_public"
    ON players FOR UPDATE
    USING (true);

-- Public can delete players
CREATE POLICY "players_delete_public"
    ON players FOR DELETE
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

-- ── ROUNDS ───────────────────────────────────────────────────
CREATE POLICY "rounds_select_public"
    ON rounds FOR SELECT USING (true);

CREATE POLICY "rounds_insert_public"
    ON rounds FOR INSERT WITH CHECK (true);

CREATE POLICY "rounds_delete_public"
    ON rounds FOR DELETE USING (true);

CREATE POLICY "rounds_update_public"
    ON rounds FOR UPDATE USING (true);

-- round_scores table removed: scores are now columns on rounds
