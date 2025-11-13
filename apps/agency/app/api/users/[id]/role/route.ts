import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError
} from '@pleeno/utils'
import { UserRoleUpdateSchema } from '@pleeno/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = UserRoleUpdateSchema.parse(body)

    // Check if changing to user role and if this is the last admin
    if (validatedData.role === 'agency_user') {
      const { count: adminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', currentUser.agency_id)
        .eq('role', 'agency_admin')
        .eq('status', 'active')

      if (adminCount && adminCount <= 1) {
        throw new ValidationError('Cannot remove last admin from agency')
      }
    }

    // Set app.current_user_id for audit trigger
    await supabase.rpc('set_config', {
      setting: 'app.current_user_id',
      value: user.id
    })

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ role: validatedData.role })
      .eq('id', params.id)
      .eq('agency_id', currentUser.agency_id) // RLS double-check
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    return handleApiError(error)
  }
}
