#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// UAT Configuration - using the correct project
const SUPABASE_URL = 'https://ccmciliwfdtdspdlkuos.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ'

async function testAuth() {
  console.log('==========================================')
  console.log('Testing UAT Authentication')
  console.log('==========================================')
  console.log('')
  console.log('Supabase URL:', SUPABASE_URL)
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log('Testing login with admin@test.local / password...')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@test.local',
    password: 'password'
  })

  if (error) {
    console.error('❌ Login failed:', error.message)
    console.error('Error details:', error)

    // Try to get more info
    console.log('\nAttempting to check if user exists...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@test.local')
      .single()

    if (userData) {
      console.log('✅ User found in public.users table:', userData)
      console.log('\nThis means the user exists but authentication is failing.')
      console.log('Likely the auth.users record is missing or has wrong password.')
    } else {
      console.log('❌ User not found in public.users table')
    }
  } else {
    console.log('✅ Login successful!')
    console.log('User:', data.user?.email)
    console.log('User ID:', data.user?.id)
    console.log('Session token received:', !!data.session?.access_token)
  }
}

testAuth().catch(console.error)