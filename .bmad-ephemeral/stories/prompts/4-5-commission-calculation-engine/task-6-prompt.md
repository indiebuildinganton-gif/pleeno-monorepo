# Story 4.5: Commission Calculation Engine - Task 6

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 5 - Payment Plan Detail Commission Display (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 6: Commission by College/Branch Report API

### Acceptance Criteria
AC 4: Per-College/Branch Commission Aggregation
- Aggregation: GROUP BY college_id, branch_id; SUM(earned_commission)
- Includes columns: College Name, Branch Name, Expected Commission, Earned Commission, Outstanding Commission
- Sortable and filterable by college, branch, and date range
- RLS enforcement: agency_id filtering

### Task Description
Create a REST API endpoint that aggregates commission data by college and branch. This endpoint provides the data layer for the commission report page (Task 7).

### Subtasks Checklist
- [ ] Create GET /api/reports/commission-by-college API route
- [ ] Query parameters: { date_from, date_to, college_id?, branch_id? }
- [ ] SQL query with GROUP BY colleges, branches, SUM aggregations
- [ ] Return JSON with college, branch, expected, earned, outstanding, plan count
- [ ] RLS enforcement: agency_id filtering
- [ ] Handle optional filters (date range, specific college, specific branch)

---

## Context & Constraints

### Key Constraints
- Multi-zone architecture: Reports zone (apps/reports/)
- RLS enforcement: All queries filtered by agency_id
- Performance: Use database aggregation (don't fetch all records to client)
- Optional filters: date_from, date_to, college_id, branch_id
- Return format: JSON array for easy table rendering

### Dependencies
```json
{
  "@supabase/supabase-js": "latest"
}
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 5:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 5]
3. Update Task 6:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Create API Route
Create: `apps/reports/app/api/commission-by-college/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');
  const college_id = searchParams.get('college_id');
  const branch_id = searchParams.get('branch_id');

  // Initialize Supabase client with user session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    }
  );

  // Verify user session
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Build query with GROUP BY and SUM aggregations
  let query = supabase
    .from('payment_plans')
    .select(`
      id,
      expected_commission,
      earned_commission,
      created_at,
      enrollments!inner (
        id,
        branches!inner (
          id,
          name,
          colleges!inner (
            id,
            name
          )
        )
      )
    `)
    .eq('agency_id', session.user.agency_id)
    .eq('status', 'active');

  // Apply optional filters
  if (date_from) {
    query = query.gte('created_at', date_from);
  }
  if (date_to) {
    query = query.lte('created_at', date_to);
  }
  if (college_id) {
    query = query.eq('enrollments.branches.colleges.id', college_id);
  }
  if (branch_id) {
    query = query.eq('enrollments.branches.id', branch_id);
  }

  const { data: paymentPlans, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate data by college and branch
  const aggregated = aggregateCommissionData(paymentPlans);

  return NextResponse.json(aggregated);
}

function aggregateCommissionData(paymentPlans: any[]) {
  const aggregationMap = new Map<string, {
    college_id: string;
    college_name: string;
    branch_id: string;
    branch_name: string;
    total_expected: number;
    total_earned: number;
    total_outstanding: number;
    plan_count: number;
  }>();

  paymentPlans.forEach(plan => {
    const college = plan.enrollments.branches.colleges;
    const branch = plan.enrollments.branches;
    const key = `${college.id}-${branch.id}`;

    if (!aggregationMap.has(key)) {
      aggregationMap.set(key, {
        college_id: college.id,
        college_name: college.name,
        branch_id: branch.id,
        branch_name: branch.name,
        total_expected: 0,
        total_earned: 0,
        total_outstanding: 0,
        plan_count: 0,
      });
    }

    const agg = aggregationMap.get(key)!;
    agg.total_expected += plan.expected_commission || 0;
    agg.total_earned += plan.earned_commission || 0;
    agg.total_outstanding += (plan.expected_commission - plan.earned_commission) || 0;
    agg.plan_count += 1;
  });

  return Array.from(aggregationMap.values());
}
```

### Step 2: Alternative - Use Database View (Optional)
If using the database view from Task 10, simplify the query:

```typescript
let query = supabase
  .from('payment_plans_with_commission')
  .select(`
    *,
    enrollments!inner (
      branches!inner (
        id, name,
        colleges!inner (id, name)
      )
    )
  `)
  .eq('agency_id', session.user.agency_id)
  .eq('status', 'active');
```

### Step 3: Add Response Type Definition
```typescript
export interface CommissionByCollegeResponse {
  college_id: string;
  college_name: string;
  branch_id: string;
  branch_name: string;
  total_expected: number;
  total_earned: number;
  total_outstanding: number;
  plan_count: number;
}
```

---

## SQL Query Pattern

### Direct SQL Approach (if using raw SQL)
```sql
SELECT
  colleges.id AS college_id,
  colleges.name AS college_name,
  branches.id AS branch_id,
  branches.name AS branch_name,
  SUM(payment_plans.expected_commission) AS total_expected,
  SUM(payment_plans.earned_commission) AS total_earned,
  SUM(payment_plans.expected_commission - payment_plans.earned_commission) AS total_outstanding,
  COUNT(payment_plans.id) AS plan_count
FROM payment_plans
JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
JOIN branches ON enrollments.branch_id = branches.id
JOIN colleges ON branches.college_id = colleges.id
WHERE payment_plans.agency_id = $1
  AND payment_plans.status = 'active'
  AND ($2::date IS NULL OR payment_plans.created_at >= $2)
  AND ($3::date IS NULL OR payment_plans.created_at <= $3)
  AND ($4::uuid IS NULL OR colleges.id = $4)
  AND ($5::uuid IS NULL OR branches.id = $5)
GROUP BY colleges.id, colleges.name, branches.id, branches.name
ORDER BY total_earned DESC
```

---

## Testing Requirements

### Integration Tests
Create: `apps/reports/__tests__/api/commission-by-college.test.ts`

Test cases:
1. **Basic Aggregation**:
   - Create payment plans for multiple colleges/branches
   - Verify aggregation returns correct sums
2. **Date Range Filter**:
   - Filter by date_from and date_to
   - Verify only plans in range included
3. **College Filter**:
   - Filter by specific college_id
   - Verify only that college's data returned
4. **Branch Filter**:
   - Filter by specific branch_id
   - Verify only that branch's data returned
5. **RLS Enforcement**:
   - Verify agency_id filtering works
   - Verify user can't see other agencies' data
6. **Empty Results**:
   - No payment plans match filters
   - Returns empty array (not error)
7. **Plan Count**:
   - Verify plan_count is accurate
8. **Outstanding Calculation**:
   - Verify total_outstanding = total_expected - total_earned

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Files
- API Route: `apps/reports/app/api/commission-by-college/route.ts` (NEW)
- Database Schema: payment_plans, enrollments, branches, colleges tables
- RLS Policies: agency_id filtering on payment_plans

### Dependencies from Previous Tasks
- Task 3: Commission calculation logic
- Task 4: earned_commission field updated by payment recording
- Database: payment_plans.earned_commission field

---

## Next Steps

After completing Task 6:
1. Update MANIFEST.md:
   - Task 6 status: "Completed"
   - Task 6 completed date
   - Add notes: API endpoint created, aggregation working
2. Test API endpoint with various filters
3. Move to Task 7: Commission by College/Branch Report Page
4. Reference file: `task-7-prompt.md`

---

## Success Criteria

Task 6 is complete when:
- [x] GET /api/reports/commission-by-college endpoint created
- [x] Query aggregates by college and branch
- [x] Optional filters work (date range, college_id, branch_id)
- [x] RLS enforcement: agency_id filtering applied
- [x] Response includes expected, earned, outstanding, plan count
- [x] Integration tests pass
- [x] API returns correct aggregations for test data
- [x] MANIFEST.md updated with Task 6 completion
