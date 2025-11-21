#!/bin/bash

# ============================================================
# Create Demo Admin User (v2)
# ============================================================
# Creates a demo admin using Node.js and Supabase Admin API
# This ensures proper password hashing
# ============================================================

set -e

echo "=========================================="
echo "Creating Demo Admin User"
echo "=========================================="
echo ""

# Check if Supabase is running
if ! curl -s http://localhost:54321/health > /dev/null 2>&1; then
    echo "❌ Supabase not running"
    echo "Run: npx supabase start"
    exit 1
fi

# Get the monorepo root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Create Node.js script
cat > /tmp/create-demo.js <<'NODESCRIPT'
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const AGENCY_ID = '20000000-0000-0000-0000-000000000001'

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('📝 Creating agency...')

  // Create agency
  const { error: agencyError } = await supabase
    .from('agencies')
    .insert({
      id: AGENCY_ID,
      name: 'Demo Agency'
    })

  if (agencyError && !agencyError.message.includes('duplicate')) {
    console.error('Error creating agency:', agencyError.message)
    process.exit(1)
  }

  console.log('✅ Agency created')
  console.log('')
  console.log('👤 Creating admin user...')

  // Create auth user with proper password hashing
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@pleeno.dev',
    password: 'Password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Demo Admin',
      agency_id: AGENCY_ID,
      role: 'agency_admin'
    }
  })

  if (authError) {
    if (authError.message.includes('already')) {
      console.log('ℹ️  User already exists, updating password...')

      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users.users.find(u => u.email === 'admin@pleeno.dev')

      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          password: 'Password123'
        })
        console.log('✅ Password updated')
      }
    } else {
      console.error('Error creating user:', authError.message)
      process.exit(1)
    }
  } else {
    console.log('✅ Auth user created')

    // Create public user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'admin@pleeno.dev',
        full_name: 'Demo Admin',
        agency_id: AGENCY_ID,
        role: 'agency_admin',
        status: 'active'
      })

    if (userError && !userError.message.includes('duplicate')) {
      console.error('Error creating user record:', userError.message)
      process.exit(1)
    }

    console.log('✅ User record created')
  }

  console.log('')
  console.log('==========================================')
  console.log('✅ Demo User Ready!')
  console.log('==========================================')
  console.log('')
  console.log('Login Credentials:')
  console.log('  Email:    admin@pleeno.dev')
  console.log('  Password: Password123')
  console.log('')
  console.log('Visit: http://localhost:3005/login')
  console.log('==========================================')
}

main()
NODESCRIPT

# Run Node script with access to monorepo node_modules
NODE_PATH="$PROJECT_ROOT/node_modules" node /tmp/create-demo.js

# Clean up
rm /tmp/create-demo.js
