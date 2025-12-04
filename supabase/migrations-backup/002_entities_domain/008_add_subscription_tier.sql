-- Migration 008: Add subscription_tier to agencies table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- Add subscription_tier column to agencies table
-- ============================================================

-- Add subscription_tier column with ENUM constraint
-- Default to 'basic' for existing agencies
ALTER TABLE agencies
  ADD COLUMN subscription_tier TEXT NOT NULL
  DEFAULT 'basic'
  CHECK (subscription_tier IN ('basic', 'premium', 'enterprise'));

-- Create index for subscription tier queries
CREATE INDEX idx_agencies_subscription_tier ON agencies(subscription_tier);

-- ============================================================
-- Documentation
-- ============================================================

COMMENT ON COLUMN agencies.subscription_tier IS
  'Subscription tier determines feature access: basic (limited), premium (AI features), enterprise (full access)';

-- ============================================================
-- Notes
-- ============================================================

-- Subscription Tier Feature Matrix:
-- - basic: Core features only (student registry, basic reporting)
-- - premium: Adds AI-powered offer letter extraction, advanced analytics
-- - enterprise: Full feature set including custom integrations, priority support

COMMIT;
