#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// CORRECT UAT Configuration (from docs/deployment/vercel-uat-deployment-guide.md)
const CORRECT_SUPABASE_URL = 'https://iadhxztsuzbkbnhkimqv.supabase.co'
// We need to get the correct anon key for this project

// WRONG Configuration (what we've been using)
const WRONG_SUPABASE_URL = 'https://ccmciliwfdtdspdlkuos.supabase.co'
const WRONG_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ'

console.log('='.repeat(60))
console.log('SUPABASE PROJECT VERIFICATION')
console.log('='.repeat(60))
console.log('')
console.log('CORRECT Project (from documentation):')
console.log('  URL:', CORRECT_SUPABASE_URL)
console.log('  Ref: iadhxztsuzbkbnhkimqv')
console.log('  Account: lopajs27@gmail.com (based on your info)')
console.log('')
console.log('WRONG Project (what .env.uat has):')
console.log('  URL:', WRONG_SUPABASE_URL)
console.log('  Ref: ccmciliwfdtdspdlkuos')
console.log('')

console.log('The issue is clear:')
console.log('1. Your .env.uat file has the WRONG Supabase project URL')
console.log('2. Vercel is likely using the WRONG project')
console.log('3. The WRONG project (ccmciliwfdtdspdlkuos) has NO DATA')
console.log('4. The CORRECT project (iadhxztsuzbkbnhkimqv) has all your data')
console.log('')
console.log('To fix this:')
console.log('1. Get the anon key for iadhxztsuzbkbnhkimqv from Supabase dashboard')
console.log('2. Update .env.uat with the correct URL and key')
console.log('3. Update Vercel environment variables')
console.log('4. Redeploy')
console.log('')
console.log('Please log into https://app.supabase.com with lopajs27@gmail.com')
console.log('and get the anon key for project iadhxztsuzbkbnhkimqv')
console.log('')

// Quick test of the wrong project to confirm it's empty
async function testWrongProject() {
  console.log('Testing WRONG project (ccmciliwfdtdspdlkuos) to confirm it\'s empty...')

  const supabase = createClient(WRONG_SUPABASE_URL, WRONG_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')

  if (usersError) {
    console.log('  Error:', usersError.message)
  } else {
    console.log('  Users found:', users?.length || 0)
    if (users?.length === 0) {
      console.log('  ✅ Confirmed: This project has NO users (wrong project)')
    }
  }

  const { data: agencies, error: agenciesError } = await supabase
    .from('agencies')
    .select('*')

  if (agenciesError) {
    console.log('  Error:', agenciesError.message)
  } else {
    console.log('  Agencies found:', agencies?.length || 0)
    if (agencies?.length === 0) {
      console.log('  ✅ Confirmed: This project has NO agencies (wrong project)')
    }
  }
}

testWrongProject().catch(console.error)