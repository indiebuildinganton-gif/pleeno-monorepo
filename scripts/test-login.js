#!/usr/bin/env node

/**
 * Test Login
 * Tests if we can authenticate with Supabase
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function testLogin() {
  console.log('==========================================')
  console.log('Testing Login')
  console.log('==========================================')
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('Attempting to login with:')
  console.log('  Email: admin@test.local')
  console.log('  Password: Password123')
  console.log('')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@test.local',
    password: 'Password123'
  })

  if (error) {
    console.error('❌ Login failed!')
    console.error('Error:', error.message)
    console.error('Status:', error.status)
    console.error('')
    console.error('Full error:', JSON.stringify(error, null, 2))
    process.exit(1)
  }

  console.log('✅ Login successful!')
  console.log('')
  console.log('User ID:', data.user.id)
  console.log('Email:', data.user.email)
  console.log('Session expires at:', new Date(data.session.expires_at * 1000).toISOString())
  console.log('')
}

testLogin()
