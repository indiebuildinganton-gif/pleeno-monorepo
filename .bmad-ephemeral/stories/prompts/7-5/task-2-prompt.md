# Story 7-5: Student Payment History Report - Task 2

**Story**: Student Payment History Report
**Task**: Implement Payment History API Route
**Acceptance Criteria**: AC #1, #2, #3, #6

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Create an API route that fetches complete payment history for a student, including all payment plans, installments, and summary totals. This route will support date range filtering and return data structured for both UI display and PDF export.

## Subtasks Checklist

- [ ] Create API route: `GET /api/students/[id]/payment-history`
- [ ] Accept query params:
  - `date_from` (optional, defaults to beginning of time)
  - `date_to` (optional, defaults to today)
- [ ] Query payment history with joins: installments → payment_plans → enrollments → branches → colleges
- [ ] Calculate summary totals:
  - `total_paid = SUM(installments.paid_amount WHERE paid_at IS NOT NULL)`
  - `total_outstanding = SUM(installments.amount WHERE paid_at IS NULL)`
  - `percentage_paid = total_paid / (total_paid + total_outstanding) * 100`
- [ ] Return JSON with payment_plans[], installments[], summary{}
- [ ] Apply RLS filtering by agency_id
- [ ] Test: GET with student_id → Returns payment history with summary

## Acceptance Criteria

**AC #1**: Given I am viewing a student's detail page, When I request a payment history report, Then I see a chronological list of all payment plans and installments for that student

**AC #2**: And each entry shows: date, payment plan, college/branch, amount, payment status, paid date

**AC #3**: And the report shows total paid to date and total outstanding

**AC #6**: And I can filter by date range (all time, this year, custom)

## Context & Constraints

### Key Constraints
- **Multi-Tenant Security**: All queries MUST filter by agency_id via RLS. Never expose data from other agencies.
- **Performance**: Use database function to reduce round trips and optimize query
- **Date Filtering**: Date range filtering must be inclusive of start and end dates
- **Data Completeness**: Include all related data (college, branch, program) for comprehensive display

### Database Schema

**Relevant Tables:**
- `students` table: id, full_name, passport_number, email, agency_id
- `enrollments` table: id, student_id, branch_id, program_name, agency_id
- `payment_plans` table: id, enrollment_id, total_amount, start_date, agency_id
- `installments` table: id, payment_plan_id, amount, due_date, paid_at, paid_amount, status
- `branches` table: id, college_id, name, city
- `colleges` table: id, name

### API Interface

**Endpoint:** `GET /api/students/[id]/payment-history`

**Query Parameters:**
- `date_from`: string (YYYY-MM-DD, optional, defaults to '1970-01-01')
- `date_to`: string (YYYY-MM-DD, optional, defaults to today)

**Response Format:**
```json
{
  "data": [
    {
      "installment_id": "uuid",
      "installment_number": 1,
      "amount": 5000.00,
      "due_date": "2025-01-15",
      "paid_at": "2025-01-10T05:30:00Z",
      "paid_amount": 5000.00,
      "status": "paid",
      "payment_plan_id": "uuid",
      "plan_total_amount": 20000.00,
      "plan_start_date": "2025-01-01",
      "program_name": "Certificate IV in Business",
      "branch_name": "Brisbane Campus",
      "branch_city": "Brisbane",
      "college_name": "Imagine Education"
    }
  ],
  "summary": {
    "total_paid": 15000.00,
    "total_outstanding": 5000.00,
    "percentage_paid": 75.0
  }
}
```

### Dependencies

**Required NPM Packages:**
- `@supabase/supabase-js` (latest) - Supabase client for database queries
- `@supabase/ssr` (latest) - Server-side Supabase utilities for Next.js

### Artifacts & References

**Documentation:**
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context
- `docs/architecture.md` - Multi-Tenant Isolation and RLS patterns

**Related Code:**
- Similar API routes in `apps/entities/app/api/` for reference patterns

## Implementation Guidelines

### Step 1: Create PostgreSQL Function

First, create a database migration for the payment history function:

**File**: `supabase/migrations/XXX_create_student_payment_history_function.sql`

```sql
-- Create function to get student payment history
CREATE OR REPLACE FUNCTION get_student_payment_history(
  p_student_id UUID,
  p_agency_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  installment_id UUID,
  installment_number INT,
  amount NUMERIC,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC,
  status TEXT,
  payment_plan_id UUID,
  plan_total_amount NUMERIC,
  plan_start_date DATE,
  program_name TEXT,
  branch_name TEXT,
  branch_city TEXT,
  college_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS installment_id,
    i.installment_number,
    i.amount,
    i.due_date,
    i.paid_at,
    i.paid_amount,
    i.status::TEXT,
    pp.id AS payment_plan_id,
    pp.total_amount AS plan_total_amount,
    pp.start_date AS plan_start_date,
    e.program_name,
    b.name AS branch_name,
    b.city AS branch_city,
    c.name AS college_name
  FROM installments i
  INNER JOIN payment_plans pp ON i.payment_plan_id = pp.id
  INNER JOIN enrollments e ON pp.enrollment_id = e.id
  INNER JOIN branches b ON e.branch_id = b.id
  INNER JOIN colleges c ON b.college_id = c.id
  WHERE e.student_id = p_student_id
    AND pp.agency_id = p_agency_id
    AND i.due_date >= p_date_from
    AND i.due_date <= p_date_to
  ORDER BY i.due_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Create API Route

**File**: `apps/entities/app/api/students/[id]/payment-history/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const studentId = params.id
    const agencyId = user.user_metadata.agency_id

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const date_from = searchParams.get('date_from') || '1970-01-01'
    const date_to = searchParams.get('date_to') || new Date().toISOString().split('T')[0]

    // Validate student belongs to agency
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('agency_id', agencyId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      )
    }

    // Query payment history using database function
    const { data, error } = await supabase.rpc('get_student_payment_history', {
      p_student_id: studentId,
      p_agency_id: agencyId,
      p_date_from: date_from,
      p_date_to: date_to,
    })

    if (error) {
      console.error('Payment history error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }

    // Calculate summary totals
    const summary = {
      total_paid: data.reduce((sum: number, inst: any) =>
        sum + (inst.paid_amount || 0), 0
      ),
      total_outstanding: data.reduce((sum: number, inst: any) =>
        sum + (inst.paid_at ? 0 : inst.amount), 0
      ),
      percentage_paid: 0,
    }

    // Calculate percentage paid
    const total = summary.total_paid + summary.total_outstanding
    summary.percentage_paid = total > 0
      ? (summary.total_paid / total) * 100
      : 0

    return NextResponse.json({
      data,
      summary,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 3: Create TypeScript Types

**File**: `apps/entities/types/payment-history.ts`

```typescript
export interface PaymentHistoryItem {
  installment_id: string
  installment_number: number
  amount: number
  due_date: string
  paid_at: string | null
  paid_amount: number | null
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  payment_plan_id: string
  plan_total_amount: number
  plan_start_date: string
  program_name: string
  branch_name: string
  branch_city: string
  college_name: string
}

export interface PaymentSummary {
  total_paid: number
  total_outstanding: number
  percentage_paid: number
}

export interface PaymentHistoryResponse {
  data: PaymentHistoryItem[]
  summary: PaymentSummary
}
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 2 as "Completed" with date
2. Test the API route using curl or Postman
3. Move to `task-3-prompt.md` to implement the Timeline display component
4. The Timeline component will consume the data from this API route

## Testing Checklist

- [ ] API route responds to GET requests at `/api/students/[id]/payment-history`
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for students not in user's agency (RLS enforcement)
- [ ] Query parameters date_from and date_to work correctly
- [ ] Returns all installments for student within date range
- [ ] Installments are ordered by due_date DESC (newest first)
- [ ] Summary calculations are correct:
  - [ ] total_paid equals sum of paid_amount WHERE paid_at IS NOT NULL
  - [ ] total_outstanding equals sum of amount WHERE paid_at IS NULL
  - [ ] percentage_paid is calculated correctly
- [ ] Response includes all required fields (college, branch, program, etc.)
- [ ] Database function handles edge cases (no payment plans, all paid, etc.)
- [ ] No console errors or warnings
