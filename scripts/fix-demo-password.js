#!/usr/bin/env node

/**
 * Fix Demo User Password
 * Updates the demo user's password using Supabase Admin API
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const USER_ID = '10000000-0000-0000-0000-000000000001'

async function fixPassword() {
  console.log('==========================================')
  console.log('Fixing Demo User Password')
  console.log('==========================================')
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('Updating password for admin@test.local...')

  const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
    password: 'Password123'
  })

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('✅ Password updated successfully!')
  console.log('')
  console.log('Login Credentials:')
  console.log('  Email:    admin@test.local')
  console.log('  Password: Password123')
  console.log('')
  console.log('Visit: http://localhost:3005/login')
  console.log('')
}

fixPassword()
