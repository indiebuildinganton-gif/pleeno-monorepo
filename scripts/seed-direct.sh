#!/bin/bash

# ============================================================
# Direct Database Seeding (Docker Exec)
# ============================================================
# Seeds the database by running SQL directly in the container
# Bypasses RLS issues by using superuser access
# ============================================================

set -e

echo "=========================================="
echo "Seeding Pleeno Database (Direct)"
echo "=========================================="

# Get the Supabase db container name
CONTAINER=$(docker ps --format "{{.Names}}" | grep "supabase_db_" | head -1)

if [ -z "$CONTAINER" ]; then
    echo "❌ Error: Supabase postgres container not found"
    echo "Please run: npx supabase start"
    exit 1
fi

echo ""
echo "Using container: $CONTAINER"
echo ""

# Create SQL for seeding
cat > /tmp/pleeno_seed.sql << 'EOF'
BEGIN;

-- Clear existing data
DELETE FROM public.users;
DELETE FROM public.agencies;
-- Cannot delete from auth.users directly via SQL (need admin API)

-- Create agency
INSERT INTO public.agencies (id, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Agency',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create admin user in auth.users (if supported)
-- This may not work due to auth restrictions, but we'll try

-- Create public.users records (these we can create)
-- Note: The auth.users must be created via the Supabase Auth Admin API
-- This script creates the public.users records only

-- For now, just report what needs to be done
SELECT 'Agency created: Demo Agency (ID: 00000000-0000-0000-0000-000000000001)' as message;
SELECT 'Next steps:' as message;
SELECT '1. Use the signup flow to create the first user' as step;
SELECT '2. Or use the Supabase Studio to create auth users' as step;

COMMIT;
EOF

echo "🌱 Running seed SQL..."
echo ""

docker exec -i $CONTAINER psql -U postgres -d postgres < /tmp/pleeno_seed.sql

echo ""
echo "=========================================="
echo "✅ Agency seeded successfully!"
echo "=========================================="
echo ""
echo "The agency 'Demo Agency' has been created."
echo ""
echo "To create users, you have two options:"
echo ""
echo "1. Use the signup flow (recommended):"
echo "   - Visit: http://localhost:3005/signup"
echo "   - This will create the first admin user"
echo ""
echo "2. Use Supabase Studio:"
echo "   - Visit: http://localhost:54323"
echo "   - Go to Authentication > Users"
echo "   - Add users manually"
echo ""
echo "After creating auth users, you'll need to create"
echo "corresponding records in public.users table."
echo "=========================================="
echo ""

# Clean up
rm /tmp/pleeno_seed.sql
