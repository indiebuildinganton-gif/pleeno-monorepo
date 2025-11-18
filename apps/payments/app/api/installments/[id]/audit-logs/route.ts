/**
 * GET /api/installments/[id]/audit-logs
 *
 * Fetches audit logs for a specific installment with user information.
 * Used by Payment History Timeline to display payment history.
 *
 * Features:
 * - RLS enforcement via agency_id
 * - Returns audit logs with user details (name, email)
 * - Ordered by created_at descending (most recent first)
 * - Filtered to only 'payment_recorded' actions
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 10: Payment History Timeline (Optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'

/**
 * GET handler for fetching installment audit logs
 *
 * @param request - Next.js request object
 * @param params - Route params with installment ID
 * @returns JSON response with audit logs or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const installmentId = params.id

    // Validate installment ID format
    if (!installmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Installment ID is required',
        },
        { status: 400 }
      )
    }

    // Create authenticated Supabase client (with RLS enforcement)
    const supabase = await createServerClient()

    // Get current user for authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Get user's agency_id from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found or missing agency',
        },
        { status: 403 }
      )
    }

    // First verify the installment belongs to the user's agency
    // This ensures RLS enforcement and prevents unauthorized access
    const { data: installment, error: installmentError } = await supabase
      .from('installments')
      .select('id, agency_id')
      .eq('id', installmentId)
      .single()

    if (installmentError || !installment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Installment not found',
        },
        { status: 404 }
      )
    }

    // Verify agency ownership
    if (installment.agency_id !== profile.agency_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access to installment',
        },
        { status: 403 }
      )
    }

    // Fetch audit logs for this installment with user information
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select(
        `
        id,
        agency_id,
        user_id,
        entity_type,
        entity_id,
        action,
        old_values,
        new_values,
        metadata,
        ip_address,
        user_agent,
        created_at,
        user:user_id (
          id,
          name,
          email
        )
      `
      )
      .eq('entity_type', 'installment')
      .eq('entity_id', installmentId)
      .eq('agency_id', profile.agency_id) // Ensure RLS enforcement
      .in('action', ['payment_recorded', 'updated']) // Only payment-related actions
      .order('created_at', { ascending: false }) // Most recent first

    if (auditError) {
      console.error('Error fetching audit logs:', auditError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch audit logs',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: auditLogs || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in audit logs endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
