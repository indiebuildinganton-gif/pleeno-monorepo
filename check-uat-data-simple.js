#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// UAT Configuration
const SUPABASE_URL = 'https://ccmciliwfdtdspdlkuos.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ'

async function checkData() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })

  console.log('Checking UAT Supabase data...\n')
  console.log('URL:', SUPABASE_URL)
  console.log('Project Ref: ccmciliwfdtdspdlkuos\n')

  // Check all users in public.users
  console.log('1. Checking ALL users in public.users table:')
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('*')

  if (allUsersError) {
    console.log('   ERROR:', allUsersError.message)
    if (allUsersError.code) console.log('   Code:', allUsersError.code)
  } else {
    console.log('   Found', allUsers?.length || 0, 'users:')
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}, Role: ${user.role})`)
      })
    } else {
      console.log('   ❌ NO USERS FOUND IN PUBLIC.USERS TABLE')
    }
  }

  // Check all agencies
  console.log('\n2. Checking ALL agencies:')
  const { data: allAgencies, error: allAgenciesError } = await supabase
    .from('agencies')
    .select('*')

  if (allAgenciesError) {
    console.log('   ERROR:', allAgenciesError.message)
  } else {
    console.log('   Found', allAgencies?.length || 0, 'agencies:')
    if (allAgencies && allAgencies.length > 0) {
      allAgencies.forEach(agency => {
        console.log(`   - ${agency.name} (ID: ${agency.id})`)
      })
    } else {
      console.log('   ❌ NO AGENCIES FOUND')
    }
  }

  // Try a simple auth test
  console.log('\n3. Testing authentication:')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.local',
    password: 'password'
  })

  if (authError) {
    console.log('   ❌ Auth failed:', authError.message)
    console.log('   Status:', authError.status)
    console.log('   Code:', authError.code)
  } else {
    console.log('   ✅ Auth successful!')
  }

  // Check table existence by trying to query non-existent columns
  console.log('\n4. Verifying table structure:')
  const { error: structureError } = await supabase
    .from('users')
    .select('id')
    .limit(1)

  if (structureError) {
    console.log('   ❌ Cannot query users table:', structureError.message)
  } else {
    console.log('   ✅ Users table is accessible')
  }

  // Check if we can connect to the database at all
  console.log('\n5. Testing basic connectivity:')
  try {
    const { data, error } = await supabase.rpc('now')
    if (error) {
      // This is expected if the function doesn't exist
      if (error.code === 'PGRST202') {
        console.log('   ✅ Database is reachable (RPC test)')
      } else {
        console.log('   ⚠️ Database reachable but RPC failed:', error.message)
      }
    } else {
      console.log('   ✅ Database is fully functional')
    }
  } catch (e) {
    console.log('   ❌ Cannot reach database:', e.message)
  }
}

checkData().catch(console.error)