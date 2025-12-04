-- Migration 02: Enable Required Extensions
-- These are needed for UUID, cron jobs, and HTTP requests

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable HTTP extension for Edge Functions
CREATE EXTENSION IF NOT EXISTS "http";

-- Enable pg_cron for scheduled jobs
-- Note: This may already be enabled by Supabase
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Enable pg_net for network requests
CREATE EXTENSION IF NOT EXISTS "pg_net";

COMMIT;
