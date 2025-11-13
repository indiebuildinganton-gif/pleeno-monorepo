#!/bin/bash
# Test migration apply and rollback capability
# Usage: ./scripts/test-migrations.sh

set -e

echo "🧪 Testing Supabase migrations..."

# Reset database to clean state
echo "1. Resetting database to clean state..."
npx supabase db reset --no-seed

# Check migration status
echo "2. Checking migration status..."
npx supabase migration list

# Test rollback capability
echo "3. Testing rollback to migration 001..."
npx supabase db reset
npx supabase migration up --version 20250101000001  # Timestamp of migration 001

# Verify only agencies table exists
echo "4. Verifying rollback state..."
TABLES=$(psql postgresql://postgres:postgres@localhost:54322/postgres -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('agencies', 'users');")

if echo "$TABLES" | grep -q "agencies"; then
  echo "✅ agencies table exists"
else
  echo "❌ agencies table missing after rollback"
  exit 1
fi

if echo "$TABLES" | grep -q "users"; then
  echo "❌ users table should not exist after rollback to migration 001"
  exit 1
else
  echo "✅ users table correctly absent"
fi

# Re-apply all migrations
echo "5. Re-applying all migrations..."
npx supabase db reset

echo "✅ Migration testing completed successfully!"
