# Task 1: Create CSV Export API Route

## Story Context
**Epic 7.2**: CSV Export Functionality
**User Story**: As an Agency User, I want to export reports to CSV format, so that I can import payment data into Excel or accounting software.

## Task Objective
Create the CSV export API route that accepts filter parameters and returns a properly formatted CSV file with the correct headers and content disposition.

## Acceptance Criteria Coverage
- AC #1: CSV file is downloaded with all report data
- AC #3: CSV respects selected columns and filters
- AC #4: Currency amounts formatted correctly
- AC #5: Dates in ISO format (YYYY-MM-DD)
- AC #6: Filename includes report type and timestamp

## Implementation Requirements

### 1. Create API Route File
**Path**: `apps/reports/app/api/reports/payment-plans/export/route.ts`

### 2. Query Parameters to Accept
- `format`: "csv" (or "pdf" for future Story 7.3)
- `date_from`, `date_to`: ISO date strings (optional)
- `college_id`, `branch_id`, `student_id`: UUIDs (optional)
- `status[]`: Array of payment status strings (optional)
- `contract_expiration_from`, `contract_expiration_to`: ISO date strings (optional)
- `columns[]`: Array of column keys (optional, defaults to all columns)

### 3. Database Query
Reuse the same query logic from the report generation API:

```sql
SELECT
  pp.id,
  pp.total_amount,
  pp.currency,
  pp.start_date,
  pp.commission_rate_percent,
  pp.expected_commission,
  pp.earned_commission,
  pp.status,
  s.full_name AS student_name,
  c.name AS college_name,
  b.name AS branch_name,
  b.city AS branch_city,
  b.contract_expiration_date
FROM payment_plans pp
INNER JOIN enrollments e ON pp.enrollment_id = e.id
INNER JOIN students s ON e.student_id = s.id
INNER JOIN branches b ON e.branch_id = b.id
INNER JOIN colleges c ON b.college_id = c.id
WHERE pp.agency_id = ? -- RLS auto-applied
-- Apply filters dynamically
```

### 4. Response Headers
```typescript
{
  'Content-Type': 'text/csv; charset=utf-8',
  'Content-Disposition': 'attachment; filename="payment_plans_YYYY-MM-DD_HHmmss.csv"'
}
```

### 5. Filename Format
Generate filename with timestamp: `payment_plans_${timestamp}.csv`
- Format: `YYYY-MM-DD_HHmmss`
- Example: `payment_plans_2025-11-13_143022.csv`

## Subtasks Checklist
- [ ] Create API route: `GET /api/reports/payment-plans/export`
- [ ] Accept all filter params from report generation
- [ ] Accept `columns[]` param for column selection
- [ ] Query payment_plans with same logic as report generation API
- [ ] Transform data rows to CSV format using `csv-stringify`
- [ ] Set HTTP response headers (Content-Type, Content-Disposition)
- [ ] Generate filename with timestamp
- [ ] Test: Verify CSV downloads with correct filename
- [ ] Test: Verify RLS filters by agency_id

## Technical Constraints
- **Security**: All queries MUST filter by agency_id via RLS policies
- **Security**: Validate all filter inputs to prevent SQL injection
- **Performance**: Export queries must complete in <5 seconds per PRD
- **Architecture**: Follow Next.js App Router conventions
- **Data Format**: Currency amounts in decimal format "1234.56" (no symbols)
- **Data Format**: Dates in ISO 8601 format "YYYY-MM-DD"

## Dependencies
- `csv-stringify`: CSV generation library (install if not present)
- `@supabase/supabase-js`: Database client with RLS
- `date-fns`: Date formatting

## Reference Code Pattern

```typescript
// apps/reports/app/api/reports/payment-plans/export/route.ts

import { stringify } from 'csv-stringify/sync'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  // Extract filters
  const filters = {
    date_from: searchParams.get('date_from'),
    date_to: searchParams.get('date_to'),
    college_id: searchParams.get('college_id'),
    branch_id: searchParams.get('branch_id'),
    student_id: searchParams.get('student_id'),
    status: searchParams.getAll('status[]'),
    contract_expiration_from: searchParams.get('contract_expiration_from'),
    contract_expiration_to: searchParams.get('contract_expiration_to'),
  }

  // Extract selected columns
  const selectedColumns = searchParams.getAll('columns[]')
  const columns = selectedColumns.length > 0 ? selectedColumns : DEFAULT_COLUMNS

  // Get authenticated user and supabase client
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Query payment plans (RLS auto-applies agency_id filter)
  let query = supabase
    .from('payment_plans')
    .select(`
      id,
      total_amount,
      currency,
      start_date,
      commission_rate_percent,
      expected_commission,
      earned_commission,
      status,
      enrollments (
        student:students (
          id,
          full_name
        ),
        branch:branches (
          id,
          name,
          city,
          contract_expiration_date,
          college:colleges (
            id,
            name
          )
        )
      )
    `)

  // Apply filters dynamically
  if (filters.date_from) {
    query = query.gte('start_date', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('start_date', filters.date_to)
  }
  // ... apply other filters

  const { data, error } = await query

  if (error) {
    console.error('Export query error:', error)
    return new Response('Export failed', { status: 500 })
  }

  // Format as CSV (delegated to Task 2)
  if (format === 'csv') {
    return exportAsCSV(data, columns)
  }

  return new Response('Invalid format', { status: 400 })
}
```

## Testing Requirements
- Unit test: Verify query parameter extraction
- Unit test: Verify filter application
- Integration test: Verify RLS filtering by agency_id
- Integration test: Verify correct filename generation
- Integration test: Verify CSV downloads successfully

## Next Task
After completing this task, proceed to:
**Task 2: Format CSV Data Correctly** - Implement the CSV formatting logic with proper headers, currency formatting, date formatting, and UTF-8 BOM.
