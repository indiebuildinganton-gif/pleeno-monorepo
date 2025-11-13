# Task 1: Create Commission Breakdown API Route

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task creates the backend API route that aggregates commission data by college and branch.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Create the API endpoint that queries and aggregates commission data with GST calculations.

## Acceptance Criteria Coverage
This task addresses AC #1, #2, #4, #7:
- AC #1: Dashboard shows commission earned per college/branch
- AC #2: Each row shows college name, branch name, total commissions, GST, totals, expected/earned/outstanding
- AC #4: Filter by college, branch, time period
- AC #7: Tax calculations (GST) displayed separately and combined

## Task Requirements

### API Route Specification
- **Path**: `GET /api/dashboard/commission-by-college`
- **Location**: `apps/dashboard/app/api/commission-by-college/route.ts`

### Query Parameters
Accept these optional query parameters:
- `period`: "all" | "year" | "quarter" | "month" (default: "all")
- `college_id`: UUID (optional, filter by specific college)
- `branch_id`: UUID (optional, filter by specific branch)

### Data Aggregation Requirements

Query `payment_plans` joined with:
- `enrollments` (links to students and branches)
- `branches` (branch details and commission rates)
- `colleges` (college details and GST status)
- `agencies` (GST rate configuration)
- `installments` (to calculate earned commission from paid amounts)

**Aggregate per college/branch**:
- `total_expected_commission`: SUM(payment_plans.expected_commission)
- `total_earned_commission`: SUM(earned commission from paid installments)
  - Formula: (SUM(paid_amount) / total_amount) * expected_commission
  - Only count installments with status='paid'
- `outstanding_commission`: expected - earned
- `total_commissions`: earned_commission (commission-only amount)
- `total_gst`: Calculate GST based on applicable tax rate
- `total_with_gst`: total_commissions + total_gst
- `payment_plan_count`: COUNT(DISTINCT payment_plans.id)

### GST Calculation Logic
GST calculation depends on `payment_plans.gst_inclusive` flag:
- **If `gst_inclusive = true`**: GST = commission / (1 + gst_rate) * gst_rate
- **If `gst_inclusive = false`**: GST = commission * gst_rate
- **Default GST rate**: 10% (0.1) from `agencies.gst_rate`

### Time Period Filtering
Filter based on `payment_plans.created_at`:
- **all**: No date filter
- **year**: Current year (EXTRACT(YEAR) = current year)
- **quarter**: Current quarter and year
- **month**: Current month and year

### Response Format
```typescript
{
  data: [
    {
      college_id: string
      college_name: string
      branch_id: string
      branch_name: string
      branch_city: string
      total_commissions: number
      total_gst: number
      total_with_gst: number
      total_expected_commission: number
      total_earned_commission: number
      outstanding_commission: number
      payment_plan_count: number
    }
  ]
}
```

### Performance Requirements
- Return sorted by `total_earned_commission DESC` (top-performing colleges first)
- Apply RLS (Row-Level Security) for `agency_id` filtering automatically
- Implement 5-minute cache using Next.js `revalidate` or response caching

## Database Schema Reference

### Tables Involved
```sql
-- payment_plans
payment_plans (
  id UUID,
  agency_id UUID,
  enrollment_id UUID,
  total_amount DECIMAL,
  expected_commission DECIMAL,
  gst_inclusive BOOLEAN,
  status TEXT,
  created_at TIMESTAMP
)

-- installments
installments (
  id UUID,
  payment_plan_id UUID,
  agency_id UUID,
  amount DECIMAL,
  paid_amount DECIMAL,
  status TEXT, -- 'paid', 'pending', 'overdue'
  student_due_date DATE,
  paid_date DATE
)

-- enrollments
enrollments (
  id UUID,
  agency_id UUID,
  student_id UUID,
  branch_id UUID,
  status TEXT
)

-- branches
branches (
  id UUID,
  college_id UUID,
  agency_id UUID,
  name TEXT,
  city TEXT,
  commission_rate_percent DECIMAL
)

-- colleges
colleges (
  id UUID,
  agency_id UUID,
  name TEXT,
  gst_status TEXT,
  default_commission_rate_percent DECIMAL
)

-- agencies
agencies (
  id UUID,
  name TEXT,
  currency TEXT,
  gst_rate DECIMAL -- default: 0.1 (10%)
)
```

## Implementation Guidance

### SQL Query Pattern
```sql
SELECT
  colleges.id AS college_id,
  colleges.name AS college_name,
  branches.id AS branch_id,
  branches.name AS branch_name,
  branches.city AS branch_city,

  -- Expected commission
  SUM(payment_plans.expected_commission) AS total_expected_commission,

  -- Earned commission (from paid installments)
  SUM(
    COALESCE(
      (paid_installments.total_paid / payment_plans.total_amount) * payment_plans.expected_commission,
      0
    )
  ) AS total_earned_commission,

  -- GST calculation (depends on gst_inclusive flag)
  SUM(
    CASE
      WHEN payment_plans.gst_inclusive THEN
        COALESCE(
          ((paid_installments.total_paid / payment_plans.total_amount) * payment_plans.expected_commission) / (1 + agencies.gst_rate) * agencies.gst_rate,
          0
        )
      ELSE
        COALESCE(
          ((paid_installments.total_paid / payment_plans.total_amount) * payment_plans.expected_commission) * agencies.gst_rate,
          0
        )
    END
  ) AS total_gst,

  COUNT(DISTINCT payment_plans.id) AS payment_plan_count

FROM payment_plans
JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
JOIN branches ON enrollments.branch_id = branches.id
JOIN colleges ON branches.college_id = colleges.id
JOIN agencies ON payment_plans.agency_id = agencies.id

-- Left join to calculate paid amount per plan
LEFT JOIN (
  SELECT payment_plan_id, SUM(paid_amount) AS total_paid
  FROM installments
  WHERE status = 'paid'
  GROUP BY payment_plan_id
) paid_installments ON payment_plans.id = paid_installments.payment_plan_id

WHERE
  payment_plans.agency_id = :agency_id  -- RLS auto-applied
  AND [time_period_filter]
  AND (:college_id IS NULL OR colleges.id = :college_id)
  AND (:branch_id IS NULL OR branches.id = :branch_id)

GROUP BY colleges.id, colleges.name, branches.id, branches.name, branches.city
ORDER BY total_earned_commission DESC;
```

### TypeScript Implementation Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Query parameter validation schema
const querySchema = z.object({
  period: z.enum(['all', 'year', 'quarter', 'month']).default('all'),
  college_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = querySchema.parse({
      period: searchParams.get('period') || 'all',
      college_id: searchParams.get('college_id') || undefined,
      branch_id: searchParams.get('branch_id') || undefined,
    })

    // Create authenticated Supabase client (RLS applies automatically)
    const supabase = createServerClient()

    // Build and execute query
    // [Your implementation here]

    // Return response with caching
    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch commission breakdown' },
      { status: 500 }
    )
  }
}
```

## Architecture Context

### Dashboard Zone
- This API lives in the **Dashboard microfrontend** at `apps/dashboard/`
- Uses Next.js App Router API routes (`app/api/...`)
- Server-side Supabase client enforces RLS automatically

### Security (RLS)
- All queries MUST respect Row-Level Security policies
- `agency_id` filtering happens automatically via RLS
- Use server-side Supabase client (not anon key)
- JWT auth middleware protects dashboard routes

### Performance Optimizations
**Database Indexes** (may already exist):
```sql
CREATE INDEX idx_payment_plans_agency_created ON payment_plans(agency_id, created_at);
CREATE INDEX idx_installments_status_plan ON installments(payment_plan_id, status) WHERE status = 'paid';
CREATE INDEX idx_enrollments_branch ON enrollments(branch_id);
CREATE INDEX idx_branches_college ON branches(college_id);
```

**Caching Strategy**:
- API route: 5-minute cache (HTTP Cache-Control headers)
- Consider materialized view for pre-computed aggregates (future optimization)

## Testing Requirements

### Unit Tests Required
Create: `apps/dashboard/__tests__/api/commission-by-college.test.ts`

**Test Cases**:
1. Test commission aggregation by college/branch
   - Verify correct grouping by college and branch
   - Verify SUM aggregations (expected, earned, outstanding)
2. Test time period filtering
   - Test "all": Returns all data
   - Test "year": Returns current year data only
   - Test "quarter": Returns current quarter data only
   - Test "month": Returns current month data only
3. Test college/branch filtering
   - Filter by college_id: Returns only that college's branches
   - Filter by branch_id: Returns only that branch
   - No filters: Returns all colleges/branches
4. Test expected vs earned commission calculation
   - Verify proportional calculation based on paid installments
   - Verify outstanding = expected - earned
5. Test GST calculation
   - Test inclusive mode: GST extracted from total
   - Test exclusive mode: GST added to total
   - Test mixed mode (different plans with different GST settings)
6. Test sorting (default: earned DESC)
7. Verify RLS filtering by agency_id
   - Ensure only current agency's data is returned

### Test Pattern
```typescript
import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'

describe('GET /api/dashboard/commission-by-college', () => {
  it('aggregates commission by college/branch', async () => {
    // Mock Supabase client
    // Create test request
    // Call GET handler
    // Assert response structure and calculations
  })

  it('filters by time period', async () => {
    // Test period=year filtering
  })

  it('calculates GST correctly for inclusive mode', async () => {
    // Test GST = commission / (1 + rate) * rate
  })

  // ... more tests
})
```

## Dependencies
- `@supabase/supabase-js` - Database client
- `zod` - Query parameter validation
- `next` - Next.js API route framework
- `date-fns` - Date manipulation for time period filtering

## Success Criteria
- [ ] API route created at correct path
- [ ] Query parameters validated (period, college_id, branch_id)
- [ ] Database query joins all required tables
- [ ] Commission aggregation calculates correctly (expected, earned, outstanding)
- [ ] GST calculation handles both inclusive and exclusive modes
- [ ] Time period filtering works for all four options
- [ ] College/branch filtering works
- [ ] Response sorted by earned_commission DESC
- [ ] RLS enforced (only current agency's data returned)
- [ ] 5-minute cache implemented
- [ ] Unit tests written and passing
- [ ] Error handling implemented

## Related Files
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`
- Context file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.context.xml`

## Next Steps
After completing this task, proceed to **Task 2: Create CommissionBreakdownTable Component** which will consume this API endpoint.
