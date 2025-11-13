# Story 5-4: Payment Status Dashboard Widget - Task 2

## Story Context

**As an** Agency User
**I want** a dashboard widget showing payment status overview at a glance
**So that** I instantly know which payments need attention

---

## Task 2: Implement Payment Status Summary API Route

### Previous Task Completion

✅ **Task 1 Complete**: Dashboard page and layout infrastructure is now set up with shell routing configured and Turborepo integration in place.

### Task Description

Create a RESTful API endpoint that queries the database to calculate payment status summary statistics, including counts and totals for pending, due soon, overdue, and paid installments. The endpoint must enforce Row-Level Security (RLS) and include caching for performance.

### Subtasks

- [ ] Create API route: `GET /api/dashboard/payment-status-summary`
- [ ] Implement database queries to calculate:
  - Count and sum of pending installments
  - Count and sum of due soon installments (due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')
  - Count and sum of overdue installments (status = 'overdue')
  - Count and sum of paid installments (status = 'paid' AND paid_at >= start of current month)
- [ ] Apply RLS to ensure agency_id filtering
- [ ] Return JSON response with counts and totals for each category
- [ ] Add 5-minute caching for performance optimization

### Acceptance Criteria

This task supports **AC #1-5**:
- AC #1: Widget displays payment status summary with count and total value for each status category
- AC #2: Widget displays count and total value of pending payments
- AC #3: Widget displays count and total value of due soon payments (next 7 days)
- AC #4: Widget displays count and total value of overdue payments
- AC #5: Widget displays count and total value of paid payments (this month)

---

## Context & Technical Details

### API Endpoint Interface

From [Story Context](../../.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml):

```typescript
// GET /api/dashboard/payment-status-summary
Response: {
  success: true,
  data: {
    pending: { count: number, total_amount: number },
    due_soon: { count: number, total_amount: number },
    overdue: { count: number, total_amount: number },
    paid_this_month: { count: number, total_amount: number }
  }
}
```

### Database Query Logic

From [Story Context](../../.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml):

```sql
-- Pending: status = 'pending'
-- Due Soon: status = 'pending' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
-- Overdue: status = 'overdue'
-- Paid This Month: status = 'paid' AND paid_at >= date_trunc('month', CURRENT_DATE)
-- All queries filtered by: agency_id = auth.uid() via RLS
```

### Security Constraints

From [docs/architecture.md](../../architecture.md):

- **RLS Enforcement**: All database queries MUST use Row-Level Security via `auth.uid()` for multi-tenant isolation
- **Server-Side Client**: API routes must use server-side Supabase client (not anon key) to maintain auth context
- **JWT Validation**: Dashboard is protected route - middleware validates JWT before access

### Performance Requirements

From [docs/architecture.md](../../architecture.md):

- **Caching**: Implement 5-minute cache for payment status summary to reduce database load
- **Database Indexes**: Queries should leverage indexes on: `status`, `due_date`, `paid_at`, `agency_id`
- **Load Time Target**: Dashboard load time should be <2 seconds

### Dependencies

- **Package**: `@supabase/supabase-js` (Latest) - Database client
- **Package**: `@supabase/ssr` (Latest) - Server-side auth
- **Framework**: Next.js 15.x App Router (Route Handlers)

---

## Implementation Steps

1. **Update Manifest**:
   - Read `docs/stories/prompts/5-4/manifest.md`
   - Update Task 1 status to "Completed" with date (if not already done)
   - Update Task 2 status to "In Progress" with current date

2. **Create API Route File**:
   - Create: `apps/dashboard/app/api/dashboard/payment-status-summary/route.ts`
   - Set up Next.js Route Handler with GET method

3. **Initialize Supabase Client**:
   - Use server-side Supabase client with cookies/auth context
   - Ensure RLS is automatically applied via `auth.uid()`

4. **Implement Database Queries**:
   - Query installments table for each status category:
     - **Pending**: `status = 'pending'` (not including due soon)
     - **Due Soon**: `status = 'pending' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`
     - **Overdue**: `status = 'overdue'`
     - **Paid This Month**: `status = 'paid' AND paid_at >= date_trunc('month', CURRENT_DATE)`
   - Use aggregation functions: `COUNT(*)` and `SUM(amount)`
   - Ensure RLS automatically filters by `agency_id`

5. **Implement Caching**:
   - Add Next.js response caching with 5-minute revalidation
   - Use `export const revalidate = 300` or Next.js cache utilities
   - Consider using `unstable_cache` for more control

6. **Format Response**:
   - Return JSON with structure matching the interface specification
   - Include error handling with appropriate HTTP status codes
   - Ensure amounts are formatted consistently (decimal precision)

7. **Test API Endpoint**:
   - Test with valid auth token
   - Verify RLS filtering works correctly
   - Check response structure matches specification
   - Confirm caching is working

8. **Update Manifest**:
   - Mark Task 2 as "Completed" with completion date
   - Add implementation notes:
     - API endpoint location
     - Caching strategy used
     - Any implementation decisions made

---

## Code Example Structure

```typescript
// apps/dashboard/app/api/dashboard/payment-status-summary/route.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const revalidate = 300 // 5-minute cache

export async function GET(request: Request) {
  try {
    // Initialize Supabase client with server-side auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value
          },
        },
      }
    )

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query pending installments
    // RLS automatically filters by agency_id
    const { data: pendingData, error: pendingError } = await supabase
      .from('installments')
      .select('amount')
      .eq('status', 'pending')
      // Add your aggregation logic here

    // Query due soon installments (pending + due within 7 days)
    // ...

    // Query overdue installments
    // ...

    // Query paid this month installments
    // ...

    // Return formatted response
    return NextResponse.json({
      success: true,
      data: {
        pending: { count: 0, total_amount: 0 },
        due_soon: { count: 0, total_amount: 0 },
        overdue: { count: 0, total_amount: 0 },
        paid_this_month: { count: 0, total_amount: 0 },
      },
    })
  } catch (error) {
    console.error('Payment status summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Next Steps

After completing this task:

1. **Update the manifest file**:
   - Set Task 2 status to "Completed" with date
   - Add implementation notes about the API endpoint and caching strategy

2. **Proceed to Task 3**: Create PaymentStatusWidget Component
   - Prompt file: `task-3-prompt.md`
   - This will create the React component that consumes the API you just built

---

## Reference Documents

- [docs/architecture.md](../../architecture.md) - API structure, RLS patterns, Performance requirements
- [docs/epics.md](../../epics.md) - Epic 5: Story 5.4 requirements
- [Story Context XML](.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml) - Complete technical specification
- [Manifest](manifest.md) - Track progress and implementation notes
