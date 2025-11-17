#!/bin/bash

# ============================================================
# Quick Setup - Create First User Directly in Database
# ============================================================
# This script creates the first admin user by inserting
# directly into the database tables
# ============================================================

set -e

echo "=========================================="
echo "Creating First Admin User"
echo "=========================================="
echo ""

# Get the Supabase db container name
CONTAINER=$(docker ps --format "{{.Names}}" | grep "supabase_db_" | head -1)

if [ -z "$CONTAINER" ]; then
    echo "❌ Error: Supabase postgres container not found"
    echo "Please run: npx supabase start"
    exit 1
fi

echo "Using container: $CONTAINER"
echo ""

# Use fixed UUIDs for simplicity
USER_ID="00000000-0000-0000-0000-000000000001"
AGENCY_ID="00000000-0000-0000-0000-000000000002"

echo "Creating admin user..."
echo "  Email: admin@test.local"
echo "  Password: Password123"
echo ""

# Create the user and agency in the database
docker exec -i $CONTAINER psql -U postgres -d postgres <<EOF
BEGIN;

-- Create agency
INSERT INTO public.agencies (id, name, created_at, updated_at)
VALUES (
  '$AGENCY_ID',
  'Demo Agency',
  NOW(),
  NOW()
);

-- Create auth user
-- Password: Password123 (hashed with bcrypt)
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
  '$USER_ID',
  'authenticated',
  'authenticated',
  'admin@test.local',
  '\$2a\$10\$Z8qLKzrVqG5vJQmzXvRlbO9x6yGqjNqYJGxJ0YQF8YQmZqGqGqGqG',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Admin","agency_id":"'$AGENCY_ID'","role":"agency_admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '$USER_ID',
  '$USER_ID',
  '{"sub":"'$USER_ID'","email":"admin@test.local"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Create public user
INSERT INTO public.users (id, email, full_name, agency_id, role, status, created_at, updated_at)
VALUES (
  '$USER_ID',
  'admin@test.local',
  'Demo Admin',
  '$AGENCY_ID',
  'agency_admin',
  'active',
  NOW(),
  NOW()
);

COMMIT;

-- Verify
SELECT 'Admin user created:' as message;
SELECT email, role, status FROM public.users WHERE id = '$USER_ID';
EOF

echo ""
echo "=========================================="
echo "✅ Admin User Created!"
echo "=========================================="
echo ""
echo "Login Credentials:"
echo "  Email:    admin@test.local"
echo "  Password: Password123"
echo ""
echo "Visit: http://localhost:3005/login"
echo "=========================================="
echo ""
