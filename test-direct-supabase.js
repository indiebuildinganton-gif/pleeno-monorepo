#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const https = require('https')

// UAT Configuration - EXACT same as Vercel should have
const SUPABASE_URL = 'https://ccmciliwfdtdspdlkuos.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ'

async function testDirectSupabase() {
  console.log('============================================')
  console.log('DIRECT SUPABASE CONNECTION TEST')
  console.log('============================================')
  console.log('')
  console.log('URL:', SUPABASE_URL)
  console.log('Key:', SUPABASE_ANON_KEY.substring(0, 50) + '...')
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  // Test 1: Check if user exists in public.users
  console.log('1. Checking if user exists in public.users...')
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('id, email, role, agency_id, status')
    .eq('email', 'admin@test.local')
    .single()

  if (publicError) {
    console.log('   ❌ Error:', publicError.message)
  } else {
    console.log('   ✅ User found in public.users:')
    console.log('      ID:', publicUser.id)
    console.log('      Role:', publicUser.role)
    console.log('      Status:', publicUser.status)
  }

  // Test 2: Try authentication with Supabase Auth
  console.log('')
  console.log('2. Testing authentication...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.local',
    password: 'password'
  })

  if (authError) {
    console.log('   ❌ Authentication failed')
    console.log('   Error:', authError.message)
    console.log('   Status:', authError.status)
    console.log('   Code:', authError.code)

    // Try to get more details
    console.log('')
    console.log('   Full error object:')
    console.log(JSON.stringify(authError, null, 2))
  } else {
    console.log('   ✅ AUTHENTICATION SUCCESSFUL!')
    console.log('   User ID:', authData.user?.id)
    console.log('   Email:', authData.user?.email)
    console.log('   Session:', authData.session ? 'Created' : 'Not created')
  }

  // Test 3: Direct API call to Supabase Auth endpoint
  console.log('')
  console.log('3. Testing direct API call to Supabase Auth...')

  const authPayload = JSON.stringify({
    email: 'admin@test.local',
    password: 'password',
    gotrue_meta_security: {}
  })

  const authUrl = new URL(`${SUPABASE_URL}/auth/v1/token?grant_type=password`)

  await new Promise((resolve) => {
    const req = https.request(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Content-Length': authPayload.length
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log('   Response Status:', res.statusCode)
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode === 200) {
            console.log('   ✅ Direct API auth successful')
            console.log('   User ID:', parsed.user?.id)
          } else {
            console.log('   ❌ Direct API auth failed')
            console.log('   Error:', parsed.error || parsed.msg || data)
          }
        } catch (e) {
          console.log('   Response:', data)
        }
        resolve()
      })
    })

    req.on('error', (e) => {
      console.log('   ❌ Request failed:', e.message)
      resolve()
    })

    req.write(authPayload)
    req.end()
  })

  // Test 4: Check if there's a JWT secret mismatch
  console.log('')
  console.log('4. Checking JWT configuration...')

  // Decode the anon key to check its claims
  const [header, payload] = SUPABASE_ANON_KEY.split('.').slice(0, 2).map(part => {
    const decoded = Buffer.from(part, 'base64').toString()
    try {
      return JSON.parse(decoded)
    } catch {
      return decoded
    }
  })

  console.log('   JWT Header:', JSON.stringify(header, null, 2))
  console.log('   JWT Payload:', JSON.stringify(payload, null, 2))
  console.log('   - Issuer:', payload.iss)
  console.log('   - Project Ref:', payload.ref)
  console.log('   - Role:', payload.role)
  console.log('   - Issued:', new Date(payload.iat * 1000).toISOString())
  console.log('   - Expires:', new Date(payload.exp * 1000).toISOString())
}

// Also test with a simple fetch to check connectivity
async function testSimpleQuery() {
  console.log('')
  console.log('5. Testing simple database query...')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('agencies')
    .select('id, name')
    .limit(1)

  if (error) {
    console.log('   ❌ Query failed:', error.message)
  } else {
    console.log('   ✅ Query successful')
    console.log('   Found', data?.length || 0, 'agencies')
    if (data && data.length > 0) {
      console.log('   First agency:', data[0].name)
    }
  }
}

async function main() {
  await testDirectSupabase()
  await testSimpleQuery()

  console.log('')
  console.log('============================================')
  console.log('SUMMARY')
  console.log('============================================')
  console.log('')
  console.log('If authentication fails locally with the same')
  console.log('credentials Vercel is using, then the issue is')
  console.log('in Supabase, not Vercel.')
  console.log('')
  console.log('Possible causes:')
  console.log('1. Password hash is wrong')
  console.log('2. Auth hooks/triggers are interfering')
  console.log('3. RLS policies on auth schema')
  console.log('4. JWT secret mismatch')
}

main().catch(console.error)