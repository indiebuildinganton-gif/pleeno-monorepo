# Story 6-2: Cash Flow Projection Chart - Task 1

## Story Context

**As an** Agency Admin
**I want** a visual chart showing projected cash flow for the next 90 days
**So that** I can anticipate incoming payments and plan accordingly

## Task 1: Create Cash Flow Projection API Route

**Acceptance Criteria:** #1-3, 5

### Task Description

Create the backend API route that powers the cash flow projection chart. This route will query the installments table, group payments by date buckets (day/week/month), and return time series data showing both paid and expected amounts.

### Subtasks

- [ ] Create API route: `GET /api/dashboard/cash-flow-projection`
- [ ] Accept query parameters:
  - `days` (default: 90): number of days to project forward
  - `groupBy` (default: "week"): "day", "week", or "month"
- [ ] Query installments table:
  - Filter by: `agency_id` (via RLS), `student_due_date` between TODAY and TODAY + {days}
  - Include both pending and paid installments
- [ ] Group results by date bucket (day/week/month):
  - Calculate `expected_amount`: SUM(installments.amount WHERE status = 'pending')
  - Calculate `paid_amount`: SUM(installments.amount WHERE status = 'paid')
  - Count installments per bucket
- [ ] Return time series data: `[{ date: string, expected_amount: number, paid_amount: number, installment_count: number, installments: [] }]`
- [ ] Join with students, payment_plans, enrollments, colleges for tooltip details
- [ ] Apply RLS for agency_id filtering
- [ ] Add 5-minute cache for performance

### Context

**Architecture:**
- Component lives in `apps/dashboard/app/components/CashFlowChart.tsx`
- **API route at `apps/dashboard/app/api/cash-flow-projection/route.ts`** ← YOU ARE HERE
- Uses Recharts library for data visualization

**Database Schema:**
- `installments` table: `amount`, `student_due_date`, `status`, `payment_plan_id`
- `payment_plans` table: links to students via enrollments
- `students` table: `full_name` for tooltip details
- `enrollments` table: links students to colleges
- `colleges` table: `name` for context

**Key Constraints:**
- **Date Handling:** All date calculations use agency timezone (`agencies.timezone`). Query range is TODAY to TODAY + 90 days.
- **Date Grouping:**
  - Daily: Each date is a bucket
  - Weekly: `date_trunc('week', student_due_date)` groups by week start (Monday)
  - Monthly: `date_trunc('month', student_due_date)` groups by month start (1st)
- **Performance:** Add 5-minute cache, use database aggregation (SUM, COUNT), limit installments JSON to essential fields
- **Security:** RLS auto-filters by agency_id, use server-side Supabase client

**Query Logic Example (Weekly Grouping):**

```sql
SELECT
  date_trunc('week', student_due_date) AS date_bucket,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS expected_amount,
  COUNT(*) AS installment_count,
  json_agg(json_build_object(
    'student_name', students.full_name,
    'amount', installments.amount,
    'status', installments.status,
    'due_date', installments.student_due_date
  )) AS installments
FROM installments
JOIN payment_plans ON installments.payment_plan_id = payment_plans.id
JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
JOIN students ON enrollments.student_id = students.id
WHERE
  installments.agency_id = auth.uid()  -- RLS auto-applied
  AND installments.student_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
GROUP BY date_bucket
ORDER BY date_bucket ASC;
```

**API Interface:**

```typescript
// GET /api/dashboard/cash-flow-projection
// Query Parameters:
//   - days (number, default: 90)
//   - groupBy (string, default: "week"): "day" | "week" | "month"

// Response:
{
  success: boolean,
  data: Array<{
    date_bucket: string,  // ISO date
    paid_amount: number,
    expected_amount: number,
    installment_count: number,
    installments: Array<{
      student_name: string,
      amount: number,
      status: string,
      due_date: string
    }>
  }>
}
```

### Related Documentation

- [docs/epics.md](docs/epics.md#story-62) - Story requirements and technical notes
- [docs/architecture.md](docs/architecture.md#dashboard-zone) - Dashboard zone architecture
- [docs/PRD.md](docs/PRD.md#flow-4-review-cash-flow-projection) - Critical user flow requirements
- [.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md](.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md) - Predecessor story with established patterns

### Dependencies

Required packages (should already be installed):
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Supabase SSR support
- `date-fns` v4.1.0 - Date manipulation
- `date-fns-tz` - Timezone-aware date helpers
- `zod` v4.x - Schema validation

---

## CRITICAL: Create Implementation Manifest

Before you begin coding, create a manifest file to track progress across all 8 tasks for this story.

**Create:** `docs/stories/prompts/6-2/manifest.md`

**Content:**

```markdown
# Story 6-2: Cash Flow Projection Chart - Implementation Manifest

**Story:** Cash Flow Projection Chart
**Status:** In Progress
**Started:** [INSERT TODAY'S DATE]

## Task Progress

### Task 1: Create Cash Flow Projection API Route
- Status: In Progress
- Started: [INSERT TODAY'S DATE]
- Completed:
- Notes: Creating API route at apps/dashboard/app/api/cash-flow-projection/route.ts

### Task 2: Create CashFlowChart Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Implement Interactive Tooltip
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Add View Toggle Controls
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Implement Real-Time Updates
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Add Widget Header and Controls
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Integrate into Dashboard Page
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through each task]
```

---

## Implementation Steps

1. **Create the manifest file** as specified above
2. **Create the API route file** at `apps/dashboard/app/api/cash-flow-projection/route.ts`
3. **Implement the query logic** with proper date grouping and aggregation
4. **Add caching** for performance (5-minute cache)
5. **Test the endpoint** manually using curl or Postman
6. **Write unit tests** for the API route (optional but recommended)

### Example API Route Structure

```typescript
// apps/dashboard/app/api/cash-flow-projection/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const querySchema = z.object({
  days: z.coerce.number().default(90),
  groupBy: z.enum(['day', 'week', 'month']).default('week'),
})

export async function GET(request: NextRequest) {
  try {
    // 1. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const { days, groupBy } = querySchema.parse({
      days: searchParams.get('days'),
      groupBy: searchParams.get('groupBy'),
    })

    // 2. Create Supabase client with RLS
    const supabase = createClient()

    // 3. Get agency timezone
    const { data: agency } = await supabase
      .from('agencies')
      .select('timezone')
      .single()

    // 4. Build query with date_trunc grouping
    // ... implement query logic here ...

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cash flow projection' },
      { status: 500 }
    )
  }
}

// Add caching
export const revalidate = 300 // 5 minutes
```

---

## Next Steps

After completing Task 1:

1. **Update the manifest** - Mark Task 1 as completed with today's date
2. **Add implementation notes** - Document any decisions or issues encountered
3. **Move to Task 2** - Open `task-2-prompt.md` to create the CashFlowChart component

---

## Testing Checklist

- [ ] API route returns 200 status for valid requests
- [ ] Query parameters (days, groupBy) work correctly
- [ ] Date grouping logic produces correct buckets (daily/weekly/monthly)
- [ ] `paid_amount` only includes status='paid' installments
- [ ] `expected_amount` only includes status='pending' installments
- [ ] RLS filters results by authenticated user's agency_id
- [ ] Response includes student names and amounts in installments array
- [ ] Empty result set returns empty array (no errors)
- [ ] Caching works (5-minute revalidation)

---

**Good luck! Start by creating the manifest file, then implement the API route.**
