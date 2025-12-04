-- ======================================
-- Migration 1: Enable Required Extensions
-- ======================================

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable HTTP extension for Edge Functions
CREATE EXTENSION IF NOT EXISTS "http";

-- Enable pg_cron for scheduled jobs (may already be enabled)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pg_cron";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron extension already exists or cannot be created';
END $$;

-- Enable pg_net for network requests
CREATE EXTENSION IF NOT EXISTS "pg_net";

COMMIT;
