# Story 7.5: Student Payment History Report

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to view and export complete payment history for individual students**,
so that **I can answer student inquiries and maintain records for dispute resolution**.

## Acceptance Criteria

1. **Given** I am viewing a student's detail page
   **When** I request a payment history report
   **Then** I see a chronological list of all payment plans and installments for that student

2. **And** each entry shows: date, payment plan, college/branch, amount, payment status, paid date

3. **And** the report shows total paid to date and total outstanding

4. **And** the report is exportable to PDF for sharing with the student

5. **And** the PDF is formatted as a clear payment statement

6. **And** I can filter by date range (all time, this year, custom)

## Tasks / Subtasks

- [ ] **Task 1: Add Payment History Section to Student Detail Page** (AC: #1)
  - [ ] Add "Payment History" tab/section to `/entities/students/[id]/page.tsx`
  - [ ] Create PaymentHistorySection component:
    - Date range filter (All Time, This Year, Custom)
    - "Generate Report" button
    - "Export PDF" button
    - Loading state while fetching data
  - [ ] Display message when no payment plans exist: "No payment history available"
  - [ ] Test: Navigate to student detail → See Payment History section

- [ ] **Task 2: Implement Payment History API Route** (AC: #1-3, 6)
  - [ ] Create API route: `GET /api/students/[id]/payment-history`
  - [ ] Accept query params:
    - `date_from` (optional, defaults to beginning of time)
    - `date_to` (optional, defaults to today)
  - [ ] Query payment history:
    ```typescript
    SELECT
      i.id AS installment_id,
      i.installment_number,
      i.amount,
      i.due_date,
      i.paid_at,
      i.paid_amount,
      i.status,
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
    WHERE e.student_id = ?
      AND pp.agency_id = ?
      AND i.due_date >= ?  -- date_from
      AND i.due_date <= ?  -- date_to
    ORDER BY i.due_date DESC
    ```
  - [ ] Calculate summary totals:
    - `total_paid = SUM(installments.paid_amount WHERE paid_at IS NOT NULL)`
    - `total_outstanding = SUM(installments.amount WHERE paid_at IS NULL)`
  - [ ] Return JSON with:
    - `payment_plans[]` (grouped by payment plan)
    - `installments[]` (chronological list of all installments)
    - `summary { total_paid, total_outstanding }`
  - [ ] Apply RLS filtering by agency_id
  - [ ] Test: GET with student_id → Returns payment history with summary

- [ ] **Task 3: Display Payment History Timeline** (AC: #2-3)
  - [ ] Create PaymentHistoryTimeline component
  - [ ] Display installments in chronological order (newest first)
  - [ ] For each installment, show:
    - Due date (formatted: "Jan 15, 2025")
    - Payment plan reference (e.g., "Payment Plan #PP-123")
    - College/Branch (e.g., "Imagine - Brisbane")
    - Amount (formatted currency)
    - Payment status badge:
      - "Paid" (green) with paid date
      - "Pending" (blue)
      - "Overdue" (red)
      - "Cancelled" (gray)
    - Paid date (if applicable): "Paid on Jan 10, 2025"
  - [ ] Group by payment plan with collapsible sections:
    - Payment plan header showing: College, Program, Total Amount, Start Date
    - Expand/collapse to show all installments for that plan
  - [ ] Add summary card at top:
    - Total Paid (green text, large font)
    - Total Outstanding (red text if > 0)
    - Percentage paid: "(75% complete)"
  - [ ] Format currency amounts with agency currency symbol
  - [ ] Show relative timestamps for recent payments: "Paid 3 days ago"
  - [ ] Test: View payment history → See chronological timeline grouped by plan

- [ ] **Task 4: Create Student Payment Statement PDF Template** (AC: #4-5)
  - [ ] Create `StudentPaymentStatementPDF.tsx` using `@react-pdf/renderer`
  - [ ] Include header section:
    - Agency logo and name
    - Document title: "Payment Statement"
    - Student name and passport number
    - Statement period: "From [date] to [date]"
    - Generation date: "Generated: [date]"
  - [ ] Create payment plans table:
    - Columns: Date, Description, College/Branch, Amount, Status, Paid Date
    - Group by payment plan with plan header showing total
    - Use clear typography (sans-serif, readable font size)
  - [ ] Add summary section at end:
    - Total Amount Due: $XX,XXX.XX
    - Total Paid: $XX,XXX.XX (green)
    - Outstanding Balance: $XX,XXX.XX (red if > 0)
    - Percentage Paid: XX%
  - [ ] Format as professional statement:
    - Clean layout with proper spacing
    - Consistent alignment
    - Clear visual hierarchy
    - Page breaks for long histories
    - Footer with page numbers and agency contact info
  - [ ] Add footer with disclaimer:
    - "This statement reflects payments recorded as of [date]"
    - "For inquiries, contact [agency email/phone]"
  - [ ] Test: Render PDF → Verify professional statement formatting

- [ ] **Task 5: Implement PDF Export API Route** (AC: #4-5)
  - [ ] Create API route: `GET /api/students/[id]/payment-history/export?format=pdf&date_from=&date_to=`
  - [ ] Fetch payment history data (reuse logic from Task 2)
  - [ ] Fetch student details:
    ```typescript
    SELECT id, full_name, passport_number, email
    FROM students
    WHERE id = ? AND agency_id = ?
    ```
  - [ ] Fetch agency info for PDF header:
    ```typescript
    SELECT name, logo_url, contact_email, contact_phone
    FROM agencies
    WHERE id = ?
    ```
  - [ ] Render StudentPaymentStatementPDF component with data
  - [ ] Generate PDF using `@react-pdf/renderer`
  - [ ] Set HTTP response headers:
    - `Content-Type: application/pdf`
    - `Content-Disposition: attachment; filename="payment_statement_[student_name]_[date].pdf"`
  - [ ] Set filename: `payment_statement_[student_name]_[YYYY-MM-DD].pdf`
  - [ ] Test: Click "Export PDF" → PDF downloads with statement

- [ ] **Task 6: Add Date Range Filtering** (AC: #6)
  - [ ] Add date range filter UI to Payment History section:
    - Preset buttons: "All Time", "This Year", "Custom"
    - Date picker inputs for custom range (date_from, date_to)
    - Default to "All Time"
  - [ ] When filter changes:
    - Update API call with date_from and date_to params
    - Reload payment history data
    - Update summary totals based on filtered data
  - [ ] Display active filter:
    - "Showing: All Time" or "Showing: Jan 1, 2025 - Dec 31, 2025"
  - [ ] Test: Select "This Year" → See only current year installments
  - [ ] Test: Select "Custom" and enter range → See filtered results

- [ ] **Task 7: Reuse Export Utilities from Story 7.2 and 7.4** (AC: #4-5)
  - [ ] Import PDF utilities from `packages/utils/src/pdf-generator.ts`:
    - `generatePDF()` - Server-side PDF generation
    - `fetchAgencyLogo()` - Load logo for PDF header
  - [ ] Import formatters from `packages/utils/src/formatters.ts`:
    - `formatCurrency()` - Currency formatting with symbol
    - `formatDate()` - Date formatting (ISO and display formats)
  - [ ] Reuse StudentPaymentStatementPDF component structure from CommissionReportPDF (Story 7.4):
    - Header layout with logo and info
    - Table styling and spacing
    - Summary section formatting
    - Footer with page numbers
  - [ ] Test: Export PDF → Verify consistent formatting with other reports

- [ ] **Task 8: Add Payment History Link from Student List** (AC: #1)
  - [ ] Add "View Payment History" action to student list table
  - [ ] Add quick-access link in student detail page header:
    - Icon button: "Payment History" with receipt/document icon
    - Click → Navigate to Payment History tab
  - [ ] Add breadcrumb navigation:
    - Students → [Student Name] → Payment History
  - [ ] Test: Click "View Payment History" → Navigate to payment history section

- [ ] **Task 9: Testing and Validation** (AC: All)
  - [ ] Write API route tests:
    - Test payment history query accuracy (correct installments)
    - Test date range filtering (inclusive bounds)
    - Test summary calculations (total_paid, total_outstanding)
    - Test RLS enforcement (agency_id isolation)
    - Test with student having no payment plans → Return empty array
    - Test with student having multiple payment plans → Group correctly
  - [ ] Write UI integration tests:
    - View payment history → See chronological timeline
    - Filter by date range → See filtered results
    - Expand payment plan → See all installments
    - Export PDF → Verify file format
  - [ ] Test edge cases:
    - Student with no payment plans → Display "No payment history"
    - Student with all paid installments → Total outstanding = $0
    - Student with cancelled payment plans → Show cancelled status
    - Large payment history (100+ installments) → Pagination or scrolling
  - [ ] Test PDF export:
    - Long payment history (multiple pages) → Verify page breaks
    - Student name with special characters → Verify filename sanitization
    - PDF opens correctly in Adobe Reader, Preview, browsers
  - [ ] Test date range filtering:
    - "All Time" → Show all installments
    - "This Year" → Show only current year installments
    - "Custom" range spanning years → Show correct installments
  - [ ] Test currency formatting:
    - Amounts display with correct currency symbol (AUD)
    - Negative amounts (credits/refunds) display with minus sign
  - [ ] Test statement accuracy:
    - Summary totals match individual installment sums
    - Paid dates match installment paid_at timestamps
    - Status badges match installment status values

## Dev Notes

### Architecture Context

**Entities Zone (Students):**
- Student detail page: `apps/entities/app/students/[id]/page.tsx`
- Payment History section: `apps/entities/app/students/[id]/components/PaymentHistorySection.tsx`
- API route: `apps/entities/app/api/students/[id]/payment-history/route.ts`
- Export API: `apps/entities/app/api/students/[id]/payment-history/export/route.ts`

**Shared Components:**
- PDF template: `apps/entities/app/components/StudentPaymentStatementPDF.tsx`
- Timeline component: `apps/entities/app/components/PaymentHistoryTimeline.tsx`

**Shared Utilities (from Stories 7.2 and 7.4):**
- PDF utilities: `packages/utils/src/pdf-generator.ts`
  - `generatePDF()` - Server-side PDF generation
  - `fetchAgencyLogo()` - Load logo for PDF header
- Formatters: `packages/utils/src/formatters.ts`
  - `formatCurrency()` - Currency formatting with symbol
  - `formatDate()` - Date formatting (ISO and display)

**Database Schema:**
- `students` table: id, full_name, passport_number, email, agency_id
- `enrollments` table: id, student_id, branch_id, program_name, agency_id
- `payment_plans` table: id, enrollment_id, total_amount, start_date, agency_id
- `installments` table: id, payment_plan_id, amount, due_date, paid_at, paid_amount, status

### Learnings from Previous Story (7.4)

**From Story 7.4: Commission Report by College (Status: drafted)**

Story 7.4 established commission reporting with PDF export and professional formatting. Story 7.5 extends these patterns to student-level payment statements.

**Key Reusable Patterns:**

- **PDF Export Architecture**: Use established `generatePDF()` function and header/footer layout
- **Professional PDF Templates**: Reuse header structure with agency logo, document title, date range
- **Report Filtering**: Date range filter UI with presets (All Time, This Year, Custom)
- **Summary Sections**: Follow same layout pattern (totals at bottom with visual emphasis)
- **RLS Enforcement**: Auto-applied via agency_id in all queries
- **Filename Generation**: Use timestamp format `payment_statement_[name]_YYYY-MM-DD.pdf`

**PDF Export Libraries:**
- `@react-pdf/renderer` for server-side PDF generation from React components
- Professional formatting with agency logo, headers, footers
- Page break handling for long reports
- Typography and spacing patterns established in CommissionReportPDF

**Query Patterns:**
- Join payment_plans → enrollments → branches → colleges for full context
- Filter by student_id and agency_id for RLS
- Order by due_date DESC for chronological display
- Calculate summary totals with SUM and FILTER clauses

**New Patterns Introduced:**

- **Student-Level Reporting**: Individual student payment history vs agency-wide reports
- **Payment Statement Format**: Different from commission reports - designed for student consumption
- **Timeline View**: Chronological display grouped by payment plan (vs tabular college grouping)
- **Status-Focused Display**: Emphasize payment status (Paid, Pending, Overdue) for clarity
- **Student-Friendly Formatting**: Clear, simple PDF layout for sharing with students

### Project Structure Notes

**Entities Zone File Organization:**
```
apps/entities/
├── app/
│   ├── students/
│   │   ├── page.tsx                        # Student list (Story 3.2)
│   │   ├── [id]/
│   │   │   ├── page.tsx                    # Student detail with payment history tab (Story 7.5)
│   │   │   └── components/
│   │   │       ├── PaymentHistorySection.tsx    # Payment history UI
│   │   │       └── PaymentHistoryTimeline.tsx   # Timeline display
│   │   └── new/
│   └── api/
│       └── students/
│           └── [id]/
│               └── payment-history/
│                   ├── route.ts            # Payment history API (Story 7.5)
│                   └── export/
│                       └── route.ts        # PDF export API (Story 7.5)
└── components/
    └── StudentPaymentStatementPDF.tsx      # PDF template for statements
```

**Shared Packages:**
```
packages/
├── utils/
│   ├── src/
│   │   ├── pdf-generator.ts                # PDF generation utilities (Story 7.4)
│   │   └── formatters.ts                   # Currency, date formatting
└── database/
    └── src/
        └── queries/
            └── student-payment-history.ts   # Payment history queries
```

### Payment Statement PDF Implementation

**Professional PDF Layout:**

```typescript
// apps/entities/app/components/StudentPaymentStatementPDF.tsx

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface PaymentStatementPDFProps {
  student: {
    full_name: string
    passport_number: string
    email: string
  }
  paymentHistory: {
    payment_plan_id: string
    college_name: string
    branch_name: string
    program_name: string
    installments: Installment[]
  }[]
  summary: {
    total_paid: number
    total_outstanding: number
    percentage_paid: number
  }
  filters: {
    date_from?: string
    date_to?: string
  }
  agency: {
    name: string
    logo_url?: string
    contact_email: string
    contact_phone: string
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '2pt solid #333',
    paddingBottom: 15,
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  studentInfo: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 20,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    width: 120,
  },
  value: {
    flex: 1,
  },
  planHeader: {
    backgroundColor: '#e6f3ff',
    padding: 10,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 4,
  },
  planTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  planSubtitle: {
    fontSize: 9,
    color: '#666',
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #eee',
    fontSize: 9,
  },
  column: {
    flex: 1,
  },
  statusPaid: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#3b82f6',
  },
  statusOverdue: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  summary: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f9f9f9',
    border: '2pt solid #333',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 11,
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  totalPaid: {
    color: '#16a34a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  totalOutstanding: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #ccc',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  pageNumber: {
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
})

export function StudentPaymentStatementPDF({
  student,
  paymentHistory,
  summary,
  filters,
  agency,
}: PaymentStatementPDFProps) {
  const period = filters.date_from && filters.date_to
    ? `${formatDate(filters.date_from)} to ${formatDate(filters.date_to)}`
    : 'All Time'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {agency.logo_url && <Image src={agency.logo_url} style={styles.logo} />}
            <Text style={styles.title}>Payment Statement</Text>
            <Text style={styles.subtitle}>{agency.name}</Text>
          </View>
          <View>
            <Text style={styles.subtitle}>Period: {period}</Text>
            <Text style={styles.subtitle}>Generated: {formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Student Name:</Text>
            <Text style={styles.value}>{student.full_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Passport Number:</Text>
            <Text style={styles.value}>{student.passport_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{student.email}</Text>
          </View>
        </View>

        {/* Payment Plans */}
        {paymentHistory.map((plan, idx) => (
          <View key={idx}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>
                {plan.college_name} - {plan.branch_name}
              </Text>
              <Text style={styles.planSubtitle}>
                {plan.program_name} • Plan ID: {plan.payment_plan_id}
              </Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.column, { flex: 1.5 }]}>Due Date</Text>
                <Text style={[styles.column, { flex: 1 }]}>Amount</Text>
                <Text style={[styles.column, { flex: 1.5 }]}>Status</Text>
                <Text style={[styles.column, { flex: 1.5 }]}>Paid Date</Text>
              </View>
              {plan.installments.map((inst, instIdx) => (
                <View key={instIdx} style={styles.tableRow}>
                  <Text style={[styles.column, { flex: 1.5 }]}>
                    {formatDate(inst.due_date)}
                  </Text>
                  <Text style={[styles.column, { flex: 1 }]}>
                    {formatCurrency(inst.amount)}
                  </Text>
                  <Text
                    style={[
                      styles.column,
                      { flex: 1.5 },
                      inst.status === 'paid' && styles.statusPaid,
                      inst.status === 'pending' && styles.statusPending,
                      inst.status === 'overdue' && styles.statusOverdue,
                    ]}
                  >
                    {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
                  </Text>
                  <Text style={[styles.column, { flex: 1.5 }]}>
                    {inst.paid_at ? formatDate(inst.paid_at) : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={styles.totalPaid}>{formatCurrency(summary.total_paid)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Outstanding Balance:</Text>
            <Text style={styles.totalOutstanding}>
              {formatCurrency(summary.total_outstanding)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completion:</Text>
            <Text>{summary.percentage_paid.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This statement reflects payments recorded as of {formatDate(new Date())}
          </Text>
          <Text style={styles.footerText}>
            For inquiries, contact {agency.contact_email} or {agency.contact_phone}
          </Text>
          <Text style={styles.pageNumber}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  )
}
```

### Payment History API Implementation

**Query Structure:**

```typescript
// apps/entities/app/api/students/[id]/payment-history/route.ts

import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const studentId = params.id
  const { searchParams } = new URL(request.url)
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')

  // Query payment history
  const { data, error } = await supabase.rpc('get_student_payment_history', {
    p_student_id: studentId,
    p_agency_id: user.user_metadata.agency_id,
    p_date_from: date_from || '1970-01-01',
    p_date_to: date_to || new Date().toISOString().split('T')[0],
  })

  if (error) {
    console.error('Payment history error:', error)
    return new Response('Internal server error', { status: 500 })
  }

  // Calculate summary
  const summary = {
    total_paid: data.reduce((sum, inst) => sum + (inst.paid_amount || 0), 0),
    total_outstanding: data.reduce(
      (sum, inst) => sum + (inst.paid_at ? 0 : inst.amount),
      0
    ),
  }

  summary.percentage_paid =
    summary.total_paid / (summary.total_paid + summary.total_outstanding) * 100

  return Response.json({
    data,
    summary,
  })
}
```

**PostgreSQL Function:**

```sql
-- supabase/migrations/XXX_create_student_payment_history_function.sql

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

### UI Components

**Payment History Timeline:**

```typescript
// apps/entities/app/students/[id]/components/PaymentHistoryTimeline.tsx

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formatters'

interface PaymentHistoryTimelineProps {
  paymentHistory: PaymentHistoryData[]
  summary: PaymentSummary
}

export function PaymentHistoryTimeline({
  paymentHistory,
  summary,
}: PaymentHistoryTimelineProps) {
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())

  const togglePlan = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  // Group installments by payment plan
  const groupedByPlan = paymentHistory.reduce((acc, inst) => {
    const key = inst.payment_plan_id
    if (!acc[key]) {
      acc[key] = {
        payment_plan_id: inst.payment_plan_id,
        college_name: inst.college_name,
        branch_name: inst.branch_name,
        branch_city: inst.branch_city,
        program_name: inst.program_name,
        plan_total_amount: inst.plan_total_amount,
        plan_start_date: inst.plan_start_date,
        installments: [],
      }
    }
    acc[key].installments.push(inst)
    return acc
  }, {} as Record<string, any>)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.total_paid)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.total_outstanding)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Completion</p>
          <p className="text-2xl font-bold">
            {summary.percentage_paid.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Payment Plans */}
      {Object.values(groupedByPlan).map((plan) => (
        <div key={plan.payment_plan_id} className="border rounded-lg overflow-hidden">
          {/* Plan Header */}
          <div
            className="bg-blue-50 p-4 cursor-pointer hover:bg-blue-100"
            onClick={() => togglePlan(plan.payment_plan_id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {expandedPlans.has(plan.payment_plan_id) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {plan.college_name} - {plan.branch_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {plan.program_name} • Started {formatDate(plan.plan_start_date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold">{formatCurrency(plan.plan_total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Installments */}
          {expandedPlans.has(plan.payment_plan_id) && (
            <div className="divide-y">
              {plan.installments.map((inst) => (
                <div key={inst.installment_id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Installment #{inst.installment_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        Due: {formatDate(inst.due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(inst.amount)}</p>
                      {inst.status === 'paid' && (
                        <p className="text-sm text-green-600">
                          Paid {formatRelativeTime(inst.paid_at)}
                        </p>
                      )}
                      {inst.status === 'pending' && (
                        <p className="text-sm text-blue-600">Pending</p>
                      )}
                      {inst.status === 'overdue' && (
                        <p className="text-sm text-red-600 font-semibold">Overdue</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Testing Standards

**Unit Tests:**
- Payment history query: Return correct installments for student
- Summary calculations: `total_paid`, `total_outstanding`, `percentage_paid`
- Date range filtering: Include only installments within range
- RLS enforcement: Verify agency_id isolation

**Integration Tests:**
- View payment history → See chronological timeline grouped by plan
- Filter by date range → See filtered results
- Expand payment plan → See all installments
- Export PDF → Verify statement formatting

**E2E Tests:**
- User flow: Students → [Student Detail] → Payment History → Export PDF
- Verify downloaded PDF matches expected format

### Performance Considerations

**Query Optimization:**
- Use database function (`get_student_payment_history`) to reduce round trips
- Index on `enrollments.student_id` for fast student lookup
- Index on `installments.due_date` for date range filtering

**Caching:**
- Cache payment history for 60 seconds (short duration)
- Invalidate when payments are recorded

**Large Histories:**
- Limit to 500 installments per query
- Implement pagination if needed

### Security Considerations

**Row-Level Security:**
- All queries filtered by agency_id
- RLS enforced on students, enrollments, payment_plans, installments tables
- Use server-side Supabase client with user context

**Input Validation:**
- Validate student_id is UUID
- Validate date range format (YYYY-MM-DD)
- Ensure student belongs to user's agency

**Data Privacy:**
- Only include payment plans for current agency
- Log all PDF exports to audit trail

### References

- [Source: docs/epics.md#Story 7.5] - Story acceptance criteria and technical notes
- [Source: .bmad-ephemeral/stories/7-4-commission-report-by-college.md] - PDF export patterns and utilities
- [Source: docs/architecture.md#Entities Zone] - Student management architecture
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns

## Change Log

- **2025-11-13**: Story created by SM agent via create-story workflow

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml](.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
