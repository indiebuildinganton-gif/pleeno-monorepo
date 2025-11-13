# Task 5: Implement Invitation Management APIs

**Story:** 2.3 User Management Interface
**AC:** 5, 6

## Context

Create API endpoints for admins to resend and delete pending invitations.

## Task

Implement the resend and delete endpoints for invitation management.

## Requirements

### Resend Invitation (AC: 5)
1. Create file: `apps/agency/app/api/invitations/[id]/resend/route.ts`
2. POST /api/invitations/[id]/resend endpoint
3. Validate invitation exists and is pending
4. Extend expiration by 7 days from current time
5. Resend invitation email with updated expiration
6. Log resend action in audit log
7. Return updated invitation

### Delete Invitation (AC: 6)
1. Update file: `apps/agency/app/api/invitations/[id]/route.ts`
2. DELETE /api/invitations/[id] endpoint
3. Validate invitation exists and is pending
4. Hard delete invitation
5. Log deletion in audit log
6. Return success response

## Implementation

### Resend Endpoint

```typescript
// apps/agency/app/api/invitations/[id]/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError
} from '@pleeno/utils'
import { sendInvitationEmail } from '@pleeno/email' // Assuming email utility exists

export async function POST(
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

    // Get invitation and validate it's pending
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', params.id)
      .eq('agency_id', currentUser.agency_id) // RLS check
      .single()

    if (invitationError || !invitation) {
      throw new ValidationError('Invitation not found')
    }

    if (invitation.used_at) {
      throw new ValidationError('Cannot resend used invitation')
    }

    // Extend expiration by 7 days from now
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    // Update invitation expiration
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('invitations')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Resend invitation email
    await sendInvitationEmail({
      email: invitation.email,
      invitationToken: invitation.token,
      agencyName: invitation.agency_name,
      expiresAt: newExpiresAt
    })

    // Log resend action
    await supabase.from('audit_log').insert({
      entity_type: 'invitation',
      entity_id: params.id,
      user_id: user.id,
      action: 'resend',
      changes_json: {
        old_expires_at: invitation.expires_at,
        new_expires_at: newExpiresAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedInvitation
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Delete Endpoint

```typescript
// apps/agency/app/api/invitations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError
} from '@pleeno/utils'

export async function DELETE(
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

    // Get invitation and validate it's pending
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', params.id)
      .eq('agency_id', currentUser.agency_id) // RLS check
      .single()

    if (invitationError || !invitation) {
      throw new ValidationError('Invitation not found')
    }

    if (invitation.used_at) {
      throw new ValidationError('Cannot delete used invitation')
    }

    // Log deletion before deleting
    await supabase.from('audit_log').insert({
      entity_type: 'invitation',
      entity_id: params.id,
      user_id: user.id,
      action: 'delete',
      changes_json: {
        email: invitation.email,
        role: invitation.role
      }
    })

    // Delete invitation (hard delete)
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

## Architecture Alignment

- Resend: `apps/agency/app/api/invitations/[id]/resend/route.ts`
- Delete: `apps/agency/app/api/invitations/[id]/route.ts`
- Use createServerClient from @pleeno/database
- Use handleApiError from @pleeno/utils
- Follow standard API response format
- RLS automatically filters by agency_id
- Audit all actions

## Error Handling

- 401: Not authenticated
- 403: Not an admin
- 400: Invitation not found
- 400: Cannot resend/delete used invitation
- 500: Database or email error

## Acceptance Criteria

### Resend
- [ ] File created at correct location
- [ ] Endpoint validates user is admin
- [ ] Validates invitation exists and is pending
- [ ] Expiration extended by 7 days
- [ ] Email sent with updated expiration
- [ ] Action logged in audit trail
- [ ] RLS prevents cross-agency operations

### Delete
- [ ] DELETE method added to route.ts
- [ ] Endpoint validates user is admin
- [ ] Validates invitation exists and is pending
- [ ] Invitation hard deleted from database
- [ ] Action logged before deletion
- [ ] RLS prevents cross-agency operations

## Testing

```bash
# Test resend invitation (should succeed)
curl -X POST http://localhost:3000/api/invitations/INVITATION_ID/resend

# Test delete invitation (should succeed)
curl -X DELETE http://localhost:3000/api/invitations/INVITATION_ID

# Test resend used invitation (should fail)
curl -X POST http://localhost:3000/api/invitations/USED_INVITATION_ID/resend

# Test delete used invitation (should fail)
curl -X DELETE http://localhost:3000/api/invitations/USED_INVITATION_ID
```

## Next Steps

After completing this task:
1. Test resend endpoint
2. Verify email is sent
3. Test delete endpoint
4. Verify audit logging
5. Proceed to Task 6: Create User Management Page
