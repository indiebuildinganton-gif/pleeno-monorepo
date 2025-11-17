#!/usr/bin/env node

/**
 * Database Seeding Script (Node.js version)
 *
 * Seeds the local Supabase database with development data.
 * This version doesn't require psql - it uses the Supabase client directly.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration (force local for seeding)
// Always use local Supabase for seeding, never production
const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SUPABASE_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

console.log('==========================================')
console.log('Seeding Pleeno Database')
console.log('==========================================')
console.log('')

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const AGENCY_ID = '00000000-0000-0000-0000-000000000001'
const ADMIN_USER_ID = '10000000-0000-0000-0000-000000000001'
const REGULAR_USER_ID = '10000000-0000-0000-0000-000000000002'

async function clearExistingData() {
  console.log('🧹 Clearing existing data...')

  try {
    // Delete users (cascades to related tables)
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Delete agencies
    await supabase.from('agencies').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Delete auth users using admin API
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    if (authUsers && authUsers.users) {
      for (const user of authUsers.users) {
        await supabase.auth.admin.deleteUser(user.id)
      }
    }

    console.log('✅ Existing data cleared')
  } catch (error) {
    console.log('⚠️  Warning during cleanup:', error.message)
    // Continue anyway
  }
}

async function createAgency() {
  console.log('🏢 Creating Demo Agency...')

  const { data, error } = await supabase
    .from('agencies')
    .insert({
      id: AGENCY_ID,
      name: 'Demo Agency'
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating agency:', error.message)
    throw error
  }

  console.log('✅ Agency created:', data.name)
  return data
}

async function createAdminUser() {
  console.log('👤 Creating Admin user...')

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@pleeno.dev',
    password: 'Admin123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Admin User',
      agency_id: AGENCY_ID,
      role: 'agency_admin'
    }
  })

  if (authError) {
    console.error('❌ Error creating admin auth user:', authError.message)
    throw authError
  }

  console.log('  ✓ Auth user created')

  // Create public user record
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: 'admin@pleeno.dev',
      full_name: 'Admin User',
      agency_id: AGENCY_ID,
      role: 'agency_admin',
      status: 'active'
    })

  if (userError) {
    console.error('❌ Error creating admin user record:', userError.message)
    throw userError
  }

  console.log('✅ Admin user created: admin@pleeno.dev / Admin123!')
  return authData.user
}

async function createRegularUser() {
  console.log('👤 Creating Regular user...')

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'user@pleeno.dev',
    password: 'User123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Regular User',
      agency_id: AGENCY_ID,
      role: 'agency_user'
    }
  })

  if (authError) {
    console.error('❌ Error creating regular auth user:', authError.message)
    throw authError
  }

  console.log('  ✓ Auth user created')

  // Create public user record
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: 'user@pleeno.dev',
      full_name: 'Regular User',
      agency_id: AGENCY_ID,
      role: 'agency_user',
      status: 'active'
    })

  if (userError) {
    console.error('❌ Error creating regular user record:', userError.message)
    throw userError
  }

  console.log('✅ Regular user created: user@pleeno.dev / User123!')
  return authData.user
}

async function verifySeeding() {
  console.log('')
  console.log('🔍 Verifying seed data...')

  const { count: agencyCount } = await supabase
    .from('agencies')
    .select('*', { count: 'exact', head: true })

  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { data: authUsers } = await supabase.auth.admin.listUsers()

  console.log('')
  console.log('==========================================')
  console.log('✅ Seed data created successfully!')
  console.log('==========================================')
  console.log(`Agencies: ${agencyCount}`)
  console.log(`Users: ${userCount}`)
  console.log(`Auth users: ${authUsers?.users?.length || 0}`)
  console.log('')
  console.log('Login credentials:')
  console.log('  Admin: admin@pleeno.dev / Admin123!')
  console.log('  User:  user@pleeno.dev / User123!')
  console.log('')
  console.log('Visit: http://localhost:3005/login')
  console.log('==========================================')
}

async function main() {
  try {
    console.log('📊 Connecting to Supabase...')
    console.log(`   URL: ${SUPABASE_URL}`)
    console.log('')

    // Test connection
    const { data, error } = await supabase.from('agencies').select('count').limit(1)
    if (error) {
      console.error('❌ Cannot connect to Supabase')
      console.error('   Error:', error.message)
      console.log('')
      console.log('Please ensure:')
      console.log('  1. Supabase is running: npx supabase start')
      console.log('  2. API port 54321 is accessible')
      process.exit(1)
    }

    console.log('✅ Database connection successful')
    console.log('')

    await clearExistingData()
    console.log('')

    await createAgency()
    console.log('')

    await createAdminUser()
    console.log('')

    await createRegularUser()

    await verifySeeding()

  } catch (error) {
    console.error('')
    console.error('❌ Seeding failed:', error.message)
    console.error('')
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()
