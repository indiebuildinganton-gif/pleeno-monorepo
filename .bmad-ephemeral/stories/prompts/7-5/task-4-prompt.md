# Story 7-5: Student Payment History Report - Task 4

**Story**: Student Payment History Report
**Task**: Create Student Payment Statement PDF Template
**Acceptance Criteria**: AC #4, #5

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Create a professional PDF template using `@react-pdf/renderer` that formats payment history as a clear, student-friendly payment statement. This template will be used by the PDF export API (Task 5) to generate downloadable statements.

## Subtasks Checklist

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
  - Total Amount Due, Total Paid, Outstanding Balance, Percentage Paid
- [ ] Format as professional statement with clean layout, page breaks, footer
- [ ] Add footer with disclaimer and agency contact info
- [ ] Test: Render PDF → Verify professional statement formatting

## Acceptance Criteria

**AC #4**: And the report is exportable to PDF for sharing with the student

**AC #5**: And the PDF is formatted as a clear payment statement

## Context & Constraints

### Key Constraints
- **Professional Formatting**: PDF must look like an official financial statement
- **Student-Friendly**: Clear, simple language and layout for student consumption
- **Agency Branding**: Include agency logo and contact information
- **Page Breaks**: Handle long payment histories with proper page breaks
- **Print-Ready**: PDF should be suitable for printing and archiving

### PDF Design Pattern

Follow professional statement design:
- Header with branding and document title
- Student information section
- Grouped payment plan sections
- Clear status indicators
- Summary totals with visual emphasis
- Footer with disclaimer and contact details
- Page numbers

### Dependencies

**Required NPM Packages:**
- `@react-pdf/renderer` (^4.3.1) - PDF generation from React components
- `date-fns` (^4.1.0) - Date formatting

**Reusable Patterns:**
- PDF utilities from Story 7.4 (Commission Report)
- Similar header/footer layout
- Table styling patterns

### Artifacts & References

**Documentation:**
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context
- `.bmad-ephemeral/stories/7-4-commission-report-by-college.md` - PDF export patterns

## Implementation Guidelines

### Step 1: Install Dependencies

Ensure `@react-pdf/renderer` is installed:

```bash
pnpm add @react-pdf/renderer
```

### Step 2: Create PDF Component

**File**: `apps/entities/app/components/StudentPaymentStatementPDF.tsx`

```tsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface Installment {
  installment_id: string
  installment_number: number
  amount: number
  due_date: string
  paid_at: string | null
  paid_amount: number | null
  status: string
}

interface PaymentPlan {
  payment_plan_id: string
  college_name: string
  branch_name: string
  program_name: string
  plan_total_amount: number
  plan_start_date: string
  installments: Installment[]
}

interface StudentPaymentStatementPDFProps {
  student: {
    full_name: string
    passport_number: string
    email: string
  }
  paymentHistory: PaymentPlan[]
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '2pt solid #333',
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  studentInfo: {
    backgroundColor: '#f9fafb',
    padding: 15,
    marginBottom: 20,
    borderRadius: 4,
    border: '1pt solid #e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: 140,
    color: '#374151',
  },
  value: {
    flex: 1,
    color: '#111827',
  },
  planHeader: {
    backgroundColor: '#dbeafe',
    padding: 12,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 4,
    border: '1pt solid #93c5fd',
  },
  planTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 9,
    color: '#64748b',
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottom: '1pt solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #e5e7eb',
    fontSize: 9,
  },
  col1: { width: '15%' }, // Due Date
  col2: { width: '10%' }, // Installment #
  col3: { width: '15%' }, // Amount
  col4: { width: '15%' }, // Status
  col5: { width: '15%' }, // Paid Date
  col6: { width: '30%' }, // Notes
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
  statusCancelled: {
    color: '#6b7280',
  },
  summary: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f9fafb',
    border: '2pt solid #1e40af',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e40af',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 11,
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#374151',
  },
  summaryValue: {
    color: '#111827',
  },
  totalPaid: {
    color: '#16a34a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalOutstanding: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalRow: {
    borderTop: '1pt solid #d1d5db',
    paddingTop: 10,
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #d1d5db',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 3,
    textAlign: 'center',
  },
  pageNumber: {
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 5,
  },
})

export function StudentPaymentStatementPDF({
  student,
  paymentHistory,
  summary,
  filters,
  agency,
}: StudentPaymentStatementPDFProps) {
  const period = filters.date_from && filters.date_to
    ? `${formatDate(filters.date_from)} to ${formatDate(filters.date_to)}`
    : 'All Time'

  const today = formatDate(new Date())

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return styles.statusPaid
      case 'pending': return styles.statusPending
      case 'overdue': return styles.statusOverdue
      case 'cancelled': return styles.statusCancelled
      default: return styles.statusPending
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {agency.logo_url && <Image src={agency.logo_url} style={styles.logo} />}
            <Text style={styles.title}>Payment Statement</Text>
            <Text style={styles.subtitle}>{agency.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.subtitle}>Statement Period: {period}</Text>
            <Text style={styles.subtitle}>Generated: {today}</Text>
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
          <View key={idx} wrap={false}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>
                {plan.college_name} - {plan.branch_name}
              </Text>
              <Text style={styles.planSubtitle}>
                {plan.program_name} • Total: {formatCurrency(plan.plan_total_amount)} • Started: {formatDate(plan.plan_start_date)}
              </Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>Due Date</Text>
                <Text style={styles.col2}>Inst. #</Text>
                <Text style={styles.col3}>Amount</Text>
                <Text style={styles.col4}>Status</Text>
                <Text style={styles.col5}>Paid Date</Text>
              </View>
              {plan.installments.map((inst, instIdx) => (
                <View key={instIdx} style={styles.tableRow}>
                  <Text style={styles.col1}>{formatDate(inst.due_date)}</Text>
                  <Text style={styles.col2}>#{inst.installment_number}</Text>
                  <Text style={styles.col3}>{formatCurrency(inst.amount)}</Text>
                  <Text style={[styles.col4, getStatusStyle(inst.status)]}>
                    {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
                  </Text>
                  <Text style={styles.col5}>
                    {inst.paid_at ? formatDate(inst.paid_at) : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summary} wrap={false}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount Due:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.total_paid + summary.total_outstanding)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
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
            <Text style={styles.summaryValue}>{summary.percentage_paid.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This statement reflects payments recorded as of {today}
          </Text>
          <Text style={styles.footerText}>
            For inquiries, please contact {agency.contact_email} or {agency.contact_phone}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  )
}
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 4 as "Completed" with date
2. Test PDF rendering in isolation (you can create a test endpoint)
3. Move to `task-5-prompt.md` to implement the PDF export API route
4. The export API will use this template to generate downloadable PDFs

## Testing Checklist

- [ ] PDF renders without errors
- [ ] Header includes agency logo (if available), title, and dates
- [ ] Student information section displays correctly
- [ ] Payment plans are grouped with clear headers
- [ ] Installment table has all required columns
- [ ] Status colors match specification (green/blue/red/gray)
- [ ] Summary section shows all totals correctly
- [ ] Footer displays disclaimer and contact info
- [ ] Page numbers appear on each page
- [ ] Long payment histories break across pages correctly
- [ ] PDF opens in Adobe Reader, Preview, and browsers
- [ ] Typography is clear and readable
- [ ] Currency formatting uses $ symbol
- [ ] Dates formatted as "Jan 15, 2025"
- [ ] No console errors or warnings
