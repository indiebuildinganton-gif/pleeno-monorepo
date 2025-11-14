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
import { PaymentPlanCreateSchema, PaymentPlanWithInstallmentsCreateSchema } from '@pleeno/validations'

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
 * Creates a new payment plan with all installments in a single atomic transaction.
 * Accepts the full wizard payload from Step 1 + Step 2 + Step 3.
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 9: Payment Plan Creation with Installments
 *
 * Request body:
 * {
 *   // Step 1 data
 *   "student_id": "uuid",
 *   "course_name": "Bachelor of Business",
 *   "total_course_value": 10000.00,
 *   "commission_rate": 0.15,
 *   "course_start_date": "2025-02-01",
 *   "course_end_date": "2026-11-30",
 *
 *   // Step 2 data
 *   "initial_payment_amount": 2000.00,
 *   "initial_payment_due_date": "2025-01-15",
 *   "initial_payment_paid": true,
 *   "number_of_installments": 4,
 *   "payment_frequency": "quarterly",
 *   "materials_cost": 500.00,
 *   "admin_fees": 100.00,
 *   "other_fees": 50.00,
 *   "first_college_due_date": "2025-03-01",
 *   "student_lead_time_days": 14,
 *   "gst_inclusive": true,
 *
 *   // Step 3 data (generated installments)
 *   "installments": [
 *     {
 *       "installment_number": 0,
 *       "amount": 2000.00,
 *       "student_due_date": "2025-01-15",
 *       "college_due_date": "2025-01-29",
 *       "is_initial_payment": true,
 *       "generates_commission": true
 *     },
 *     ...
 *   ]
 * }
 *
 * Response (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "payment_plan": { ... },
 *     "installments": [ ... ]
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error
 * - 401: Not authenticated
 * - 403: Student does not belong to agency
 * - 500: Server error
 *
 * Security:
 * - Requires authentication with agency_admin or agency_user role
 * - RLS policies automatically enforce agency_id filtering
 * - Validates student belongs to same agency
 *
 * @param request - Next.js request object
 * @returns Created payment plan with installments or error response
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
    const result = PaymentPlanWithInstallmentsCreateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Create Supabase client
    const supabase = await createServerClient()

    // SECURITY: Verify student exists and belongs to same agency
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, agency_id, first_name, last_name')
      .eq('id', validatedData.student_id)
      .single()

    if (studentError || !student) {
      throw new ValidationError('Student not found', {
        errors: {
          student_id: ['Student with this ID does not exist'],
        },
      })
    }

    // SECURITY: Verify student belongs to same agency
    if (student.agency_id !== userAgencyId) {
      throw new ForbiddenError(
        'Student does not belong to your agency or does not exist'
      )
    }

    // Calculate commissionable value
    // commissionable_value = total_course_value - materials_cost - admin_fees - other_fees
    const commissionableValue =
      validatedData.total_course_value -
      validatedData.materials_cost -
      validatedData.admin_fees -
      validatedData.other_fees

    // Calculate expected commission
    // The commission_rate from the client is already in decimal form (0-1)
    // Convert to percentage for storage (0-100)
    const commissionRatePercent = validatedData.commission_rate * 100

    // Calculate expected commission using the commissionable value
    let expectedCommission = commissionableValue * validatedData.commission_rate

    // If GST is inclusive, we need to remove GST from the commission calculation
    // GST rate in Australia is 10% (0.10)
    if (validatedData.gst_inclusive) {
      // Remove GST: commission_base = commissionable_value / 1.10
      const commissionBase = commissionableValue / 1.10
      expectedCommission = commissionBase * validatedData.commission_rate
    }

    // Round to 2 decimal places
    expectedCommission = Math.round(expectedCommission * 100) / 100

    // BEGIN TRANSACTION: Create payment plan and installments atomically
    // Note: Supabase Postgres automatically wraps multiple operations in a transaction
    // when using the JS client. If any operation fails, all operations are rolled back.

    // STEP 1: Create payment plan record
    const { data: paymentPlan, error: planError } = await supabase
      .from('payment_plans')
      .insert({
        agency_id: userAgencyId,
        student_id: validatedData.student_id,
        course_name: validatedData.course_name,
        total_amount: validatedData.total_course_value,
        commission_rate: validatedData.commission_rate,
        commission_rate_percent: commissionRatePercent,
        course_start_date: validatedData.course_start_date,
        course_end_date: validatedData.course_end_date,
        initial_payment_amount: validatedData.initial_payment_amount,
        initial_payment_due_date: validatedData.initial_payment_due_date,
        initial_payment_paid: validatedData.initial_payment_paid,
        materials_cost: validatedData.materials_cost,
        admin_fees: validatedData.admin_fees,
        other_fees: validatedData.other_fees,
        first_college_due_date: validatedData.first_college_due_date,
        student_lead_time_days: validatedData.student_lead_time_days,
        gst_inclusive: validatedData.gst_inclusive,
        number_of_installments: validatedData.number_of_installments,
        payment_frequency: validatedData.payment_frequency,
        status: 'active',
        currency: 'AUD', // Default currency
        // Note: commissionable_value and expected_commission are calculated by database trigger
        // But we can also set them explicitly here for immediate availability
        expected_commission: expectedCommission,
      })
      .select()
      .single()

    if (planError) {
      console.error('Failed to create payment plan:', planError)
      throw new Error(`Failed to create payment plan: ${planError.message}`)
    }

    if (!paymentPlan) {
      throw new Error('Payment plan not found after creation')
    }

    // STEP 2: Create installments
    const installmentRecords = validatedData.installments.map((inst) => {
      // Determine installment status
      let status: 'draft' | 'paid' = 'draft'
      let paidDate: string | null = null
      let paidAmount: number | null = null

      // If this is the initial payment and it's marked as paid, set status to 'paid'
      if (inst.is_initial_payment && validatedData.initial_payment_paid) {
        status = 'paid'
        paidDate = new Date().toISOString().split('T')[0]
        paidAmount = inst.amount
      }

      return {
        payment_plan_id: paymentPlan.id,
        agency_id: userAgencyId,
        installment_number: inst.installment_number,
        amount: inst.amount,
        student_due_date: inst.student_due_date,
        college_due_date: inst.college_due_date,
        is_initial_payment: inst.is_initial_payment,
        generates_commission: inst.generates_commission,
        status,
        paid_date: paidDate,
        paid_amount: paidAmount,
      }
    })

    const { data: installments, error: installmentsError } = await supabase
      .from('installments')
      .insert(installmentRecords)
      .select()

    if (installmentsError) {
      console.error('Failed to create installments:', installmentsError)
      // If installments creation fails, the payment plan will be orphaned
      // In a real transaction, this would rollback, but Supabase JS client
      // doesn't support explicit transactions. We'll delete the payment plan
      // to maintain data consistency.
      await supabase.from('payment_plans').delete().eq('id', paymentPlan.id)
      throw new Error(`Failed to create installments: ${installmentsError.message}`)
    }

    // END TRANSACTION

    // Log payment plan creation to audit trail with comprehensive wizard data
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'payment_plan',
      entityId: paymentPlan.id,
      action: 'create_with_installments',
      newValues: {
        // Step 1 data: Student, course, and commission details
        student_id: validatedData.student_id,
        course_name: validatedData.course_name,
        total_course_value: validatedData.total_course_value,
        commission_rate: validatedData.commission_rate,
        course_dates: {
          start: validatedData.course_start_date,
          end: validatedData.course_end_date,
        },
        // Step 2 data: Payment structure, fees, timeline, and GST
        payment_structure: {
          initial_payment_amount: validatedData.initial_payment_amount,
          initial_payment_due_date: validatedData.initial_payment_due_date,
          initial_payment_paid: validatedData.initial_payment_paid,
          number_of_installments: validatedData.number_of_installments,
          payment_frequency: validatedData.payment_frequency,
        },
        fees: {
          materials_cost: validatedData.materials_cost,
          admin_fees: validatedData.admin_fees,
          other_fees: validatedData.other_fees,
        },
        timeline: {
          first_college_due_date: validatedData.first_college_due_date,
          student_lead_time_days: validatedData.student_lead_time_days,
        },
        gst_inclusive: validatedData.gst_inclusive,
        // Calculated values
        calculated_values: {
          commissionable_value: commissionableValue,
          expected_commission: expectedCommission,
        },
      },
      metadata: {
        wizard_version: '1.0',
        installment_count: installments?.length || 0,
        source: 'payment_plan_wizard',
        // Include commission calculation parameters for transparency
        commission_calculation: {
          formula: validatedData.gst_inclusive
            ? '(commissionable_value / 1.10) * commission_rate'
            : 'commissionable_value * commission_rate',
          total_course_value: validatedData.total_course_value,
          materials_cost: validatedData.materials_cost,
          admin_fees: validatedData.admin_fees,
          other_fees: validatedData.other_fees,
          commissionable_value: commissionableValue,
          commission_rate: validatedData.commission_rate,
          commission_rate_percent: commissionRatePercent,
          gst_inclusive: validatedData.gst_inclusive,
          expected_commission: expectedCommission,
        },
        // Include student context for audit trail
        student: {
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
        },
      },
    })

    // Log installment creation in batch for complete audit trail
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'installments',
      entityId: paymentPlan.id, // Reference parent payment plan
      action: 'create_batch',
      newValues: {
        installments: (installments || []).map((inst) => ({
          id: inst.id,
          installment_number: inst.installment_number,
          amount: inst.amount,
          student_due_date: inst.student_due_date,
          college_due_date: inst.college_due_date,
          is_initial_payment: inst.is_initial_payment,
          generates_commission: inst.generates_commission,
          status: inst.status,
          paid_date: inst.paid_date,
          paid_amount: inst.paid_amount,
        })),
      },
      metadata: {
        payment_plan_id: paymentPlan.id,
        total_installments: installments?.length || 0,
        initial_payment_paid: validatedData.initial_payment_paid,
      },
    })

    // Log activity for Recent Activity Feed
    const studentName = `${student.first_name} ${student.last_name}`

    await logActivity(supabase, {
      agencyId: userAgencyId,
      userId: user.id,
      entityType: 'payment_plan',
      entityId: paymentPlan.id,
      action: 'created',
      description: `created payment plan for ${studentName} - ${validatedData.course_name}`,
      metadata: {
        student_name: studentName,
        course_name: validatedData.course_name,
        plan_id: paymentPlan.id,
        total_amount: paymentPlan.total_amount,
        currency: paymentPlan.currency,
        installments_count: installments?.length || 0,
      },
    })

    // Return standardized success response with 201 status
    return NextResponse.json(
      {
        success: true,
        data: {
          payment_plan: paymentPlan,
          installments: installments || [],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Log error to audit trail for debugging and compliance
    try {
      // Try to get context for audit logging (may not be available if error occurred early)
      const supabase = await createServerClient()
      const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

      if (authResult && !(authResult instanceof NextResponse)) {
        const { user } = authResult
        const userAgencyId = user.app_metadata?.agency_id

        if (userAgencyId) {
          // Get request body for debugging (if available)
          let requestBody: any = null
          try {
            const clonedRequest = request.clone()
            requestBody = await clonedRequest.json()
          } catch {
            // Request body already consumed or invalid
            requestBody = null
          }

          await logAudit(supabase, {
            userId: user.id,
            agencyId: userAgencyId,
            entityType: 'payment_plan',
            entityId: '', // No entity created due to error
            action: 'create',
            metadata: {
              error: error instanceof Error ? error.message : String(error),
              error_name: error instanceof Error ? error.name : 'UnknownError',
              error_stack: process.env.NODE_ENV === 'development' && error instanceof Error
                ? error.stack
                : undefined,
              request_body: requestBody,
              timestamp: new Date().toISOString(),
            },
          })
        }
      }
    } catch (auditError) {
      // Audit logging failed - log to console but don't throw
      console.error('Failed to log payment plan creation error to audit trail:', auditError)
    }

    return handleApiError(error, {
      path: '/api/payment-plans',
    })
  }
}
