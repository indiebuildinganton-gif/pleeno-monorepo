-- Migration 001: Create agencies table
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  currency TEXT DEFAULT 'AUD' NOT NULL,
  timezone TEXT DEFAULT 'Australia/Brisbane' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_agencies_name ON agencies(name);

-- Add comments for documentation
COMMENT ON TABLE agencies IS 'Multi-tenant agencies - each represents a separate commission agency with isolated data';
COMMENT ON COLUMN agencies.id IS 'Primary tenant identifier used for RLS policies across all tenant-scoped tables';
COMMENT ON COLUMN agencies.currency IS 'Default currency for all financial calculations (ISO 4217 code)';
COMMENT ON COLUMN agencies.timezone IS 'Agency timezone for date/time display (IANA timezone identifier)';
