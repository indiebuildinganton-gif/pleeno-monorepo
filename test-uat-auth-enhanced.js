#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const https = require('https')

// UAT Configuration
const SUPABASE_URL = 'https://ccmciliwfdtdspdlkuos.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ'
const VERCEL_URL = 'https://pleeno-shell-uat.vercel.app'

// Test user credentials
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

function section(title) {
  console.log('')
  log('=' .repeat(60), BLUE)
  log(title, BOLD)
  log('=' .repeat(60), BLUE)
}

async function testDirectSupabaseAuth() {
  section('TEST 1: Direct Supabase Authentication')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })

  log(`URL: ${SUPABASE_URL}`)
  log(`Email: ${TEST_EMAIL}`)
  log(`Password: ${TEST_PASSWORD}`)
  console.log('')

  try {
    // Test authentication
    log('Attempting authentication...', YELLOW)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    if (authError) {
      log('❌ Authentication failed', RED)
      log(`Error: ${authError.message}`, RED)
      if (authError.status) log(`Status: ${authError.status}`, RED)
      if (authError.code) log(`Code: ${authError.code}`, RED)

      // Additional error details
      console.log('\nFull error object:')
      console.log(JSON.stringify(authError, null, 2))
    } else {
      log('✅ Authentication successful!', GREEN)
      log(`User ID: ${authData.user?.id}`, GREEN)
      log(`Email: ${authData.user?.email}`, GREEN)
      log(`Session token: ${authData.session?.access_token ? 'Present' : 'Missing'}`, GREEN)

      if (authData.user?.app_metadata) {
        console.log('\nApp Metadata:')
        console.log(JSON.stringify(authData.user.app_metadata, null, 2))
      }

      if (authData.user?.user_metadata) {
        console.log('\nUser Metadata:')
        console.log(JSON.stringify(authData.user.user_metadata, null, 2))
      }
    }

    // Test public.users query
    console.log('')
    log('Checking public.users table...', YELLOW)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single()

    if (userError) {
      log('❌ Failed to query public.users', RED)
      log(`Error: ${userError.message}`, RED)
      if (userError.code) log(`Code: ${userError.code}`, RED)
      if (userError.details) log(`Details: ${userError.details}`, RED)
    } else {
      log('✅ User found in public.users', GREEN)
      console.log(JSON.stringify(userData, null, 2))
    }

    // Test agencies query
    console.log('')
    log('Checking agencies table...', YELLOW)
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', '20000000-0000-0000-0000-000000000001')
      .single()

    if (agencyError) {
      log('❌ Failed to query agencies', RED)
      log(`Error: ${agencyError.message}`, RED)
    } else {
      log('✅ Agency found', GREEN)
      console.log(JSON.stringify(agencyData, null, 2))
    }

  } catch (error) {
    log('❌ Unexpected error:', RED)
    console.error(error)
  }
}

async function testVercelEndpoint(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, VERCEL_URL)
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          })
        }
      })
    })

    req.on('error', reject)

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

async function testVercelLogin() {
  section('TEST 2: Vercel Login Endpoint')

  log(`URL: ${VERCEL_URL}/api/auth/login`)
  log(`Email: ${TEST_EMAIL}`)
  log(`Password: ${TEST_PASSWORD}`)
  console.log('')

  try {
    log('Testing login endpoint...', YELLOW)
    const result = await testVercelEndpoint('/api/auth/login', 'POST', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    if (result.status === 200) {
      log('✅ Login successful!', GREEN)
      console.log(JSON.stringify(result.data, null, 2))
    } else {
      log(`❌ Login failed with status ${result.status}`, RED)
      console.log(JSON.stringify(result.data, null, 2))
    }
  } catch (error) {
    log('❌ Failed to reach endpoint:', RED)
    console.error(error)
  }
}

async function testVercelConfig() {
  section('TEST 3: Vercel Configuration Check')

  try {
    log('Checking /api/check-config...', YELLOW)
    const result = await testVercelEndpoint('/api/check-config')

    if (result.status === 200) {
      log('✅ Config endpoint reached', GREEN)
      console.log(JSON.stringify(result.data, null, 2))

      // Verify configuration
      if (result.data.supabase_url === SUPABASE_URL) {
        log('✅ Supabase URL matches', GREEN)
      } else {
        log(`❌ Supabase URL mismatch! Expected: ${SUPABASE_URL}, Got: ${result.data.supabase_url}`, RED)
      }
    } else {
      log(`❌ Config check failed with status ${result.status}`, RED)
    }
  } catch (error) {
    log('❌ Failed to reach config endpoint:', RED)
    console.error(error)
  }
}

async function testVercelDebug() {
  section('TEST 4: Vercel Debug Endpoint')

  try {
    log('Testing /api/debug-auth...', YELLOW)
    const result = await testVercelEndpoint('/api/debug-auth', 'POST', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    if (result.status === 200) {
      log('✅ Debug endpoint reached', GREEN)
      console.log(JSON.stringify(result.data, null, 2))

      // Analyze results
      if (result.data.summary) {
        console.log('')
        log('DIAGNOSIS:', BOLD)
        log(`User exists in public: ${result.data.summary.user_exists_in_public ? '✅' : '❌'}`)
        log(`Auth successful: ${result.data.summary.auth_successful ? '✅' : '❌'}`)
        log(`Likely issue: ${result.data.summary.likely_issue}`, YELLOW)
      }
    } else if (result.status === 404) {
      log('❌ Debug endpoint not found (needs deployment)', YELLOW)
    } else {
      log(`❌ Debug failed with status ${result.status}`, RED)
      console.log(result.data)
    }
  } catch (error) {
    log('❌ Failed to reach debug endpoint:', RED)
    console.error(error)
  }
}

async function runAllTests() {
  log('UAT AUTHENTICATION DIAGNOSTIC TESTS', BOLD)
  log('Testing admin@test.local authentication', YELLOW)

  // Run tests sequentially
  await testDirectSupabaseAuth()
  await testVercelConfig()
  await testVercelLogin()
  await testVercelDebug()

  section('TESTS COMPLETE')
  log('Review the results above to identify the issue', YELLOW)
}

// Run tests
runAllTests().catch(error => {
  log('Fatal error running tests:', RED)
  console.error(error)
  process.exit(1)
})