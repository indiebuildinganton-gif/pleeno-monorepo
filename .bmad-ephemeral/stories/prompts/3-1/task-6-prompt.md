# Story 3-1: College Registry - Task 6
## Implement Colleges API Endpoints (List & Create)

**Task 6 of 21**: Implement GET and POST /api/colleges

**Previous**: Task 5 (Create activity feed infrastructure) - ✅ Should be completed

---

## Task Details

### Subtasks
- [ ] Create apps/entities/app/api/colleges/route.ts
- [ ] GET /api/colleges - List all colleges for agency (with pagination)
- [ ] POST /api/colleges - Create new college (admin only)
- [ ] Validate commission_rate_percent: 0-100 range
- [ ] Validate gst_status: 'included' or 'excluded'
- [ ] Apply RLS filtering via Supabase client
- [ ] Return college with id, name, city, commission rate, gst_status
- [ ] Log college creation in audit_logs

### Acceptance Criteria: AC 1-2

**Implementation Pattern**:
```typescript
// apps/entities/app/api/colleges/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, ForbiddenError } from '@pleeno/utils'
import { CollegeSchema } from '@pleeno/validations'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // RLS auto-filters by agency_id
    const { data: colleges, error } = await supabase
      .from('colleges')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json({ success: true, data: colleges })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
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
    const validatedData = CollegeSchema.parse(body)

    // Create college (RLS auto-applies agency_id filter)
    const { data: college, error } = await supabase
      .from('colleges')
      .insert({
        agency_id: currentUser.agency_id,
        name: validatedData.name,
        city: validatedData.city,
        default_commission_rate_percent: validatedData.commission_rate,
        gst_status: validatedData.gst_status
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: college })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Key Points**:
- Use createServerClient for RLS-protected queries
- Validate admin role before POST
- Use Zod schema for validation (will create in Task 19)
- Log creation in audit_logs (trigger handles this)
- Return consistent API responses

---

## Manifest Update

Update Task 5 → Completed, Task 6 → In Progress

---

## Success Criteria

- ✅ GET /api/colleges returns all colleges for user's agency
- ✅ POST /api/colleges creates college (admin only)
- ✅ Non-admins get 403 error
- ✅ Validation errors return 400 with details
- ✅ RLS prevents cross-agency access

**Next**: Task 7 - Implement college detail API (GET/PATCH/DELETE /api/colleges/[id])
