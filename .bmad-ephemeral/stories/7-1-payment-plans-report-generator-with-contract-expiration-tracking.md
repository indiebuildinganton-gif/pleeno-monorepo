# Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to generate custom reports on payment plans with flexible filtering and contract expiration tracking**,
so that **I can analyze payment data for specific time periods, colleges, or students, and proactively manage contract renewals**.

## Acceptance Criteria

1. **Given** I am viewing the reports page
   **When** I configure a payment plans report
   **Then** I can filter by: date range, college/branch, student, payment status, contract expiration date

2. **And** I can select which columns to include in the report

3. **And** the report displays in a table with sorting and pagination

4. **And** the report shows summary totals at the bottom (total amount, total paid, total commission)

5. **And** I can preview the report before exporting

6. **And** the report respects RLS and only shows my agency's data

7. **And** the report includes contract expiration dates for each college/branch

8. **And** I can filter to show only contracts expiring within a specified date range (e.g., next 30 days, next 60 days, next 90 days)

9. **And** contracts nearing expiration are highlighted in the report

## Tasks / Subtasks

- [ ] **Task 1: Create Reports Zone Foundation** (AC: #1)
  - [ ] Create reports zone directory structure:
    - `apps/reports/app/page.tsx` (reports landing page)
    - `apps/reports/app/layout.tsx` (reports navigation)
    - `apps/reports/app/components/` (shared components)
  - [ ] Configure Next.js config for reports zone:
    - Set `basePath: /reports`
    - Configure zone rewrites in shell
  - [ ] Add reports navigation in shell middleware
  - [ ] Create basic reports landing page with "Payment Plans Report" link
  - [ ] Test zone routing: `/reports` loads correctly

- [ ] **Task 2: Create Report Builder UI** (AC: #1, #2, #8)
  - [ ] Create `ReportBuilder.tsx` component with multi-section form:
    - **Filter Section**: Date range, college/branch, student, payment status, contract expiration
    - **Column Selection Section**: Checkboxes for available columns
    - **Actions Section**: "Generate Report", "Reset" buttons
  - [ ] Implement filter inputs using React Hook Form + Zod:
    - Date range picker (from/to)
    - College/branch multi-select dropdown (populated from API)
    - Student search/select (with typeahead)
    - Payment status multi-select (pending, paid, overdue, cancelled)
    - Contract expiration filter: dropdown with presets (next 30/60/90 days) + custom date range
  - [ ] Implement column selection checkboxes:
    - Default columns: Student Name, College, Branch, Plan Amount, Total Paid, Status, Commission, Contract Expiration
    - Optional columns: Created Date, Payment Frequency, Installments Count, Days Until/Overdue
  - [ ] Add "Contract Expiration Report" preset button:
    - Pre-fills filter: `contract_expiration_to = today + 90 days`
    - Pre-selects columns: Student Name, College, Branch, Contract Expiration, Days Until Expiration
  - [ ] Style with Shadcn UI components (Form, Select, DatePicker, Checkbox)
  - [ ] Add form validation (Zod schema):
    - Require at least one column selected
    - Validate date ranges (from <= to)
    - Validate contract expiration range if provided
  - [ ] Test form state management and validation

- [ ] **Task 3: Create Payment Plans Report API Route** (AC: #1, #3, #4, #6, #7, #8, #9)
  - [ ] Create API route: `POST /api/reports/payment-plans`
  - [ ] Define request schema (Zod):
    ```typescript
    interface PaymentPlansReportRequest {
      filters: {
        date_from?: string
        date_to?: string
        college_ids?: string[]
        branch_ids?: string[]
        student_ids?: string[]
        status?: ('pending' | 'paid' | 'overdue' | 'cancelled')[]
        contract_expiration_from?: string
        contract_expiration_to?: string
      }
      columns: string[]
      pagination: {
        page: number
        page_size: number
      }
      sort?: {
        column: string
        direction: 'asc' | 'desc'
      }
    }
    ```
  - [ ] Build dynamic Supabase query based on filters:
    - Base query: `SELECT payment_plans.*, students.name, colleges.name, branches.name, enrollments.contract_expiration_date`
    - Join: `payment_plans → enrollments → students, colleges, branches`
    - Filter by date range: `payment_plans.created_at BETWEEN date_from AND date_to`
    - Filter by college_ids, branch_ids, student_ids (if provided)
    - Filter by status (if provided)
    - Filter by contract expiration: `enrollments.contract_expiration_date BETWEEN contract_expiration_from AND contract_expiration_to`
    - RLS auto-applied: `payment_plans.agency_id = auth.uid()`
  - [ ] Calculate computed fields:
    - `total_paid`: SUM of paid installments
    - `total_remaining`: plan amount - total_paid
    - `earned_commission`: Use commission calculator utility
    - `days_until_contract_expiration`: `enrollments.contract_expiration_date - CURRENT_DATE`
    - `contract_status`: 'expiring_soon' (< 30 days), 'active', 'expired'
  - [ ] Calculate summary totals:
    - `total_plan_amount`: SUM of all plan amounts
    - `total_paid_amount`: SUM of all paid amounts
    - `total_commission`: SUM of all earned commissions
  - [ ] Implement pagination: LIMIT/OFFSET based on page and page_size
  - [ ] Implement sorting: ORDER BY column direction
  - [ ] Return response:
    ```typescript
    interface PaymentPlansReportResponse {
      data: PaymentPlanReportRow[]
      pagination: {
        page: number
        page_size: number
        total_count: number
        total_pages: number
      }
      summary: {
        total_plan_amount: number
        total_paid_amount: number
        total_commission: number
      }
    }
    ```
  - [ ] Add request validation (Zod middleware)
  - [ ] Add error handling (try/catch, return 400/500 errors)
  - [ ] Test API route with various filter combinations
  - [ ] Test RLS enforcement (only agency's data returned)

- [ ] **Task 4: Create Report Results Table Component** (AC: #3, #4, #9)
  - [ ] Create `ReportResultsTable.tsx` using TanStack Table
  - [ ] Define table columns based on selected columns from filter
  - [ ] Implement sorting on all columns (client-side or server-side)
  - [ ] Implement pagination controls:
    - Page size selector (10, 25, 50, 100)
    - Previous/Next buttons
    - Page number input
    - "Showing X-Y of Z results" text
  - [ ] Highlight contracts nearing expiration (AC: #9):
    - Row with `days_until_contract_expiration < 30`: yellow background
    - Row with `days_until_contract_expiration < 7`: orange background
    - Row with `contract_status = 'expired'`: red background
    - Add warning icon/badge for expiring contracts
  - [ ] Display summary totals row at bottom (sticky):
    - Total Plan Amount
    - Total Paid
    - Total Commission
    - Use bold/highlighted styling
  - [ ] Format columns:
    - Currency: `formatCurrency(amount)`
    - Dates: `format(date, 'MMM dd, yyyy')`
    - Status: Badge with color coding
    - Contract expiration: Show date + "X days" relative text
  - [ ] Add loading state (skeleton table rows)
  - [ ] Add empty state: "No payment plans match the selected filters"
  - [ ] Test responsive layout (table → cards on mobile)

- [ ] **Task 5: Integrate Report Builder and Results** (AC: #1, #3, #5)
  - [ ] Create `PaymentPlansReportPage.tsx` main page component
  - [ ] Layout structure:
    - Top: ReportBuilder (collapsible after first run)
    - Bottom: ReportResultsTable (appears after "Generate Report")
  - [ ] Use TanStack Query to fetch report data:
    - `useMutation` for POST /api/reports/payment-plans
    - Store results in query cache
    - Show loading state during API call
  - [ ] Wire "Generate Report" button:
    - Validate form
    - Submit filters + columns to API
    - Display results table on success
    - Show error toast on failure
  - [ ] Implement "Preview" mode (AC: #5):
    - Show report in read-only table before exporting
    - User can adjust filters and regenerate
    - "Export to CSV" and "Export to PDF" buttons appear after preview
  - [ ] Add "Reset Filters" button:
    - Clear all filters
    - Hide results table
    - Expand filter form
  - [ ] Test complete flow: Set filters → Generate → Preview → Adjust → Regenerate

- [ ] **Task 6: Add Contract Expiration Quick Filters** (AC: #8)
  - [ ] Create preset filter buttons in ReportBuilder:
    - "Expiring in 30 days"
    - "Expiring in 60 days"
    - "Expiring in 90 days"
    - "Already expired"
  - [ ] Wire preset buttons to set filters:
    - "Expiring in 30 days": `contract_expiration_from = today`, `contract_expiration_to = today + 30`
    - "Expiring in 60 days": `contract_expiration_to = today + 60`
    - "Expiring in 90 days": `contract_expiration_to = today + 90`
    - "Already expired": `contract_expiration_to = today - 1`
  - [ ] Add visual indicator for active preset (highlighted button)
  - [ ] Allow custom date range override after preset selection
  - [ ] Test preset buttons populate filters correctly

- [ ] **Task 7: Create Colleges/Branches/Students Lookup APIs** (AC: #1)
  - [ ] Create API route: `GET /api/reports/lookup/colleges`
    - Return list of colleges for current agency
    - Format: `{ id, name, branch_count }`
    - Apply RLS filtering
  - [ ] Create API route: `GET /api/reports/lookup/branches?college_id=X`
    - Return branches for specified college(s)
    - Format: `{ id, name, college_id, contract_expiration_date }`
  - [ ] Create API route: `GET /api/reports/lookup/students?search=X`
    - Return students matching search query (typeahead)
    - Format: `{ id, name, college_name }`
    - Limit to 50 results
  - [ ] Use TanStack Query in ReportBuilder to fetch lookup data
  - [ ] Test lookup APIs return only current agency's data (RLS)

- [ ] **Task 8: Testing** (AC: All)
  - [ ] Write API route unit tests (Vitest):
    - Test payment plans report query with various filters
    - Test date range filtering
    - Test college/branch/student filtering
    - Test status filtering
    - Test contract expiration filtering
    - Test computed fields (total_paid, earned_commission, days_until_contract_expiration)
    - Test summary totals calculation
    - Test pagination (page, page_size, total_count)
    - Test sorting (column, direction)
    - Test RLS enforcement (only agency's data)
    - Test column selection (only requested columns returned)
  - [ ] Write component tests (React Testing Library):
    - Test ReportBuilder renders with all filter inputs
    - Test column selection checkboxes
    - Test preset filter buttons
    - Test form validation (at least one column required)
    - Test "Generate Report" submits form
    - Test ReportResultsTable renders with mock data
    - Test table sorting
    - Test table pagination
    - Test contract expiration highlighting (yellow/orange/red)
    - Test summary totals row
    - Test empty state
    - Test loading state
  - [ ] Write integration test (Playwright):
    - E2E flow: Login → Navigate to /reports
    - E2E flow: Set filters → Select columns → Generate Report → Preview results
    - E2E flow: Use preset filter ("Expiring in 30 days") → Generate → Verify results
    - E2E flow: Sort table column → Verify results reorder
    - E2E flow: Change page size → Verify pagination updates
    - E2E flow: Reset filters → Verify form clears and results hide
    - E2E flow: Filter by expiring contracts → Verify highlighted rows

- [ ] **Task 9: Add Responsive Design and Accessibility** (AC: #3)
  - [ ] Make ReportBuilder responsive:
    - Desktop: Two-column filter layout
    - Tablet: Single column, stacked sections
    - Mobile: Accordion sections (collapsible filters)
  - [ ] Make ReportResultsTable responsive:
    - Desktop: Full table with all columns
    - Tablet: Hide optional columns, show via "..." menu
    - Mobile: Convert to card list with key fields
  - [ ] Add ARIA labels and keyboard navigation:
    - Filter inputs have clear labels
    - Table has aria-label, aria-sort attributes
    - Pagination is keyboard accessible
  - [ ] Test with screen reader
  - [ ] Test on mobile device (iOS/Android)

## Dev Notes

### Architecture Context

**Reports Zone:**
- New microfrontend zone at `apps/reports/`
- Base path: `/reports`
- Handles all reporting and export functionality (Epic 7)
- Uses shared packages: `packages/ui`, `packages/database`, `packages/utils`

**API Routes:**
- `POST /api/reports/payment-plans` - Generate payment plans report with filters
- `GET /api/reports/lookup/colleges` - Fetch colleges for filter dropdown
- `GET /api/reports/lookup/branches` - Fetch branches for filter dropdown
- `GET /api/reports/lookup/students` - Fetch students for typeahead search

**Database Query:**
- Base table: `payment_plans`
- Joins: `enrollments`, `students`, `colleges`, `branches`, `installments`
- RLS policy: Auto-filters by `agency_id`
- Computed fields: `total_paid`, `earned_commission`, `days_until_contract_expiration`, `contract_status`

**Key Components:**
- `ReportBuilder.tsx` - Filter form with column selection
- `ReportResultsTable.tsx` - TanStack Table with pagination, sorting, highlighting
- `PaymentPlansReportPage.tsx` - Main page integrating builder + results

### Learnings from Previous Story

**From Story 6.5: Overdue Payments Summary Widget (Status: drafted)**

Story 6.5 established dashboard widget patterns with TanStack Query, RLS filtering, and urgency-based styling.

**Key Points for Implementation:**
- TanStack Query patterns for data fetching with caching
- RLS policies auto-filter by `agency_id` - no manual filtering needed
- Currency formatting utility: `formatCurrency()` in `packages/utils/src/formatters.ts`
- Date formatting: Use `date-fns` for relative dates and formatted dates
- Shadcn UI components for consistent styling
- Loading/error/empty states are essential for good UX

**Patterns to Reuse:**
- **API Route Structure**: Similar query pattern (joins, filters, RLS)
- **Component Structure**: Loading/error/empty states with consistent styling
- **TanStack Query**: Similar caching strategy but with `useMutation` for POST request
- **Date Calculations**: Use SQL for computed date fields (days_until_contract_expiration)
- **Responsive Layout**: Table on desktop, cards on mobile

**New Patterns Introduced in This Story:**
- **Report Builder UI**: Multi-section filter form with column selection
- **Dynamic Query Building**: Filters and columns are configurable by user
- **Pagination**: Server-side pagination with page size selector
- **Sorting**: TanStack Table with server-side or client-side sorting
- **Contract Expiration Tracking**: New business feature with date-based filtering and highlighting
- **Preset Filters**: Quick filter buttons for common report scenarios
- **Multi-Zone Architecture**: First implementation of Reports zone

**Differences from Story 6.5:**
- This is a full page (Reports zone) vs a dashboard widget
- User-configurable filters vs fixed query
- Server-side pagination vs all results loaded
- Table with sorting vs simple list
- POST API (with request body) vs GET API
- Highlighting by business logic (contract expiration) vs urgency (days overdue)

### Project Structure Notes

**Reports Zone Structure:**
```
apps/reports/
├── app/
│   ├── page.tsx                              # Reports landing page
│   ├── layout.tsx                            # Reports navigation
│   ├── payment-plans/
│   │   └── page.tsx                         # PaymentPlansReportPage
│   ├── api/
│   │   └── reports/
│   │       ├── payment-plans/
│   │       │   └── route.ts                 # Payment plans report API
│   │       └── lookup/
│   │           ├── colleges/
│   │           │   └── route.ts             # Colleges lookup API
│   │           ├── branches/
│   │           │   └── route.ts             # Branches lookup API
│   │           └── students/
│   │               └── route.ts             # Students lookup API
│   └── components/
│       ├── ReportBuilder.tsx                 # Filter form component
│       ├── ReportResultsTable.tsx            # Results table component
│       └── ContractExpirationBadge.tsx       # Expiration status badge
├── next.config.js                            # basePath: /reports
└── package.json
```

**Shell Zone Updates:**
```
apps/shell/
├── middleware.ts                             # Add /reports/* routing
└── next.config.js                           # Add /reports zone rewrite
```

**Shared Packages:**
- `packages/ui` - Shadcn UI components (Form, Table, Select, DatePicker)
- `packages/utils` - `formatCurrency()`, `formatDate()`, `commission-calculator.ts`
- `packages/database` - Supabase client with RLS
- `packages/validations` - Zod schemas for API validation

### Database Schema Notes

**Contract Expiration Tracking:**

The `enrollments` table should include a `contract_expiration_date` field:

```sql
-- If not already present, add to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS contract_expiration_date DATE;

-- Index for efficient filtering by expiration date
CREATE INDEX IF NOT EXISTS idx_enrollments_contract_expiration
ON enrollments(contract_expiration_date)
WHERE contract_expiration_date IS NOT NULL;
```

**Payment Plans Query with Contract Expiration:**

```sql
SELECT
  payment_plans.id,
  payment_plans.total_amount AS plan_amount,
  payment_plans.status,
  payment_plans.created_at,
  students.id AS student_id,
  students.name AS student_name,
  colleges.id AS college_id,
  colleges.name AS college_name,
  branches.id AS branch_id,
  branches.name AS branch_name,
  enrollments.contract_expiration_date,
  (enrollments.contract_expiration_date - CURRENT_DATE) AS days_until_contract_expiration,
  CASE
    WHEN enrollments.contract_expiration_date < CURRENT_DATE THEN 'expired'
    WHEN enrollments.contract_expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END AS contract_status,
  (
    SELECT SUM(installments.amount)
    FROM installments
    WHERE installments.payment_plan_id = payment_plans.id
      AND installments.status = 'paid'
  ) AS total_paid,
  (
    payment_plans.total_amount - COALESCE(
      (SELECT SUM(installments.amount) FROM installments WHERE installments.payment_plan_id = payment_plans.id AND installments.status = 'paid'),
      0
    )
  ) AS total_remaining
FROM payment_plans
INNER JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
INNER JOIN students ON enrollments.student_id = students.id
INNER JOIN colleges ON enrollments.college_id = colleges.id
LEFT JOIN branches ON enrollments.branch_id = branches.id
WHERE payment_plans.agency_id = auth.uid()  -- RLS auto-applied
  -- Dynamic filters applied here based on request
ORDER BY payment_plans.created_at DESC;
```

**Commission Calculation:**
- Use existing `commission-calculator.ts` utility from `packages/utils`
- Commission rules defined in payment plan (percentage or fixed amount)
- Calculate: `earned_commission = total_paid * commission_percentage` or `fixed_commission_amount`

### TypeScript Type Definitions

**Request/Response Types:**

```typescript
// apps/reports/app/api/reports/payment-plans/types.ts

export interface PaymentPlansReportFilters {
  date_from?: string
  date_to?: string
  college_ids?: string[]
  branch_ids?: string[]
  student_ids?: string[]
  status?: ('pending' | 'paid' | 'overdue' | 'cancelled')[]
  contract_expiration_from?: string
  contract_expiration_to?: string
}

export interface PaymentPlansReportRequest {
  filters: PaymentPlansReportFilters
  columns: string[]
  pagination: {
    page: number
    page_size: number
  }
  sort?: {
    column: string
    direction: 'asc' | 'desc'
  }
}

export interface PaymentPlanReportRow {
  id: string
  student_id: string
  student_name: string
  college_id: string
  college_name: string
  branch_id?: string
  branch_name?: string
  plan_amount: number
  total_paid: number
  total_remaining: number
  earned_commission: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  created_at: string
  payment_frequency?: string
  installments_count?: number
  contract_expiration_date?: string
  days_until_contract_expiration?: number
  contract_status?: 'active' | 'expiring_soon' | 'expired'
}

export interface PaymentPlansReportResponse {
  data: PaymentPlanReportRow[]
  pagination: {
    page: number
    page_size: number
    total_count: number
    total_pages: number
  }
  summary: {
    total_plan_amount: number
    total_paid_amount: number
    total_commission: number
  }
}
```

**Form Schema (Zod):**

```typescript
// apps/reports/app/validations/report-builder.schema.ts

import { z } from 'zod'

export const reportBuilderSchema = z.object({
  filters: z.object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    college_ids: z.array(z.string()).optional(),
    branch_ids: z.array(z.string()).optional(),
    student_ids: z.array(z.string()).optional(),
    status: z.array(z.enum(['pending', 'paid', 'overdue', 'cancelled'])).optional(),
    contract_expiration_from: z.string().optional(),
    contract_expiration_to: z.string().optional(),
  }),
  columns: z.array(z.string()).min(1, 'Select at least one column'),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
  }),
  sort: z.object({
    column: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
}).refine((data) => {
  // Validate date ranges
  if (data.filters.date_from && data.filters.date_to) {
    return new Date(data.filters.date_from) <= new Date(data.filters.date_to)
  }
  return true
}, { message: 'Start date must be before end date' })
```

### ReportBuilder Component Structure

**Component Architecture:**

```typescript
// apps/reports/app/components/ReportBuilder.tsx

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reportBuilderSchema } from '../validations/report-builder.schema'

export function ReportBuilder({ onGenerate }: { onGenerate: (data: ReportBuilderFormData) => void }) {
  const form = useForm({
    resolver: zodResolver(reportBuilderSchema),
    defaultValues: {
      filters: {},
      columns: ['student_name', 'college_name', 'plan_amount', 'total_paid', 'status', 'contract_expiration_date'],
      pagination: { page: 1, page_size: 25 },
    },
  })

  const handlePresetFilter = (preset: 'expiring_30' | 'expiring_60' | 'expiring_90' | 'expired') => {
    const today = new Date()
    const filters = { ...form.getValues('filters') }

    switch (preset) {
      case 'expiring_30':
        filters.contract_expiration_from = formatISO(today)
        filters.contract_expiration_to = formatISO(addDays(today, 30))
        break
      case 'expiring_60':
        filters.contract_expiration_from = formatISO(today)
        filters.contract_expiration_to = formatISO(addDays(today, 60))
        break
      case 'expiring_90':
        filters.contract_expiration_from = formatISO(today)
        filters.contract_expiration_to = formatISO(addDays(today, 90))
        break
      case 'expired':
        filters.contract_expiration_to = formatISO(subDays(today, 1))
        break
    }

    form.setValue('filters', filters)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onGenerate)}>
        {/* Filter Section */}
        <section>
          <h3>Filters</h3>
          <div className="grid grid-cols-2 gap-4">
            <DateRangePicker name="filters.date_from" label="Date From" />
            <DateRangePicker name="filters.date_to" label="Date To" />
            <MultiSelect name="filters.college_ids" label="Colleges" options={colleges} />
            <MultiSelect name="filters.branch_ids" label="Branches" options={branches} />
            <Combobox name="filters.student_ids" label="Students" options={students} />
            <MultiSelect name="filters.status" label="Status" options={statusOptions} />
          </div>

          {/* Contract Expiration Filters */}
          <div className="mt-4">
            <h4>Contract Expiration</h4>
            <div className="flex gap-2 mb-4">
              <Button type="button" variant="outline" onClick={() => handlePresetFilter('expiring_30')}>
                Expiring in 30 days
              </Button>
              <Button type="button" variant="outline" onClick={() => handlePresetFilter('expiring_60')}>
                Expiring in 60 days
              </Button>
              <Button type="button" variant="outline" onClick={() => handlePresetFilter('expiring_90')}>
                Expiring in 90 days
              </Button>
              <Button type="button" variant="outline" onClick={() => handlePresetFilter('expired')}>
                Already expired
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker name="filters.contract_expiration_from" label="Expiration From" />
              <DatePicker name="filters.contract_expiration_to" label="Expiration To" />
            </div>
          </div>
        </section>

        {/* Column Selection Section */}
        <section className="mt-6">
          <h3>Select Columns</h3>
          <div className="grid grid-cols-3 gap-2">
            {availableColumns.map((column) => (
              <Checkbox
                key={column.value}
                name={`columns.${column.value}`}
                label={column.label}
              />
            ))}
          </div>
        </section>

        {/* Actions Section */}
        <div className="mt-6 flex gap-2">
          <Button type="submit">Generate Report</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset Filters
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

### ReportResultsTable Component Structure

**Component Architecture:**

```typescript
// apps/reports/app/components/ReportResultsTable.tsx

import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'

export function ReportResultsTable({ data, pagination, summary, onPageChange, onSort }: ReportResultsTableProps) {
  const columns = useMemo(() => [
    { accessorKey: 'student_name', header: 'Student Name' },
    { accessorKey: 'college_name', header: 'College' },
    { accessorKey: 'branch_name', header: 'Branch' },
    { accessorKey: 'plan_amount', header: 'Plan Amount', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: 'total_paid', header: 'Total Paid', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: 'earned_commission', header: 'Commission', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
    {
      accessorKey: 'contract_expiration_date',
      header: 'Contract Expiration',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{format(new Date(row.original.contract_expiration_date), 'MMM dd, yyyy')}</span>
          {row.original.days_until_contract_expiration !== undefined && (
            <ContractExpirationBadge days={row.original.days_until_contract_expiration} />
          )}
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination.total_pages,
  })

  const getRowClassName = (row: PaymentPlanReportRow) => {
    if (row.contract_status === 'expired') return 'bg-red-100 border-red-300'
    if (row.days_until_contract_expiration && row.days_until_contract_expiration < 7) return 'bg-orange-100 border-orange-300'
    if (row.days_until_contract_expiration && row.days_until_contract_expiration < 30) return 'bg-yellow-100 border-yellow-300'
    return ''
  }

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                  {header.column.columnDef.header}
                  {header.column.getIsSorted() && (
                    <span>{header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={getRowClassName(row.original)}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-100">
            <td colSpan={3}>Totals</td>
            <td>{formatCurrency(summary.total_plan_amount)}</td>
            <td>{formatCurrency(summary.total_paid_amount)}</td>
            <td>{formatCurrency(summary.total_commission)}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div>
          Showing {(pagination.page - 1) * pagination.page_size + 1}-{Math.min(pagination.page * pagination.page_size, pagination.total_count)} of {pagination.total_count} results
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.total_pages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**ContractExpirationBadge Component:**

```typescript
// apps/reports/app/components/ContractExpirationBadge.tsx

export function ContractExpirationBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <Badge variant="destructive">
        Expired {Math.abs(days)} days ago
      </Badge>
    )
  }

  if (days < 7) {
    return (
      <Badge variant="destructive" className="bg-orange-600">
        {days} days left
      </Badge>
    )
  }

  if (days < 30) {
    return (
      <Badge variant="warning" className="bg-yellow-600">
        {days} days left
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      {days} days left
    </Badge>
  )
}
```

### TanStack Query Setup

**Query Hook:**

```typescript
// apps/reports/app/hooks/usePaymentPlansReport.ts

export function usePaymentPlansReport() {
  return useMutation({
    mutationFn: async (request: PaymentPlansReportRequest) => {
      const res = await fetch('/api/reports/payment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!res.ok) throw new Error('Failed to generate report')
      return res.json() as Promise<PaymentPlansReportResponse>
    },
  })
}
```

**Lookup Queries:**

```typescript
// apps/reports/app/hooks/useReportLookups.ts

export function useColleges() {
  return useQuery({
    queryKey: ['report-lookup-colleges'],
    queryFn: async () => {
      const res = await fetch('/api/reports/lookup/colleges')
      if (!res.ok) throw new Error('Failed to fetch colleges')
      return res.json() as Promise<{ id: string; name: string }[]>
    },
    staleTime: 600000, // 10 minutes (colleges don't change often)
  })
}

export function useBranches(collegeIds?: string[]) {
  return useQuery({
    queryKey: ['report-lookup-branches', collegeIds],
    queryFn: async () => {
      const params = new URLSearchParams()
      collegeIds?.forEach(id => params.append('college_id', id))
      const res = await fetch(`/api/reports/lookup/branches?${params}`)
      if (!res.ok) throw new Error('Failed to fetch branches')
      return res.json() as Promise<{ id: string; name: string; college_id: string }[]>
    },
    enabled: Boolean(collegeIds?.length),
    staleTime: 600000, // 10 minutes
  })
}

export function useStudents(search: string) {
  return useQuery({
    queryKey: ['report-lookup-students', search],
    queryFn: async () => {
      const res = await fetch(`/api/reports/lookup/students?search=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error('Failed to fetch students')
      return res.json() as Promise<{ id: string; name: string; college_name: string }[]>
    },
    enabled: search.length >= 2, // Only search when user typed at least 2 characters
    staleTime: 60000, // 1 minute (students can change)
  })
}
```

### Performance Optimization

**Caching Strategy:**
- API route: Cache report results for 1 minute (short cache for dynamic data)
- TanStack Query: Use `useMutation` (no automatic caching) - user must regenerate report
- Lookup queries: 10-minute cache for colleges/branches, 1-minute for students

**Database Indexes:**
- Existing indexes on `payment_plans(agency_id, status, created_at)` optimize base query
- New index on `enrollments(contract_expiration_date)` for contract filtering
- Consider composite index: `(agency_id, contract_expiration_date)` if performance issues

**Query Optimization:**
- Use server-side pagination (LIMIT/OFFSET) to reduce data transfer
- Filter early: Apply all filters in WHERE clause before joins
- Use LEFT JOIN for optional relationships (branches)
- Calculate summary totals in separate query or use window functions
- Limit column selection to only requested columns

**Client-Side Optimization:**
- Virtual scrolling for large result sets (TanStack Virtual)
- Debounce student search input (500ms delay)
- Lazy load branch options only when college selected
- Memoize table columns and data transformations

### Testing Standards

**API Route Tests (Vitest):**
- Mock Supabase client queries
- Test payment plans report query:
  - Verify query returns payment plans with all joined data
  - Verify date range filtering
  - Verify college/branch/student filtering
  - Verify status filtering
  - Verify contract expiration filtering
  - Verify RLS filtering by agency_id
  - Verify computed fields (total_paid, earned_commission, days_until_contract_expiration)
  - Verify summary totals calculation
  - Verify pagination (page, page_size, total_count, total_pages)
  - Verify sorting (column, direction)
  - Verify column selection (only requested columns returned)
- Test lookup APIs:
  - Verify colleges lookup returns only agency's colleges
  - Verify branches lookup filters by college_id
  - Verify students search returns matching results
- Test validation:
  - Reject request with no columns selected
  - Reject request with invalid date range (from > to)
  - Reject request with invalid pagination values

**Component Tests (React Testing Library):**
- Test ReportBuilder renders with all filter inputs
- Test column selection checkboxes (at least one required)
- Test preset filter buttons populate filters correctly
- Test form validation messages
- Test "Generate Report" button submits form
- Test "Reset Filters" button clears form
- Test ReportResultsTable renders with mock data
- Test table columns display correct values
- Test currency formatting
- Test date formatting
- Test contract expiration badge colors (active/warning/critical/expired)
- Test row highlighting by contract status
- Test table sorting (click column header)
- Test pagination controls (previous/next, page size selector)
- Test summary totals row
- Test empty state when no results
- Test loading state during API call

**Integration Tests (Playwright):**
- E2E flow: Login → Navigate to /reports → Payment Plans Report
- E2E flow: Set filters (date range, college) → Select columns → Generate Report → Verify results displayed
- E2E flow: Use preset filter ("Expiring in 30 days") → Generate → Verify highlighted rows
- E2E flow: Sort table column → Verify results reorder
- E2E flow: Change page size → Verify pagination updates
- E2E flow: Navigate to page 2 → Verify different results
- E2E flow: Reset filters → Verify form clears and results hide
- E2E flow: Filter by expired contracts → Verify red highlighted rows
- Test responsive layout: Desktop (full table) → Mobile (card list)

### Security Considerations

**Row-Level Security:**
- All payment plans queries MUST respect RLS policies (agency_id filtering automatic)
- Use server-side Supabase client (not anon key) in API routes
- JWT auth middleware protects all /reports routes
- Lookup APIs also enforce RLS (colleges, branches, students)

**Data Privacy:**
- Report data only shows current user's agency
- No cross-agency data leakage possible (enforced by RLS)
- Student names and financial data only visible to users in same agency

**Input Validation:**
- Validate all filter inputs (Zod schema)
- Sanitize user input for SQL injection prevention (use parameterized queries)
- Validate column selection (prevent SQL injection via column names)
- Rate limit report generation API to prevent abuse

### User Experience Enhancements

**Contract Expiration Visual Indicators:**
- **Expired contracts**: Red row background, "Expired X days ago" badge
- **Expiring within 7 days**: Orange row background, "X days left" badge (critical)
- **Expiring within 30 days**: Yellow row background, "X days left" badge (warning)
- **Active contracts**: No highlighting, "X days left" badge (neutral)

**Filter Presets:**
- Quick buttons: "Expiring in 30 days", "Expiring in 60 days", "Expiring in 90 days", "Already expired"
- "Contract Expiration Report" preset: Pre-fills commonly used filters and columns
- Active preset visually highlighted (blue border or background)

**Loading States:**
- Skeleton loader while generating report (matches table layout)
- Progress indicator: "Generating report..." with spinner
- Smooth transition from skeleton to actual results

**Empty States:**
- No results: "No payment plans match the selected filters. Try adjusting your filters."
- No data: "No payment plans exist yet. Create your first payment plan to get started."

**Error States:**
- Clear error message: "Unable to generate report. Please try again."
- Retry button
- Support contact link
- Log error for debugging

**Summary Totals:**
- Sticky footer row that remains visible during scrolling
- Bold styling to stand out
- Formatted currency values
- Totals update when filters change

**Responsive Design:**
- Desktop: Full table with all columns, multi-column filter form
- Tablet: Scrollable table, collapsible filter sections
- Mobile: Card list instead of table, accordion filter sections

**Future Enhancements (Document for Later Stories):**
- **Saved Reports**: Save filter configurations for reuse
- **Scheduled Reports**: Email report on schedule (daily, weekly, monthly)
- **Export Options**: CSV (Story 7.2), PDF (Story 7.3)
- **Report Sharing**: Share report URL with team members
- **Advanced Filters**: OR/AND logic, nested conditions
- **Column Customization**: Reorder columns, resize columns, hide columns
- **Grouping**: Group by college, branch, status
- **Subtotals**: Show subtotals for each group
- **Charts**: Visualize report data (bar chart, pie chart)

### References

- [Source: docs/epics.md#Story 7.1] - Story acceptance criteria and technical notes
- [Source: docs/architecture.md#Reports Zone] - Reports microfrontend architecture
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns
- [Source: docs/architecture.md#State Management] - TanStack Query configuration
- [Source: docs/architecture.md#Monorepo Architecture] - Turborepo multi-zone setup
- [Source: .bmad-ephemeral/stories/6-5-overdue-payments-summary-widget.md#Learnings from Previous Story] - Dashboard patterns, TanStack Query, RLS filtering, currency formatting

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/7-1-payment-plans-report-generator-with-contract-expiration-tracking.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
