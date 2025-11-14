/**
 * Payment Plan API - Create and List Operations
 *
 * This endpoint provides payment plan creation with validation and auto-population,
 * and payment plan listing with comprehensive filtering.
 *
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Story 4.3: Payment Plan List and Detail Views
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  ForbiddenError,
  calculateExpectedCommission,
  logAudit,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { logActivity } from '@pleeno/database'
import { requireRole } from '@pleeno/auth'
import { PaymentPlanCreateSchema } from '@pleeno/validations'

/**
 * GET /api/payment-plans
 *
 * Lists payment plans with comprehensive filtering and pagination.
 *
 * Query parameters:
 * - status?: string[] (multi-select: 'active', 'completed', 'cancelled')
 * - student_id?: string
 * - college_id?: string
 * - branch_id?: string
 * - amount_min?: number
 * - amount_max?: number
 * - installments_min?: number
 * - installments_max?: number
 * - due_date_from?: string (ISO date)
 * - due_date_to?: string (ISO date)
 * - search?: string (student name or reference number)
 * - page?: number (default: 1)
 * - limit?: number (default: 20)
 * - sort_by?: string (default: 'next_due_date')
 * - sort_order?: 'asc' | 'desc' (default: 'asc')
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "enrollment_id": "uuid",
 *       "total_amount": 10000.50,
 *       "currency": "AUD",
 *       "status": "active",
 *       "next_due_date": "2025-02-15",
 *       "total_installments": 10,
 *       "installments_paid_count": 3,
 *       "student": { "first_name": "John", "last_name": "Doe" },
 *       "college": { "name": "University of Example" },
 *       "branch": { "name": "Main Campus" }
 *     }
 *   ],
 *   "meta": {
 *     "total": 50,
 *     "page": 1,
 *     "per_page": 20,
 *     "total_pages": 3
 *   }
 * }
 *
 * Security:
 * - Requires authentication with agency_admin or agency_user role
 * - RLS policies automatically filter by agency_id
 *
 * @param request - Next.js request object
 * @returns Paginated list of payment plans or error response
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url)

    // Parse filter parameters
    const statusParam = searchParams.get('status')
    const statusFilter = statusParam ? statusParam.split(',') : null
    const studentId = searchParams.get('student_id')
    const collegeId = searchParams.get('college_id')
    const branchId = searchParams.get('branch_id')
    const amountMin = searchParams.get('amount_min')
    const amountMax = searchParams.get('amount_max')
    const installmentsMin = searchParams.get('installments_min')
    const installmentsMax = searchParams.get('installments_max')
    const dueDateFrom = searchParams.get('due_date_from')
    const dueDateTo = searchParams.get('due_date_to')
    const search = searchParams.get('search')

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sortBy = searchParams.get('sort_by') || 'next_due_date'
    const sortOrder = (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc'

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new ValidationError('Invalid pagination parameters', {
        errors: {
          page: page < 1 ? ['Page must be >= 1'] : [],
          limit: limit < 1 || limit > 100 ? ['Limit must be between 1 and 100'] : [],
        },
      })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Build base query with joins
    // We'll use a subquery approach to calculate next_due_date and total_installments
    let query = supabase
      .from('payment_plans')
      .select(
        `
        id,
        enrollment_id,
        agency_id,
        total_amount,
        currency,
        start_date,
        commission_rate_percent,
        expected_commission,
        status,
        notes,
        reference_number,
        created_at,
        updated_at,
        enrollment:enrollments (
          id,
          student_id,
          branch_id,
          student:students (
            id,
            first_name,
            last_name
          ),
          branch:branches (
            id,
            name,
            college_id,
            college:colleges (
              id,
              name
            )
          )
        )
      `,
        { count: 'exact' }
      )

    // Apply status filter
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter)
    }

    // Apply amount range filters
    if (amountMin) {
      query = query.gte('total_amount', parseFloat(amountMin))
    }
    if (amountMax) {
      query = query.lte('total_amount', parseFloat(amountMax))
    }

    // Apply enrollment-based filters (student, college, branch)
    if (studentId) {
      query = query.eq('enrollment.student_id', studentId)
    }
    if (branchId) {
      query = query.eq('enrollment.branch_id', branchId)
    }
    if (collegeId) {
      query = query.eq('enrollment.branch.college_id', collegeId)
    }

    // Apply search filter (student name or reference number)
    if (search) {
      // Note: Supabase doesn't support OR conditions directly on nested fields
      // We'll need to fetch all and filter in memory for complex search
      // For reference_number search, we can use ilike
      if (search.includes('-') || search.includes('REF')) {
        // Likely a reference number search
        query = query.ilike('reference_number', `%${search}%`)
      }
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: paymentPlans, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Failed to fetch payment plans:', fetchError)
      throw new Error('Failed to fetch payment plans')
    }

    // For each payment plan, fetch installment data
    const enrichedPlans = await Promise.all(
      (paymentPlans || []).map(async (plan) => {
        // Fetch installments for this payment plan
        const { data: installments } = await supabase
          .from('installments')
          .select('id, student_due_date, status')
          .eq('payment_plan_id', plan.id)

        // Calculate next_due_date (MIN of pending installments)
        const pendingInstallments = (installments || []).filter(
          (inst) => inst.status === 'pending' && inst.student_due_date
        )
        const nextDueDate = pendingInstallments.length > 0
          ? pendingInstallments
              .map((inst) => new Date(inst.student_due_date!))
              .sort((a, b) => a.getTime() - b.getTime())[0]
              .toISOString()
              .split('T')[0]
          : null

        // Calculate total installments
        const totalInstallments = installments?.length || 0

        // Calculate installments paid count
        const installmentsPaidCount = (installments || []).filter(
          (inst) => inst.status === 'paid'
        ).length

        // Apply installments count filter
        const meetsInstallmentsMin = !installmentsMin || totalInstallments >= parseInt(installmentsMin, 10)
        const meetsInstallmentsMax = !installmentsMax || totalInstallments <= parseInt(installmentsMax, 10)

        if (!meetsInstallmentsMin || !meetsInstallmentsMax) {
          return null
        }

        // Apply due date range filter
        if (dueDateFrom && nextDueDate && nextDueDate < dueDateFrom) {
          return null
        }
        if (dueDateTo && nextDueDate && nextDueDate > dueDateTo) {
          return null
        }

        // Apply student name search filter (if not a reference number search)
        if (search && !search.includes('-') && !search.includes('REF')) {
          const studentFirstName = (plan.enrollment as any)?.student?.first_name || ''
          const studentLastName = (plan.enrollment as any)?.student?.last_name || ''
          const fullName = `${studentFirstName} ${studentLastName}`.toLowerCase()
          if (!fullName.includes(search.toLowerCase())) {
            return null
          }
        }

        // Extract enrollment details
        const enrollment = plan.enrollment as any
        const student = enrollment?.student
        const branch = enrollment?.branch
        const college = branch?.college

        return {
          id: plan.id,
          enrollment_id: plan.enrollment_id,
          total_amount: plan.total_amount,
          currency: plan.currency,
          start_date: plan.start_date,
          commission_rate_percent: plan.commission_rate_percent,
          expected_commission: plan.expected_commission,
          status: plan.status,
          reference_number: plan.reference_number,
          notes: plan.notes,
          next_due_date: nextDueDate,
          total_installments: totalInstallments,
          installments_paid_count: installmentsPaidCount,
          student: student ? {
            first_name: student.first_name,
            last_name: student.last_name,
          } : null,
          college: college ? {
            name: college.name,
          } : null,
          branch: branch ? {
            name: branch.name,
          } : null,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
        }
      })
    )

    // Filter out nulls (plans that didn't meet criteria)
    let filteredPlans = enrichedPlans.filter((plan) => plan !== null)

    // Apply sorting
    if (sortBy === 'next_due_date') {
      filteredPlans.sort((a, b) => {
        if (!a.next_due_date && !b.next_due_date) return 0
        if (!a.next_due_date) return 1
        if (!b.next_due_date) return -1
        const comparison = a.next_due_date.localeCompare(b.next_due_date)
        return sortOrder === 'asc' ? comparison : -comparison
      })
    } else if (sortBy === 'total_amount') {
      filteredPlans.sort((a, b) => {
        const comparison = a.total_amount - b.total_amount
        return sortOrder === 'asc' ? comparison : -comparison
      })
    } else if (sortBy === 'created_at') {
      filteredPlans.sort((a, b) => {
        const comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }

    // Recalculate total count after filtering
    const totalCount = filteredPlans.length
    const totalPages = Math.ceil(totalCount / limit)

    // Return standardized success response with pagination metadata
    return NextResponse.json(
      {
        success: true,
        data: filteredPlans,
        meta: {
          total: totalCount,
          page,
          per_page: limit,
          total_pages: totalPages,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/payment-plans',
    })
  }
}

/**
 * POST /api/payment-plans
 *
 * Creates a new payment plan with auto-population of agency_id and commission_rate.
 *
 * Request body:
 * {
 *   "enrollment_id": "uuid",           // Required: Must exist and belong to same agency
 *   "total_amount": 10000.50,          // Required: Must be > 0
 *   "start_date": "2025-01-15",        // Required: ISO date format (YYYY-MM-DD)
 *   "notes": "Optional notes",         // Optional: Max 10,000 characters
 *   "reference_number": "REF-123"      // Optional: Max 255 characters
 * }
 *
 * Response (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "enrollment_id": "uuid",
 *     "agency_id": "uuid",              // Auto-populated from session
 *     "total_amount": 10000.50,
 *     "currency": "AUD",
 *     "start_date": "2025-01-15",
 *     "commission_rate_percent": 15,    // Auto-populated from branch
 *     "expected_commission": 1500.08,   // Auto-calculated
 *     "status": "active",
 *     "notes": "Optional notes",
 *     "reference_number": "REF-123",
 *     "created_at": "2025-01-13T...",
 *     "updated_at": "2025-01-13T..."
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error (invalid fields, enrollment not found, enrollment from different agency)
 * - 401: Not authenticated
 * - 403: Not authorized
 *
 * Security:
 * - Requires authentication with agency_admin or agency_user role
 * - RLS policies automatically enforce agency_id filtering
 * - Validates enrollment belongs to same agency
 * - Commission rate auto-populated from branch (prevents manipulation)
 *
 * @param request - Next.js request object
 * @returns Created payment plan object or error response
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Parse and validate request body
    const body = await request.json()
    const result = PaymentPlanCreateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Create Supabase client
    const supabase = await createServerClient()

    // VALIDATION: Verify enrollment exists and belongs to same agency
    // Also fetch commission_rate_percent from branch for auto-population
    // Fetch additional details for audit trail metadata
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        agency_id,
        program_name,
        student:students (
          first_name,
          last_name
        ),
        branch:branches (
          commission_rate_percent,
          city,
          college:colleges (
            name
          )
        )
      `
      )
      .eq('id', validatedData.enrollment_id)
      .single()

    if (enrollmentError || !enrollment) {
      throw new ValidationError('Enrollment not found', {
        errors: {
          enrollment_id: ['Enrollment with this ID does not exist'],
        },
      })
    }

    // SECURITY: Verify enrollment belongs to same agency
    if (enrollment.agency_id !== userAgencyId) {
      throw new ValidationError('Enrollment not found', {
        errors: {
          enrollment_id: [
            'Enrollment does not belong to your agency or does not exist',
          ],
        },
      })
    }

    // Extract commission rate from branch
    const commissionRatePercent = enrollment.branch?.commission_rate_percent

    if (commissionRatePercent === null || commissionRatePercent === undefined) {
      throw new ValidationError(
        'Branch commission rate not configured for this enrollment'
      )
    }

    // VALIDATION: Verify commission rate is within valid range (0-100)
    if (commissionRatePercent < 0 || commissionRatePercent > 100) {
      throw new ValidationError(
        'Branch commission rate must be between 0 and 100 percent'
      )
    }

    // Calculate expected commission
    const expectedCommission = calculateExpectedCommission(
      validatedData.total_amount,
      commissionRatePercent
    )

    // Create payment plan record
    // RLS policies will enforce agency_id filtering
    const { data: paymentPlan, error: insertError } = await supabase
      .from('payment_plans')
      .insert({
        enrollment_id: validatedData.enrollment_id,
        agency_id: userAgencyId,
        total_amount: validatedData.total_amount,
        currency: 'AUD', // Default currency
        start_date: validatedData.start_date,
        commission_rate_percent: commissionRatePercent,
        expected_commission: expectedCommission,
        status: 'active',
        notes: validatedData.notes || null,
        reference_number: validatedData.reference_number || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create payment plan:', insertError)
      throw new Error('Failed to create payment plan')
    }

    if (!paymentPlan) {
      throw new Error('Payment plan not found after creation')
    }

    // Log payment plan creation to audit trail with comprehensive details
    // This provides transparency for commission calculations and compliance tracking
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'payment_plan',
      entityId: paymentPlan.id,
      action: 'create',
      newValues: {
        enrollment_id: paymentPlan.enrollment_id,
        total_amount: paymentPlan.total_amount,
        currency: paymentPlan.currency,
        start_date: paymentPlan.start_date,
        commission_rate_percent: paymentPlan.commission_rate_percent,
        expected_commission: paymentPlan.expected_commission,
        status: paymentPlan.status,
        notes: paymentPlan.notes,
        reference_number: paymentPlan.reference_number,
      },
      metadata: {
        // Include commission calculation parameters for transparency
        commission_calculation: {
          formula: 'total_amount * (commission_rate_percent / 100)',
          total_amount: paymentPlan.total_amount,
          commission_rate_percent: paymentPlan.commission_rate_percent,
          expected_commission: paymentPlan.expected_commission,
        },
        // Include enrollment context for audit trail
        enrollment: {
          enrollment_id: enrollment.id,
          student_name: enrollment.student
            ? `${enrollment.student.first_name} ${enrollment.student.last_name}`
            : 'Unknown',
          college_name: enrollment.branch?.college?.name || 'Unknown',
          branch_city: enrollment.branch?.city || 'Unknown',
          program_name: enrollment.program_name || 'Unknown',
        },
      },
    })

    // Log activity for Recent Activity Feed (Story 6.4)
    const studentName = enrollment.student
      ? `${enrollment.student.first_name} ${enrollment.student.last_name}`
      : 'Unknown Student'
    const collegeName = enrollment.branch?.college?.name || 'Unknown College'

    await logActivity(supabase, {
      agencyId: userAgencyId,
      userId: user.id,
      entityType: 'payment_plan',
      entityId: paymentPlan.id,
      action: 'created',
      description: `created payment plan for ${studentName} at ${collegeName}`,
      metadata: {
        student_name: studentName,
        college_name: collegeName,
        plan_id: paymentPlan.id,
        total_amount: paymentPlan.total_amount,
        currency: paymentPlan.currency,
      },
    })

    // Return standardized success response with 201 status
    return NextResponse.json(
      {
        success: true,
        data: paymentPlan,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/payment-plans',
    })
  }
}
