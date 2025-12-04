-- Migration 002: Create users table with agency_id foreign key
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

CREATE TABLE users (
  -- Link to Supabase Auth user
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- User profile
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,

  -- Role-based access control
  role TEXT NOT NULL CHECK (role IN ('agency_admin', 'agency_user')),

  -- Account status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance indexes (critical for RLS queries)
CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(agency_id, status);

-- Updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE users ADD CONSTRAINT users_email_format_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add comments
COMMENT ON TABLE users IS 'Application users linked to Supabase Auth, scoped to agencies for multi-tenant isolation';
COMMENT ON COLUMN users.agency_id IS 'Foreign key to agencies table - enforces tenant isolation via RLS policies';
COMMENT ON COLUMN users.id IS 'References auth.users(id) from Supabase Auth - single source of truth for authentication';
COMMENT ON COLUMN users.role IS 'User role within their agency: agency_admin (full access) or agency_user (limited access)';
