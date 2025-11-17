#!/bin/bash

# ============================================================
# Create Demo Admin User
# ============================================================
# Creates a demo admin user directly in the database
# Email: admin@test.local
# Password: Password123
# ============================================================

set -e

echo "=========================================="
echo "Creating Demo Admin User"
echo "=========================================="
echo ""

# Get container
CONTAINER=$(docker ps --format "{{.Names}}" | grep "supabase_db_" | head -1)

if [ -z "$CONTAINER" ]; then
    echo "❌ Supabase not running"
    echo "Run: npx supabase start"
    exit 1
fi

# Fixed IDs
USER_ID="10000000-0000-0000-0000-000000000001"
AGENCY_ID="20000000-0000-0000-0000-000000000001"

echo "📝 Creating user..."
echo ""

# Create SQL file with proper escaping
cat > /tmp/create_demo_user.sql <<'SQLEOF'
BEGIN;

-- Create agency
INSERT INTO public.agencies (id, name, created_at, updated_at)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Demo Agency',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create auth user
-- Password hash for: Password123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@test.local',
  '$2a$10$Zn8qL.zrVqG5vJQmzXvRlbO9x6yGqjNqYJGxJ0YQF8YQmZqGqGqGq',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Admin","agency_id":"20000000-0000-0000-0000-000000000001","role":"agency_admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create identity
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"admin@test.local","email_verified":true,"phone_verified":false}',
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- Create public user
INSERT INTO public.users (id, email, full_name, agency_id, role, status, created_at, updated_at)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'admin@test.local',
  'Demo Admin',
  '20000000-0000-0000-0000-000000000001',
  'agency_admin',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verify
SELECT email, role, status FROM public.users WHERE email = 'admin@test.local';
SQLEOF

# Execute
docker exec -i $CONTAINER psql -U postgres -d postgres < /tmp/create_demo_user.sql

# Clean up
rm /tmp/create_demo_user.sql

echo ""
echo "=========================================="
echo "✅ Demo User Created!"
echo "=========================================="
echo ""
echo "Login Credentials:"
echo "  Email:    admin@test.local"
echo "  Password: Password123"
echo ""
echo "Visit: http://localhost:3005/login"
echo "=========================================="
echo ""
