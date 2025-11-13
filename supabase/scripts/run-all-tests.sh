#!/bin/bash
# Run all RLS tests for Story 1.2
# Usage: ./supabase/scripts/run-all-tests.sh

set -e

echo "🧪 Running All RLS Tests for Story 1.2"
echo "======================================"
echo ""

# Database connection
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Reset database to ensure clean state
echo "📦 Resetting database to clean state..."
npx supabase db reset --no-seed
echo ""

# Run comprehensive test suite
echo "🚀 Running comprehensive RLS test suite..."
psql "$DB_URL" -f supabase/tests/rls-comprehensive-test-suite.sql

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All tests passed!"
  exit 0
else
  echo ""
  echo "❌ Some tests failed. See output above."
  exit 1
fi
