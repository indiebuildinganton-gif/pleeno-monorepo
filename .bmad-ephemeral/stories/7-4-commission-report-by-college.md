# Story 7.4: Commission Report by College

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **to generate commission reports grouped by college/branch with location details**,
so that **I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions**.

## Acceptance Criteria

1. **Given** I am viewing the reports page
   **When** I generate a commission report
   **Then** I see commission breakdown by college and branch for a selected time period

2. **And** each row shows: college, branch, city, total paid by students, commission rate, earned commission, outstanding commission

3. **And** the city field helps distinguish between multiple branches of the same school (e.g., multiple branches in one city or branches in different cities)

4. **And** the report includes date range filter

5. **And** the report is exportable to CSV and PDF

6. **And** the PDF version is formatted for submission to college partners (clean, professional)

7. **And** the report shows supporting details: list of students and payment plans contributing to commission

8. **And** the report can be grouped/filtered by city when needed

## Tasks / Subtasks

- [ ] **Task 1: Create Commissions Report Page** (AC: #1, 4)
  - [ ] Create `/reports/commissions` page with report builder UI
  - [ ] Add date range filter component:
    - Date from/to inputs with date pickers
    - Preset options: "Last 30 days", "Last 90 days", "This year", "Custom"
    - Default to "This year"
  - [ ] Add optional city filter dropdown (populated from branches table)
  - [ ] Add "Generate Report" button to trigger API call
  - [ ] Create placeholder table to display results
  - [ ] Add loading state while report generates
  - [ ] Test: Navigate to /reports/commissions → See report builder UI

- [ ] **Task 2: Implement Commission Report API Route** (AC: #1-4, 7)
  - [ ] Create API route: `POST /api/reports/commissions`
  - [ ] Accept filter params:
    - `date_from`, `date_to` (required date range)
    - `city` (optional city filter)
  - [ ] Query payment_plans with joins:
    ```typescript
    SELECT
      c.id AS college_id,
      c.name AS college_name,
      b.id AS branch_id,
      b.name AS branch_name,
      b.city,
      b.commission_rate_percent,
      COUNT(DISTINCT pp.id) AS total_payment_plans,
      COUNT(DISTINCT e.student_id) AS total_students,
      SUM(i.amount) FILTER (WHERE i.paid_at IS NOT NULL) AS total_paid,
      SUM(i.amount * (b.commission_rate_percent / 100)) FILTER (WHERE i.paid_at IS NOT NULL) AS earned_commission,
      SUM(i.amount * (b.commission_rate_percent / 100)) FILTER (WHERE i.paid_at IS NULL AND i.due_date < NOW()) AS outstanding_commission
    FROM colleges c
    INNER JOIN branches b ON c.id = b.college_id
    INNER JOIN enrollments e ON b.id = e.branch_id
    INNER JOIN payment_plans pp ON e.id = pp.enrollment_id
    INNER JOIN installments i ON pp.id = i.payment_plan_id
    WHERE pp.agency_id = ?
      AND i.due_date >= ?  -- date_from
      AND i.due_date <= ?  -- date_to
      AND (? IS NULL OR b.city = ?)  -- city filter (optional)
    GROUP BY c.id, c.name, b.id, b.name, b.city, b.commission_rate_percent
    ORDER BY c.name, b.name
    ```
  - [ ] Include drill-down data: student payment plans for each branch
  - [ ] Apply RLS filtering by agency_id
  - [ ] Return JSON with grouped commission data
  - [ ] Test: POST with date range → Returns commission breakdown by college/branch

- [ ] **Task 3: Display Commission Report Results** (AC: #2-3, 7)
  - [ ] Create CommissionReportTable component
  - [ ] Display columns:
    - College (grouped header spanning all branches)
    - Branch
    - City
    - Total Paid (sum of paid installments)
    - Commission Rate (%)
    - Earned Commission (calculated)
    - Outstanding Commission (overdue installments)
  - [ ] Group rows by college with visual separation
  - [ ] Add expandable drill-down per branch:
    - Shows list of students with payment plans
    - Displays: Student Name, Payment Plan ID, Total Amount, Paid Amount, Commission Earned
  - [ ] Add summary totals row at bottom:
    - Total Paid across all colleges
    - Total Earned Commission
    - Total Outstanding Commission
  - [ ] Format currency values with proper symbols and decimals
  - [ ] Highlight outstanding commissions in red/warning color
  - [ ] Test: Generate report → See grouped commission breakdown with drill-down

- [ ] **Task 4: Add CSV Export for Commissions Report** (AC: #5)
  - [ ] Create API route: `GET /api/reports/commissions/export?format=csv&date_from=&date_to=&city=`
  - [ ] Reuse filter logic from commission report API
  - [ ] Generate CSV with columns:
    - College, Branch, City, Total Paid, Commission Rate (%), Earned Commission, Outstanding Commission
  - [ ] Include drill-down section with student details:
    - Student Name, Payment Plan ID, Total Amount, Paid Amount, Commission Earned
  - [ ] Format CSV with UTF-8 BOM for Excel compatibility
  - [ ] Set filename: `commissions_report_YYYY-MM-DD.csv`
  - [ ] Reuse CSV export utilities from Story 7.2:
    - `formatCurrencyForCSV()` for amounts
    - `formatDateISO()` for dates
    - `addUTF8BOM()` for Excel compatibility
  - [ ] Add "Export CSV" button to report results page
  - [ ] Test: Click "Export CSV" → CSV downloads with commission data

- [ ] **Task 5: Create Professional PDF Template for Commissions** (AC: #6)
  - [ ] Create `CommissionReportPDF.tsx` using `@react-pdf/renderer`
  - [ ] Include header section:
    - Agency logo (from agencies.logo_url)
    - Report title: "Commission Report"
    - Date range: "Period: YYYY-MM-DD to YYYY-MM-DD"
    - Generation date: "Generated: YYYY-MM-DD"
  - [ ] Create grouped table layout:
    - College header row (bold, background color)
    - Branch rows nested under college
    - Columns: Branch, City, Total Paid, Rate (%), Earned Commission, Outstanding
  - [ ] Add drill-down section per branch:
    - "Payment Plans for [Branch Name]" subheading
    - Table: Student, Payment Plan ID, Total, Paid, Commission
  - [ ] Add summary section at end:
    - Total Paid: $XX,XXX.XX
    - Total Earned Commission: $XX,XXX.XX
    - Total Outstanding: $XX,XXX.XX
  - [ ] Format for professional submission:
    - Clean typography (sans-serif font)
    - Consistent spacing and alignment
    - Page breaks for long reports
    - Footer with page numbers
  - [ ] Test: Render PDF → Verify professional formatting

- [ ] **Task 6: Implement PDF Export API Route** (AC: #5-6)
  - [ ] Create API route: `GET /api/reports/commissions/export?format=pdf&date_from=&date_to=&city=`
  - [ ] Reuse filter logic from commission report API
  - [ ] Query commission data with same logic
  - [ ] Fetch agency logo from agencies table
  - [ ] Render CommissionReportPDF component with data
  - [ ] Generate PDF using `@react-pdf/renderer`
  - [ ] Set HTTP response headers:
    - `Content-Type: application/pdf`
    - `Content-Disposition: attachment; filename="commissions_report_YYYY-MM-DD.pdf"`
  - [ ] Set filename with timestamp: `commissions_report_${date}.pdf`
  - [ ] Add "Export PDF" button to report results page
  - [ ] Test: Click "Export PDF" → PDF downloads with professional formatting

- [ ] **Task 7: Add City Grouping/Filtering** (AC: #8)
  - [ ] Add optional "Group by City" toggle to report builder
  - [ ] When enabled, change query GROUP BY to include city as primary grouping:
    ```sql
    GROUP BY b.city, c.id, c.name, b.id, b.name, b.commission_rate_percent
    ORDER BY b.city, c.name, b.name
    ```
  - [ ] Update table display to group by city first, then college/branch
  - [ ] Add city filter dropdown to narrow results
  - [ ] Test: Toggle "Group by City" → Report reorganizes by city

- [ ] **Task 8: Testing and Validation** (AC: All)
  - [ ] Write API route tests:
    - Test commission calculation accuracy (paid vs outstanding)
    - Test date range filtering
    - Test city filtering
    - Test RLS enforcement (agency_id isolation)
    - Test drill-down data includes correct payment plans
  - [ ] Write UI integration tests:
    - Generate report with filters → Verify data accuracy
    - Expand branch drill-down → See student payment plans
    - Export CSV → Verify file format
    - Export PDF → Verify professional formatting
  - [ ] Test edge cases:
    - No commissions in date range → Empty report with headers
    - Multiple branches in same city → Proper grouping
    - Branch with 0% commission rate → Show zero earned commission
    - Outstanding commissions with negative amounts (credits) → Handle gracefully
  - [ ] Test Excel compatibility:
    - Open exported CSV in Excel → Verify UTF-8 BOM works
    - Verify currency formatting displays correctly
  - [ ] Test PDF for submission quality:
    - Print PDF → Verify readable on paper
    - Verify logo renders correctly
    - Verify page breaks work for long reports

## Dev Notes

### Architecture Context

**Reporting Zone:**
- Commission report page: `apps/reports/app/reports/commissions/page.tsx`
- API route: `apps/reports/app/api/reports/commissions/route.ts`
- Export API: `apps/reports/app/api/reports/commissions/export/route.ts`
- PDF template: `apps/reports/app/components/CommissionReportPDF.tsx`

**Shared Utilities (from Story 7.2):**
- CSV formatter: `packages/utils/src/csv-formatter.ts`
  - `formatCurrencyForCSV()` - Format amounts for CSV
  - `formatDateISO()` - ISO date formatting
  - `addUTF8BOM()` - Excel compatibility
- PDF utilities: `packages/utils/src/pdf-generator.ts`
  - `generatePDF()` - Server-side PDF generation
  - `fetchAgencyLogo()` - Load logo for PDF header

**Database Schema:**
- `colleges` table: id, name, agency_id
- `branches` table: id, college_id, name, city, commission_rate_percent, contract_expiration_date
- `enrollments` table: id, student_id, branch_id, agency_id
- `payment_plans` table: id, enrollment_id, agency_id, status
- `installments` table: id, payment_plan_id, amount, due_date, paid_at

### Learnings from Previous Story (7.2)

**From Story 7.2: CSV Export Functionality (Status: ready-for-dev)**

Story 7.2 established CSV export infrastructure with streaming support and Excel compatibility. This story (7.4) extends that pattern for commission reports.

**Key Reusable Patterns:**
- **CSV Export Utilities**: Use established `formatCurrencyForCSV()`, `addUTF8BOM()`, and streaming approach
- **Export API Route Pattern**: Follow same structure as `/api/reports/payment-plans/export`
- **Filter Application**: Reuse filter param parsing and validation
- **RLS Enforcement**: Auto-applied via agency_id in all queries
- **Filename Generation**: Use timestamp format `commissions_report_YYYY-MM-DD.csv`

**CSV Export Libraries:**
- `csv-stringify` for Node.js stream-based CSV generation
- UTF-8 BOM (`\uFEFF`) for Excel compatibility
- Proper escaping for special characters (commas, quotes, newlines)

**PDF Export Libraries (New in this Story):**
- `@react-pdf/renderer` for server-side PDF generation from React components
- Professional formatting with agency logo, headers, footers
- Page break handling for long reports

**New Patterns Introduced:**
- **Grouped Aggregation**: SUM and COUNT with FILTER clauses for paid vs outstanding
- **Commission Calculation**: `SUM(amount * (rate / 100))` for earned commission
- **Drill-Down Data**: Nested queries to show student payment plans per branch
- **Professional PDF Templates**: React components with layout, typography, branding
- **City-Based Grouping**: Optional GROUP BY city for location-based analysis

### Project Structure Notes

**Reports Zone File Organization:**
```
apps/reports/
├── app/
│   ├── reports/
│   │   ├── page.tsx                        # Reports hub (Story 7.1)
│   │   ├── commissions/
│   │   │   └── page.tsx                    # Commission report builder (Story 7.4)
│   │   └── payment-plans/
│   │       └── page.tsx                    # Payment plans report (Story 7.1)
│   └── api/
│       └── reports/
│           ├── payment-plans/
│           │   ├── route.ts                # Payment plans report API (Story 7.1)
│           │   └── export/
│           │       └── route.ts            # Payment plans export API (Story 7.2)
│           └── commissions/
│               ├── route.ts                # Commission report API (Story 7.4)
│               └── export/
│                   └── route.ts            # Commission export API (Story 7.4)
└── components/
    ├── CommissionReportTable.tsx           # Display commission data
    └── CommissionReportPDF.tsx             # PDF template for submissions
```

**Shared Packages:**
```
packages/
├── utils/
│   ├── src/
│   │   ├── csv-formatter.ts                # CSV export utilities (Story 7.2)
│   │   ├── pdf-generator.ts                # PDF generation utilities (Story 7.4)
│   │   └── formatters.ts                   # Currency, date formatting
└── database/
    └── src/
        └── queries/
            └── commission-reports.ts        # Commission report queries
```

### Commission Calculation Logic

**Key Formula:**
```typescript
// Earned Commission = Sum of (Paid Installments × Commission Rate)
earned_commission = SUM(
  installment.amount * (branch.commission_rate_percent / 100)
) WHERE installment.paid_at IS NOT NULL

// Outstanding Commission = Sum of (Overdue Unpaid Installments × Commission Rate)
outstanding_commission = SUM(
  installment.amount * (branch.commission_rate_percent / 100)
) WHERE installment.paid_at IS NULL AND installment.due_date < NOW()
```

**Aggregation Strategy:**
- Group by college → branch → city
- Aggregate installments (paid vs unpaid)
- Calculate commissions based on branch-level rates
- Support drill-down to student-level payment plans

**Edge Cases:**
- Branches with 0% commission rate → Show $0.00 earned commission
- Negative amounts (credits/refunds) → Include in calculations (can reduce commission)
- Multiple branches in same city → Group correctly by branch, filter by city optionally
- No data in date range → Return empty report with headers

### Commission Report API Implementation

**Query Structure:**

```typescript
// apps/reports/app/api/reports/commissions/route.ts

import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await request.json()
  const { date_from, date_to, city } = body

  // Validate date range
  if (!date_from || !date_to) {
    return new Response('Date range required', { status: 400 })
  }

  // Query commission data
  const { data, error } = await supabase.rpc('get_commission_report', {
    p_agency_id: user.user_metadata.agency_id,
    p_date_from: date_from,
    p_date_to: date_to,
    p_city: city || null,
  })

  if (error) {
    console.error('Commission report error:', error)
    return new Response('Internal server error', { status: 500 })
  }

  return Response.json({
    data,
    summary: {
      total_paid: data.reduce((sum, row) => sum + row.total_paid, 0),
      total_earned: data.reduce((sum, row) => sum + row.earned_commission, 0),
      total_outstanding: data.reduce((sum, row) => sum + row.outstanding_commission, 0),
    },
  })
}
```

**PostgreSQL Function (Database):**

```sql
-- supabase/migrations/XXX_create_commission_report_function.sql

CREATE OR REPLACE FUNCTION get_commission_report(
  p_agency_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_city TEXT DEFAULT NULL
)
RETURNS TABLE (
  college_id UUID,
  college_name TEXT,
  branch_id UUID,
  branch_name TEXT,
  city TEXT,
  commission_rate_percent NUMERIC,
  total_payment_plans BIGINT,
  total_students BIGINT,
  total_paid NUMERIC,
  earned_commission NUMERIC,
  outstanding_commission NUMERIC,
  payment_plans JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS college_id,
    c.name AS college_name,
    b.id AS branch_id,
    b.name AS branch_name,
    b.city,
    b.commission_rate_percent,
    COUNT(DISTINCT pp.id) AS total_payment_plans,
    COUNT(DISTINCT e.student_id) AS total_students,
    COALESCE(SUM(i.amount) FILTER (WHERE i.paid_at IS NOT NULL), 0) AS total_paid,
    COALESCE(SUM(i.amount * (b.commission_rate_percent / 100)) FILTER (WHERE i.paid_at IS NOT NULL), 0) AS earned_commission,
    COALESCE(SUM(i.amount * (b.commission_rate_percent / 100)) FILTER (WHERE i.paid_at IS NULL AND i.due_date < NOW()), 0) AS outstanding_commission,
    -- Drill-down: student payment plans
    jsonb_agg(
      jsonb_build_object(
        'student_id', s.id,
        'student_name', s.full_name,
        'payment_plan_id', pp.id,
        'total_amount', pp.total_amount,
        'paid_amount', COALESCE(SUM(i.amount) FILTER (WHERE i.paid_at IS NOT NULL), 0),
        'commission_earned', COALESCE(SUM(i.amount * (b.commission_rate_percent / 100)) FILTER (WHERE i.paid_at IS NOT NULL), 0)
      )
    ) AS payment_plans
  FROM colleges c
  INNER JOIN branches b ON c.id = b.college_id
  INNER JOIN enrollments e ON b.id = e.branch_id
  INNER JOIN payment_plans pp ON e.id = pp.enrollment_id
  INNER JOIN installments i ON pp.id = i.payment_plan_id
  INNER JOIN students s ON e.student_id = s.id
  WHERE c.agency_id = p_agency_id
    AND i.due_date >= p_date_from
    AND i.due_date <= p_date_to
    AND (p_city IS NULL OR b.city = p_city)
  GROUP BY c.id, c.name, b.id, b.name, b.city, b.commission_rate_percent
  ORDER BY c.name, b.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### PDF Template Implementation

**Professional PDF Layout:**

```typescript
// apps/reports/app/components/CommissionReportPDF.tsx

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface CommissionReportPDFProps {
  data: CommissionReportData[]
  summary: CommissionSummary
  filters: {
    date_from: string
    date_to: string
    city?: string
  }
  agencyLogo?: string
  agencyName: string
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '2pt solid #333',
    paddingBottom: 10,
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '1pt solid #333',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #ddd',
  },
  collegeHeader: {
    backgroundColor: '#e6f3ff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 10,
  },
  column: {
    flex: 1,
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    border: '1pt solid #333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
})

export function CommissionReportPDF({ data, summary, filters, agencyLogo, agencyName }: CommissionReportPDFProps) {
  // Group data by college
  const groupedByCollege = data.reduce((acc, row) => {
    const key = row.college_id
    if (!acc[key]) {
      acc[key] = {
        college_name: row.college_name,
        branches: [],
      }
    }
    acc[key].branches.push(row)
    return acc
  }, {} as Record<string, { college_name: string; branches: typeof data }>)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {agencyLogo && <Image src={agencyLogo} style={styles.logo} />}
            <Text style={styles.title}>Commission Report</Text>
            <Text style={styles.subtitle}>{agencyName}</Text>
          </View>
          <View>
            <Text style={styles.subtitle}>Period: {formatDate(filters.date_from)} to {formatDate(filters.date_to)}</Text>
            <Text style={styles.subtitle}>Generated: {formatDate(new Date())}</Text>
            {filters.city && <Text style={styles.subtitle}>City: {filters.city}</Text>}
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.column, { flex: 2 }]}>Branch</Text>
          <Text style={styles.column}>City</Text>
          <Text style={styles.column}>Total Paid</Text>
          <Text style={styles.column}>Rate (%)</Text>
          <Text style={styles.column}>Earned</Text>
          <Text style={styles.column}>Outstanding</Text>
        </View>

        {/* Grouped Data */}
        {Object.values(groupedByCollege).map((college, idx) => (
          <View key={idx}>
            <Text style={styles.collegeHeader}>{college.college_name}</Text>
            {college.branches.map((branch, branchIdx) => (
              <View key={branchIdx} style={styles.tableRow}>
                <Text style={[styles.column, { flex: 2 }]}>{branch.branch_name}</Text>
                <Text style={styles.column}>{branch.city}</Text>
                <Text style={styles.column}>{formatCurrency(branch.total_paid)}</Text>
                <Text style={styles.column}>{branch.commission_rate_percent}%</Text>
                <Text style={styles.column}>{formatCurrency(branch.earned_commission)}</Text>
                <Text style={styles.column}>{formatCurrency(branch.outstanding_commission)}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Total Paid:</Text>
            <Text>{formatCurrency(summary.total_paid)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Earned Commission:</Text>
            <Text>{formatCurrency(summary.total_earned)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Outstanding:</Text>
            <Text>{formatCurrency(summary.total_outstanding)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Page 1 of 1 • {agencyName} • Commission Report
        </Text>
      </Page>
    </Document>
  )
}
```

**PDF Generation in API Route:**

```typescript
// apps/reports/app/api/reports/commissions/export/route.ts

import { renderToBuffer } from '@react-pdf/renderer'
import { CommissionReportPDF } from '@/app/components/CommissionReportPDF'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') // 'csv' or 'pdf'
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')
  const city = searchParams.get('city')

  // Fetch commission data (reuse logic from POST route)
  const { data, summary } = await fetchCommissionData({ date_from, date_to, city })

  if (format === 'pdf') {
    // Fetch agency info for logo
    const { data: agency } = await supabase
      .from('agencies')
      .select('name, logo_url')
      .eq('id', user.user_metadata.agency_id)
      .single()

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      <CommissionReportPDF
        data={data}
        summary={summary}
        filters={{ date_from, date_to, city }}
        agencyLogo={agency.logo_url}
        agencyName={agency.name}
      />
    )

    const filename = `commissions_report_${date_from}_${date_to}.pdf`

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  // CSV export (reuse from Story 7.2)
  return exportAsCSV(data, summary)
}
```

### UI Components

**Commission Report Table:**

```typescript
// apps/reports/app/components/CommissionReportTable.tsx

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CommissionReportTableProps {
  data: CommissionReportData[]
  summary: CommissionSummary
}

export function CommissionReportTable({ data, summary }: CommissionReportTableProps) {
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())

  const toggleBranch = (branchId: string) => {
    const newExpanded = new Set(expandedBranches)
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId)
    } else {
      newExpanded.add(branchId)
    }
    setExpandedBranches(newExpanded)
  }

  // Group by college
  const grouped = data.reduce((acc, row) => {
    if (!acc[row.college_name]) {
      acc[row.college_name] = []
    }
    acc[row.college_name].push(row)
    return acc
  }, {} as Record<string, typeof data>)

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Branch</th>
            <th className="px-4 py-3 text-left">City</th>
            <th className="px-4 py-3 text-right">Total Paid</th>
            <th className="px-4 py-3 text-right">Rate (%)</th>
            <th className="px-4 py-3 text-right">Earned</th>
            <th className="px-4 py-3 text-right">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([college, branches]) => (
            <>
              <tr key={college} className="bg-blue-50 font-semibold">
                <td colSpan={6} className="px-4 py-2">{college}</td>
              </tr>
              {branches.map((branch) => (
                <>
                  <tr
                    key={branch.branch_id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleBranch(branch.branch_id)}
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      {expandedBranches.has(branch.branch_id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {branch.branch_name}
                    </td>
                    <td className="px-4 py-3">{branch.city}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(branch.total_paid)}</td>
                    <td className="px-4 py-3 text-right">{branch.commission_rate_percent}%</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatCurrency(branch.earned_commission)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(branch.outstanding_commission)}</td>
                  </tr>
                  {expandedBranches.has(branch.branch_id) && (
                    <tr>
                      <td colSpan={6} className="px-8 py-4 bg-gray-50">
                        <h4 className="font-semibold mb-2">Student Payment Plans</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Student</th>
                              <th className="text-left py-2">Plan ID</th>
                              <th className="text-right py-2">Total</th>
                              <th className="text-right py-2">Paid</th>
                              <th className="text-right py-2">Commission</th>
                            </tr>
                          </thead>
                          <tbody>
                            {branch.payment_plans.map((plan, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="py-2">{plan.student_name}</td>
                                <td className="py-2">{plan.payment_plan_id}</td>
                                <td className="py-2 text-right">{formatCurrency(plan.total_amount)}</td>
                                <td className="py-2 text-right">{formatCurrency(plan.paid_amount)}</td>
                                <td className="py-2 text-right">{formatCurrency(plan.commission_earned)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td colSpan={2} className="px-4 py-3">Totals</td>
            <td className="px-4 py-3 text-right">{formatCurrency(summary.total_paid)}</td>
            <td className="px-4 py-3"></td>
            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(summary.total_earned)}</td>
            <td className="px-4 py-3 text-right text-red-600">{formatCurrency(summary.total_outstanding)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
```

### Testing Standards

**Unit Tests:**
- Commission calculation: `earned = SUM(amount * rate / 100) WHERE paid`
- Outstanding calculation: `outstanding = SUM(amount * rate / 100) WHERE unpaid AND overdue`
- Date range filtering: Include installments due within range
- City filtering: Filter branches by city
- RLS enforcement: Verify agency_id isolation

**Integration Tests:**
- Generate report with filters → Verify commission accuracy
- Expand drill-down → See student payment plans
- Export CSV → Verify format and data
- Export PDF → Verify professional formatting
- Group by city → Verify correct grouping

**E2E Tests:**
- User flow: Reports → Commissions → Filter → Generate → Export CSV/PDF
- Verify downloaded files match expected format

### Performance Considerations

**Query Optimization:**
- Use database function (`get_commission_report`) to reduce round trips
- Index on `installments.due_date` for date range filtering
- Index on `branches.city` for city filtering
- Consider materialized view for frequently run reports

**Caching:**
- Cache commission data for 30 seconds (short duration)
- Invalidate when payments are recorded

**Large Reports:**
- Limit to 1000 colleges/branches per export
- Implement pagination if needed
- Stream PDF generation for very large reports

### Security Considerations

**Row-Level Security:**
- All queries filtered by agency_id
- RLS enforced on colleges, branches, enrollments, payment_plans, installments tables
- Use server-side Supabase client with user context

**Input Validation:**
- Validate date range format (YYYY-MM-DD)
- Sanitize city filter input
- Limit report size to prevent DoS

**Data Privacy:**
- Only include payment plans for current agency
- Mask sensitive student data if needed
- Log all report exports to audit trail

### References

- [Source: docs/epics.md#Story 7.4] - Story acceptance criteria and technical notes
- [Source: docs/epics.md#Story 7.1] - Report generator foundation
- [Source: .bmad-ephemeral/stories/7-2-csv-export-functionality.md] - CSV export patterns and utilities
- [Source: docs/architecture.md#Reporting Zone] - Reporting architecture and component organization
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns

## Change Log

- **2025-11-13**: Story created by SM agent via create-story workflow

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

