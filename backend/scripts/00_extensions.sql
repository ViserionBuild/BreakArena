-- ============================================================
-- 00_extensions.sql
-- Enable required PostgreSQL extensions.
-- Run this FIRST before any other scripts.
-- ============================================================

-- UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- For case-insensitive text matching (optional, useful for player name search)
CREATE EXTENSION IF NOT EXISTS "citext";
