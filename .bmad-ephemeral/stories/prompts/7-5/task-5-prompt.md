# Story 7-5: Student Payment History Report - Task 5

**Story**: Student Payment History Report
**Task**: Implement PDF Export API Route
**Acceptance Criteria**: AC #4, #5

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Create an API route that generates and downloads PDF payment statements for students. This route will fetch payment history data, render the StudentPaymentStatementPDF component (from Task 4), and return a PDF file with appropriate HTTP headers.

## Subtasks Checklist

- [ ] Create API route: `GET /api/students/[id]/payment-history/export?format=pdf&date_from=&date_to=`
- [ ] Fetch payment history data (reuse logic from Task 2)
- [ ] Fetch student details: `SELECT id, full_name, passport_number, email FROM students WHERE id = ? AND agency_id = ?`
- [ ] Fetch agency info for PDF header: `SELECT name, logo_url, contact_email, contact_phone FROM agencies WHERE id = ?`
- [ ] Render StudentPaymentStatementPDF component with data
- [ ] Generate PDF using `@react-pdf/renderer`
- [ ] Set HTTP response headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="payment_statement_[student_name]_[date].pdf"`
- [ ] Set filename: `payment_statement_[student_name]_[YYYY-MM-DD].pdf`
- [ ] Test: Click "Export PDF" → PDF downloads with statement

## Acceptance Criteria

**AC #4**: And the report is exportable to PDF for sharing with the student

**AC #5**: And the PDF is formatted as a clear payment statement

## Context & Constraints

### Key Constraints
- **Multi-Tenant Security**: All queries MUST filter by agency_id via RLS
- **File Naming**: Sanitize student name for safe filenames (remove special characters)
- **Error Handling**: Return appropriate errors for missing student or agency data
- **Performance**: Stream PDF generation for large payment histories

### API Interface

**Endpoint:** `GET /api/students/[id]/payment-history/export`

**Query Parameters:**
- `format`: 'pdf' (required)
- `date_from`: string (YYYY-MM-DD, optional)
- `date_to`: string (YYYY-MM-DD, optional)

**Response:**
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="payment_statement_[name]_[date].pdf"
- Binary PDF data

### Dependencies

**Required NPM Packages:**
- `@react-pdf/renderer` (^4.3.1) - PDF generation
- `@supabase/supabase-js` (latest) - Database queries
- `@supabase/ssr` (latest) - Server-side utilities

**Related Components:**
- StudentPaymentStatementPDF (Task 4) - PDF template
- Payment history API logic (Task 2) - Data fetching

### Artifacts & References

**Documentation:**
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context
- `.bmad-ephemeral/stories/7-4-commission-report-by-college.md` - PDF export patterns

## Implementation Guidelines

### Step 1: Create Export API Route

**File**: `apps/entities/app/api/students/[id]/payment-history/export/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { StudentPaymentStatementPDF } from '@/components/StudentPaymentStatementPDF'

// Helper function to sanitize filename
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
}

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
    const format = searchParams.get('format')
    const date_from = searchParams.get('date_from') || '1970-01-01'
    const date_to = searchParams.get('date_to') || new Date().toISOString().split('T')[0]

    if (format !== 'pdf') {
      return NextResponse.json(
        { error: 'Invalid format. Only PDF export is supported.' },
        { status: 400 }
      )
    }

    // Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, passport_number, email')
      .eq('id', studentId)
      .eq('agency_id', agencyId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch agency info
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('name, logo_url, contact_email, contact_phone')
      .eq('id', agencyId)
      .single()

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Fetch payment history using the database function
    const { data: paymentHistoryData, error: historyError } = await supabase.rpc(
      'get_student_payment_history',
      {
        p_student_id: studentId,
        p_agency_id: agencyId,
        p_date_from: date_from,
        p_date_to: date_to,
      }
    )

    if (historyError) {
      console.error('Payment history error:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }

    // Group installments by payment plan
    const paymentPlans = paymentHistoryData.reduce((acc: any, inst: any) => {
      const key = inst.payment_plan_id
      if (!acc[key]) {
        acc[key] = {
          payment_plan_id: inst.payment_plan_id,
          college_name: inst.college_name,
          branch_name: inst.branch_name,
          program_name: inst.program_name,
          plan_total_amount: inst.plan_total_amount,
          plan_start_date: inst.plan_start_date,
          installments: [],
        }
      }
      acc[key].installments.push({
        installment_id: inst.installment_id,
        installment_number: inst.installment_number,
        amount: inst.amount,
        due_date: inst.due_date,
        paid_at: inst.paid_at,
        paid_amount: inst.paid_amount,
        status: inst.status,
      })
      return acc
    }, {})

    const paymentHistory = Object.values(paymentPlans)

    // Calculate summary
    const summary = {
      total_paid: paymentHistoryData.reduce((sum: number, inst: any) =>
        sum + (inst.paid_amount || 0), 0
      ),
      total_outstanding: paymentHistoryData.reduce((sum: number, inst: any) =>
        sum + (inst.paid_at ? 0 : inst.amount), 0
      ),
      percentage_paid: 0,
    }

    const total = summary.total_paid + summary.total_outstanding
    summary.percentage_paid = total > 0 ? (summary.total_paid / total) * 100 : 0

    // Generate PDF
    const pdfDocument = (
      <StudentPaymentStatementPDF
        student={student}
        paymentHistory={paymentHistory}
        summary={summary}
        filters={{ date_from, date_to }}
        agency={agency}
      />
    )

    // Render PDF to stream
    const stream = await renderToStream(pdfDocument)

    // Generate filename
    const sanitizedName = sanitizeFilename(student.full_name)
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `payment_statement_${sanitizedName}_${dateStr}.pdf`

    // Set response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    // Return PDF stream
    return new NextResponse(stream as any, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
```

### Step 2: Update PaymentHistorySection Component

Update the "Export PDF" button in `PaymentHistorySection.tsx` to trigger the export:

```tsx
const handleExportPDF = async () => {
  try {
    setIsExporting(true)

    // Build query params
    const params = new URLSearchParams({
      format: 'pdf',
    })

    if (dateFilter === 'thisYear') {
      const year = new Date().getFullYear()
      params.set('date_from', `${year}-01-01`)
      params.set('date_to', `${year}-12-31`)
    } else if (dateFilter === 'custom' && customDateFrom && customDateTo) {
      params.set('date_from', customDateFrom)
      params.set('date_to', customDateTo)
    }

    // Trigger download
    const url = `/api/students/${studentId}/payment-history/export?${params}`
    window.open(url, '_blank')
  } catch (error) {
    console.error('Export failed:', error)
    // Show error toast or notification
  } finally {
    setIsExporting(false)
  }
}

// Update button
<button
  onClick={handleExportPDF}
  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
  disabled={isLoading || isExporting || paymentHistory.length === 0}
>
  <FileDown className="h-4 w-4" />
  {isExporting ? 'Exporting...' : 'Export PDF'}
</button>
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 5 as "Completed" with date
2. Test PDF export with various date ranges and payment scenarios
3. Move to `task-6-prompt.md` to implement date range filtering
4. Date range filtering will enhance both the UI and API

## Testing Checklist

- [ ] API route responds to GET requests at `/api/students/[id]/payment-history/export`
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for students not in user's agency (RLS enforcement)
- [ ] Returns 400 for invalid format parameter
- [ ] PDF file downloads with correct Content-Type header
- [ ] Filename follows format: `payment_statement_[name]_[YYYY-MM-DD].pdf`
- [ ] Student name is sanitized in filename (no special characters)
- [ ] PDF includes all required sections (header, student info, plans, summary, footer)
- [ ] Agency logo displays in PDF (if logo_url exists)
- [ ] Date range filtering works (date_from and date_to parameters)
- [ ] Summary totals are accurate
- [ ] PDF opens correctly in Adobe Reader, Preview, and browsers
- [ ] Long payment histories generate multi-page PDFs with page numbers
- [ ] Export button in UI triggers download
- [ ] Export button shows "Exporting..." loading state
- [ ] Export button is disabled when no payment history
- [ ] No console errors or warnings
