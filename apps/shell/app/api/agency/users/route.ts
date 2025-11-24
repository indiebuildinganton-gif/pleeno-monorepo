/**
 * Agency Users API - Admin-only endpoint for managing agency users
 *
 * This is an example protected API route demonstrating RBAC implementation.
 * Only agency admins can access this endpoint.
 *
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.3: Authentication & Authorization Framework
 * Task 4: Implement Role-Based Access Control
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@pleeno/auth/server'
import { createServerClient } from '@pleeno/database/server'

/**
 * GET /api/agency/users
 *
 * List all users in the authenticated user's agency.
 * Requires agency_admin role.
 *
 * Security:
 * - requireRole() middleware enforces agency_admin access
 * - RLS policies ensure users only see their own agency's data
 * - JWT app_metadata contains agency_id for filtering
 *
 * @returns JSON array of users in the agency
 */
export async function GET(request: NextRequest) {
  // SECURITY BOUNDARY: Only agency admins can list users
  const authResult = await requireRole(request, ['agency_admin'])

  if (authResult instanceof NextResponse) {
    return authResult // Return 401 or 403 error response
  }

  const { user } = authResult
  const supabase = await createServerClient()

  // Get agency_id from JWT metadata (set during registration)
  const agencyId = user.app_metadata?.agency_id

  if (!agencyId) {
    return NextResponse.json(
      { error: 'Agency ID not found in user metadata' },
      { status: 400 }
    )
  }

  // Query users for this agency
  // RLS policies will also filter to ensure tenant isolation
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, status, created_at, updated_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }

  return NextResponse.json({ users })
}

/**
 * POST /api/agency/users
 *
 * Create a new user in the agency (example placeholder).
 * Requires agency_admin role.
 *
 * This is a placeholder demonstrating the pattern.
 * Actual user creation would happen through Supabase Auth + database trigger.
 */
export async function POST(request: NextRequest) {
  // SECURITY BOUNDARY: Only agency admins can create users
  const authResult = await requireRole(request, ['agency_admin'])

  if (authResult instanceof NextResponse) {
    return authResult // Return 401 or 403 error response
  }

  // Placeholder - actual implementation would:
  // 1. Validate request body
  // 2. Create user via Supabase Auth
  // 3. Database trigger creates users table record
  // 4. Return created user data

  return NextResponse.json(
    {
      message: 'User creation endpoint - implementation pending',
      note: 'Actual user creation happens through auth signup + database trigger',
    },
    { status: 501 }
  )
}
