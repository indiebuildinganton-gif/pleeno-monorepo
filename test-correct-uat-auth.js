#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// CORRECT UAT Configuration
const SUPABASE_URL = 'https://iadhxztsuzbkbnhkimqv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZGh4enRzdXpia2JuaGtpbXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTY5NjQsImV4cCI6MjA3ODg3Mjk2NH0.7XA-XC_Dozv_GwtOpivaUBmUMUJmEpawkKx7JnCPLxU'

// Test credentials
const TEST_EMAIL = 'admin@test.local'
const TEST_PASSWORD = 'password'

// Colors for console output
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

function log(message, color = RESET) {
  console.log(color + message + RESET)
}

async function testCorrectSupabase() {
  log('=' .repeat(60), BLUE)
  log('TESTING CORRECT UAT SUPABASE PROJECT', BOLD)
  log('=' .repeat(60), BLUE)
  console.log('')

  log('Project: iadhxztsuzbkbnhkimqv', GREEN)
  log('URL: ' + SUPABASE_URL, GREEN)
  log('Account: lopajs27@gmail.com', GREEN)
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })

  // 1. Check if database has data
  log('1. Checking database content...', YELLOW)

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(5)

  if (usersError) {
    log('   ❌ Error querying users: ' + usersError.message, RED)
  } else {
    log(`   ✅ Found ${users?.length || 0} users in database`, GREEN)
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`      - ${user.email} (${user.role})`)
      })
    }
  }

  // 2. Check agencies
  const { data: agencies, error: agenciesError } = await supabase
    .from('agencies')
    .select('*')
    .limit(5)

  if (agenciesError) {
    log('   ❌ Error querying agencies: ' + agenciesError.message, RED)
  } else {
    log(`   ✅ Found ${agencies?.length || 0} agencies`, GREEN)
  }

  // 3. Check for admin@test.local specifically
  console.log('')
  log('2. Looking for admin@test.local user...', YELLOW)

  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single()

  if (adminError) {
    if (adminError.code === 'PGRST116') {
      log('   ❌ User admin@test.local NOT FOUND in public.users', RED)
      log('   This user needs to be created in the database', YELLOW)
    } else {
      log('   ❌ Error: ' + adminError.message, RED)
    }
  } else {
    log('   ✅ User admin@test.local EXISTS in public.users!', GREEN)
    console.log('      ID:', adminUser.id)
    console.log('      Role:', adminUser.role)
    console.log('      Agency ID:', adminUser.agency_id)
    console.log('      Status:', adminUser.status)
  }

  // 4. Test authentication
  console.log('')
  log('3. Testing authentication with admin@test.local...', YELLOW)

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })

  if (authError) {
    log('   ❌ Authentication failed', RED)
    log('   Error: ' + authError.message, RED)
    log('   Status: ' + authError.status, RED)

    if (authError.message === 'Invalid login credentials') {
      console.log('')
      log('   DIAGNOSIS: User exists in public.users but not in auth.users', YELLOW)
      log('   SOLUTION: Need to create auth.users record with password', YELLOW)
    } else if (authError.status === 500) {
      console.log('')
      log('   DIAGNOSIS: Database schema error', YELLOW)
      log('   SOLUTION: Check auth triggers and functions in Supabase', YELLOW)
    }
  } else {
    log('   ✅ AUTHENTICATION SUCCESSFUL!', GREEN)
    log('   User ID: ' + authData.user?.id, GREEN)
    log('   Email: ' + authData.user?.email, GREEN)
    log('   Session token received: ' + (authData.session ? 'Yes' : 'No'), GREEN)
  }

  // Summary
  console.log('')
  log('=' .repeat(60), BLUE)
  log('SUMMARY', BOLD)
  log('=' .repeat(60), BLUE)

  if (users && users.length > 0) {
    log('✅ Correct Supabase project confirmed (has data)', GREEN)
  } else {
    log('❌ This might still be wrong project (no data found)', RED)
  }

  if (adminUser) {
    log('✅ admin@test.local exists in public.users', GREEN)
  } else {
    log('❌ admin@test.local NOT found - needs to be created', RED)
  }

  if (!authError) {
    log('✅ Authentication working!', GREEN)
  } else {
    log('❌ Authentication failing - auth.users record likely missing', RED)
  }
}

testCorrectSupabase().catch(error => {
  log('Fatal error:', RED)
  console.error(error)
})