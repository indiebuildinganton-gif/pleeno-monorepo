# Task 4: Implement User Status Change API

**Story:** 2.3 User Management Interface
**AC:** 3, 4

## Context

Create the API endpoint for admins to activate/deactivate users, with validation to prevent self-deactivation.

## Task

Implement the PATCH endpoint for changing user status.

## Requirements

1. Create file: `apps/agency/app/api/users/[id]/status/route.ts`
2. PATCH /api/users/[id]/status endpoint
3. Request body: `{ status: 'active' | 'inactive' }`
4. Validate current user is agency_admin
5. Prevent admin from deactivating themselves
6. Update user status with audit logging
7. Return updated user
8. Add error handling

## Implementation

```typescript
// apps/agency/app/api/users/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError
} from '@pleeno/utils'
import { UserStatusUpdateSchema } from '@pleeno/validations'

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

    // Prevent admin from deactivating themselves
    if (params.id === user.id) {
      throw new ValidationError('Cannot deactivate your own account')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = UserStatusUpdateSchema.parse(body)

    // Set app.current_user_id for audit trigger
    await supabase.rpc('set_config', {
      setting: 'app.current_user_id',
      value: user.id
    })

    // Update user status
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ status: validatedData.status })
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

- Location: `apps/agency/app/api/users/[id]/status/route.ts`
- Use createServerClient from @pleeno/database
- Use handleApiError from @pleeno/utils
- Use UserStatusUpdateSchema from @pleeno/validations
- Follow standard API response format
- RLS automatically filters by agency_id

## Error Handling

- 401: Not authenticated
- 403: Not an admin
- 400: Invalid status value
- 400: Cannot deactivate own account
- 500: Database error

## Acceptance Criteria

- [ ] File created at correct location
- [ ] Endpoint validates user is admin
- [ ] Request body validated with Zod schema
- [ ] Self-deactivation check prevents lockout
- [ ] User status updated successfully
- [ ] Audit trigger logs status changes
- [ ] RLS prevents cross-agency updates
- [ ] Error handling returns consistent format
- [ ] Updated user data returned in response

## Testing

```bash
# Test status change (should succeed)
curl -X PATCH http://localhost:3000/api/users/USER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'

# Test self-deactivation (should fail)
curl -X PATCH http://localhost:3000/api/users/CURRENT_USER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'

# Test reactivation (should succeed)
curl -X PATCH http://localhost:3000/api/users/USER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

## Next Steps

After completing this task:
1. Test the endpoint with valid requests
2. Test the self-deactivation validation
3. Verify audit logging in database
4. Test that inactive users cannot log in
5. Proceed to Task 5: Implement Invitation Management APIs
