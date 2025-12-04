#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// UAT Configuration
const SUPABASE_URL = 'https://ccmciliwfdtdspdlkuos.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyODA0MzQsImV4cCI6MjA0ODg1NjQzNH0.iCmkXYvZJfJkkobO7xON7WyDjOHKMhRQ8Wx1ixnJKEI'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required')
  console.log('Get it from: https://supabase.com/dashboard/project/ccmciliwfdtdspdlkuos/settings/api')
  console.log('Look for the "service_role" secret key')
  process.exit(1)
}

const AGENCY_ID = '20000000-0000-0000-0000-000000000001'

async function createUATAdmin() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('==========================================')
  console.log('Creating UAT Admin User')
  console.log('==========================================')
  console.log('')

  try {
    // Step 1: Create the agency first
    console.log('📝 Creating agency...')
    const { error: agencyError } = await supabase
      .from('agencies')
      .insert({
        id: AGENCY_ID,
        name: 'Global Education Services'
      })

    if (agencyError && !agencyError.message.includes('duplicate')) {
      console.error('Error creating agency:', agencyError.message)
      // Continue anyway - agency might exist
    } else {
      console.log('✅ Agency created/exists')
    }

    // Step 2: Create auth user with the test credentials
    console.log('')
    console.log('👤 Creating admin user...')

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@test.local',
      password: 'password',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        agency_id: AGENCY_ID,
        role: 'agency_admin'
      },
      app_metadata: {
        agency_id: AGENCY_ID,
        role: 'agency_admin'
      }
    })

    if (authError) {
      if (authError.message.includes('already')) {
        console.log('ℹ️  User already exists, updating password...')

        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers()
        const user = users.users.find(u => u.email === 'admin@test.local')

        if (user) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            password: 'password',
            user_metadata: {
              full_name: 'Admin User',
              agency_id: AGENCY_ID,
              role: 'agency_admin'
            },
            app_metadata: {
              agency_id: AGENCY_ID,
              role: 'agency_admin'
            }
          })

          if (updateError) {
            console.error('Error updating user:', updateError.message)
          } else {
            console.log('✅ Password and metadata updated')
          }

          // Use existing user ID for next steps
          authData = { user: user }
        }
      } else {
        console.error('Error creating user:', authError.message)
        process.exit(1)
      }
    } else {
      console.log('✅ Auth user created')
    }

    // Step 3: Create/update public user record
    if (authData && authData.user) {
      console.log('')
      console.log('📋 Creating user record...')

      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: 'admin@test.local',
          full_name: 'Admin User',
          agency_id: AGENCY_ID,
          role: 'agency_admin',
          status: 'active'
        }, {
          onConflict: 'id'
        })

      if (userError) {
        console.error('Error creating user record:', userError.message)
      } else {
        console.log('✅ User record created/updated')
      }
    }

    console.log('')
    console.log('==========================================')
    console.log('✅ UAT Admin User Ready!')
    console.log('==========================================')
    console.log('')
    console.log('Login Credentials:')
    console.log('  URL:      https://pleeno-shell-uat.vercel.app')
    console.log('  Email:    admin@test.local')
    console.log('  Password: password')
    console.log('')
    console.log('Test with:')
    console.log('  curl https://pleeno-shell-uat.vercel.app/api/auth/login \\')
    console.log('    -H "Content-Type: application/json" \\')
    console.log('    -d \'{"email":"admin@test.local","password":"password"}\'')
    console.log('==========================================')

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

createUATAdmin()