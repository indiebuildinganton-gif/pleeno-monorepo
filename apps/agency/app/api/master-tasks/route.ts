/**
 * Master Tasks API - Retrieve all available tasks
 *
 * This endpoint allows authenticated users to fetch the master list of tasks
 * that can be assigned to agency team members.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 07: Create user management page with invitation capability
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, createSuccessResponse } from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'

/**
 * GET /api/master-tasks
 *
 * Retrieves all available master tasks from the database.
 * These tasks can be assigned to users during invitation or later.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "task_name": "Data Entry",
 *       "task_code": "DATA_ENTRY",
 *       "description": "Enter student and payment plan information"
 *     },
 *     ...
 *   ]
 * }
 *
 * Security:
 * - Requires authentication (checked via Supabase RLS)
 * - Master tasks are visible to all authenticated users
 * - No agency_id filtering needed (tasks are global)
 *
 * @param request - Next.js request object
 * @returns List of master tasks or error response
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client (authentication checked via RLS)
    const supabase = await createServerClient()

    // Check authentication - RLS will handle this, but we want to give a better error message
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      )
    }

    // Fetch all master tasks
    // RLS policy allows all authenticated users to view master tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('master_tasks')
      .select('id, task_name, task_code, description')
      .order('task_name', { ascending: true })

    if (tasksError) {
      console.error('Failed to fetch master tasks:', tasksError)
      throw new Error('Failed to fetch master tasks')
    }

    // Return standardized success response
    return createSuccessResponse(tasks || [])
  } catch (error) {
    return handleApiError(error, {
      path: '/api/master-tasks',
    })
  }
}
