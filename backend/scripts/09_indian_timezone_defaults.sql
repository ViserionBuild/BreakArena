-- ============================================================
-- 09_indian_timezone_defaults.sql
-- Store app dates/timestamps as Indian local time on existing DBs.
-- Run after the core schema/alignment scripts.
-- ============================================================

ALTER TABLE players
    ALTER COLUMN created_at TYPE TIMESTAMP
        USING created_at AT TIME ZONE 'Asia/Kolkata',
    ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE matches
    ALTER COLUMN match_date SET DEFAULT ((NOW() AT TIME ZONE 'Asia/Kolkata')::DATE),
    ALTER COLUMN created_at TYPE TIMESTAMP
        USING created_at AT TIME ZONE 'Asia/Kolkata',
    ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    ALTER COLUMN ended_at TYPE TIMESTAMP
        USING ended_at AT TIME ZONE 'Asia/Kolkata';

ALTER TABLE rounds
    ALTER COLUMN created_at TYPE TIMESTAMP
        USING created_at AT TIME ZONE 'Asia/Kolkata',
    ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');
