# Task 3: Implement User Role Change API

**Story:** 2.3 User Management Interface
**AC:** 2

## Context

Create the API endpoint for admins to change user roles, with validation to prevent removing the last admin from an agency.

## Task

Implement the PATCH endpoint for changing user roles.

## Requirements

1. Create file: `apps/agency/app/api/users/[id]/role/route.ts`
2. PATCH /api/users/[id]/role endpoint
3. Request body: `{ role: 'agency_admin' | 'agency_user' }`
4. Validate current user is agency_admin
5. Prevent removing last admin from agency (at least one admin required)
6. Update user role with audit logging
7. Return updated user
8. Add error handling with handleApiError()

## Implementation

```typescript
// apps/agency/app/api/users/[id]/role/route.ts
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
```

## Architecture Alignment

- Location: `apps/agency/app/api/users/[id]/role/route.ts`
- Use createServerClient from @pleeno/database
- Use handleApiError from @pleeno/utils
- Use UserRoleUpdateSchema from @pleeno/validations
- Follow standard API response format
- RLS automatically filters by agency_id

## Error Handling

- 401: Not authenticated
- 403: Not an admin
- 400: Invalid role value
- 400: Cannot remove last admin
- 500: Database error

## Acceptance Criteria

- [ ] File created at correct location
- [ ] Endpoint validates user is admin
- [ ] Request body validated with Zod schema
- [ ] Last admin check prevents orphaned agencies
- [ ] User role updated successfully
- [ ] Audit trigger logs role changes
- [ ] RLS prevents cross-agency updates
- [ ] Error handling returns consistent format
- [ ] Updated user data returned in response

## Testing

```bash
# Test role change (should succeed)
curl -X PATCH http://localhost:3000/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -d '{"role": "agency_user"}'

# Test removing last admin (should fail)
curl -X PATCH http://localhost:3000/api/users/LAST_ADMIN_ID/role \
  -H "Content-Type: application/json" \
  -d '{"role": "agency_user"}'
```

## Next Steps

After completing this task:
1. Test the endpoint with valid requests
2. Test the last-admin validation
3. Verify audit logging in database
4. Proceed to Task 4: Implement User Status Change API
