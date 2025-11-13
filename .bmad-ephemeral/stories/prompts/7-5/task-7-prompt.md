# Story 7-5: Student Payment History Report - Task 7

**Story**: Student Payment History Report
**Task**: Reuse Export Utilities from Story 7.2 and 7.4
**Acceptance Criteria**: AC #4, #5

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Refactor the PDF export implementation to reuse established utilities and patterns from Stories 7.2 (CSV Export) and 7.4 (Commission Report). This task focuses on consolidating shared code, ensuring consistent formatting, and establishing reusable PDF generation utilities.

## Subtasks Checklist

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

## Acceptance Criteria

**AC #4**: And the report is exportable to PDF for sharing with the student

**AC #5**: And the PDF is formatted as a clear payment statement

## Context & Constraints

### Key Constraints
- **Code Reuse**: Maximize reuse of existing utilities from Stories 7.2 and 7.4
- **Consistent Formatting**: PDF should match styling and layout patterns from other reports
- **Maintainability**: Consolidate shared code in packages/utils for easy maintenance
- **Backwards Compatibility**: Refactoring should not break existing reports

### Shared Utilities Pattern

Stories 7.2 and 7.4 established these reusable patterns:
- PDF generation with `@react-pdf/renderer`
- Agency logo fetching and display
- Professional header/footer layouts
- Consistent typography and spacing
- Currency and date formatting utilities

### Dependencies

**Required Files (from Story 7.4):**
- `packages/utils/src/pdf-generator.ts` - PDF generation utilities
- `packages/utils/src/formatters.ts` - Currency and date formatters
- Commission Report PDF styling patterns

### Artifacts & References

**Documentation:**
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context
- `.bmad-ephemeral/stories/7-4-commission-report-by-college.md` - PDF export patterns
- `.bmad-ephemeral/stories/7-2-csv-export-functionality.md` - CSV export utilities

## Implementation Guidelines

### Step 1: Create/Update PDF Generator Utility

**File**: `packages/utils/src/pdf-generator.ts`

```typescript
import { renderToStream } from '@react-pdf/renderer'
import { ReactElement } from 'react'

/**
 * Generate PDF from React component
 * @param component - React component to render as PDF
 * @returns ReadableStream of PDF data
 */
export async function generatePDF(component: ReactElement): Promise<ReadableStream> {
  try {
    const stream = await renderToStream(component)
    return stream as ReadableStream
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('Failed to generate PDF')
  }
}

/**
 * Fetch agency logo from Supabase storage
 * @param logoUrl - URL or path to agency logo
 * @returns Data URL for logo image
 */
export async function fetchAgencyLogo(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null

  try {
    // If already a data URL or full URL, return as-is
    if (logoUrl.startsWith('data:') || logoUrl.startsWith('http')) {
      return logoUrl
    }

    // Otherwise, fetch from Supabase storage
    // This example assumes logoUrl is a Supabase storage path
    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.warn('Failed to fetch agency logo:', response.statusText)
      return null
    }

    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error fetching agency logo:', error)
    return null
  }
}

/**
 * Sanitize filename for safe file downloads
 * @param name - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
}

/**
 * Generate timestamp-based filename
 * @param prefix - Filename prefix (e.g., "payment_statement")
 * @param suffix - Additional suffix (e.g., student name)
 * @returns Formatted filename with timestamp
 */
export function generateTimestampedFilename(
  prefix: string,
  suffix?: string
): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const sanitizedSuffix = suffix ? `_${sanitizeFilename(suffix)}` : ''
  return `${prefix}${sanitizedSuffix}_${timestamp}.pdf`
}
```

### Step 2: Create/Update Formatters Utility

**File**: `packages/utils/src/formatters.ts`

```typescript
import { format, formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Format number as currency with symbol
 * @param amount - Numeric amount to format
 * @param currencyCode - ISO currency code (default: AUD)
 * @param locale - Locale for formatting (default: en-AU)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'AUD',
  locale: string = 'en-AU'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date as readable string
 * @param date - Date string or Date object
 * @param formatString - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  formatString: string = 'MMM d, yyyy'
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatString)
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'Invalid date'
  }
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 * @param date - Date object
 * @returns ISO date string
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Format date as relative time (e.g., "3 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (error) {
    console.error('Relative time formatting error:', error)
    return 'Unknown time'
  }
}

/**
 * Format number as percentage
 * @param value - Numeric value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
```

### Step 3: Refactor StudentPaymentStatementPDF

Update `apps/entities/app/components/StudentPaymentStatementPDF.tsx` to use shared utilities:

```tsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate, formatPercentage } from '@pleeno/utils/formatters'

// Import shared PDF styles if available
// import { pdfStyles } from '@pleeno/utils/pdf-styles'

// Component remains largely the same, but now uses imported formatters
// instead of inline formatting logic

export function StudentPaymentStatementPDF({ ... }: StudentPaymentStatementPDFProps) {
  // Use imported formatters
  const period = filters.date_from && filters.date_to
    ? `${formatDate(filters.date_from)} to ${formatDate(filters.date_to)}`
    : 'All Time'

  const today = formatDate(new Date())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Use formatCurrency from utils */}
        <Text>{formatCurrency(summary.total_paid)}</Text>

        {/* Use formatPercentage from utils */}
        <Text>{formatPercentage(summary.percentage_paid)}</Text>

        {/* Rest of component... */}
      </Page>
    </Document>
  )
}
```

### Step 4: Refactor PDF Export API Route

Update `apps/entities/app/api/students/[id]/payment-history/export/route.ts` to use utilities:

```typescript
import { generatePDF, fetchAgencyLogo, generateTimestampedFilename } from '@pleeno/utils/pdf-generator'
import { StudentPaymentStatementPDF } from '@/components/StudentPaymentStatementPDF'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // ... existing authentication and data fetching ...

  // Fetch agency logo if available
  const logoDataUrl = await fetchAgencyLogo(agency.logo_url)

  // Generate PDF using utility
  const pdfDocument = (
    <StudentPaymentStatementPDF
      student={student}
      paymentHistory={paymentHistory}
      summary={summary}
      filters={{ date_from, date_to }}
      agency={{ ...agency, logo_url: logoDataUrl }}
    />
  )

  const stream = await generatePDF(pdfDocument)

  // Generate filename using utility
  const filename = generateTimestampedFilename('payment_statement', student.full_name)

  // Set response headers
  const headers = new Headers()
  headers.set('Content-Type', 'application/pdf')
  headers.set('Content-Disposition', `attachment; filename="${filename}"`)

  return new NextResponse(stream as any, { status: 200, headers })
}
```

### Step 5: Create Shared PDF Styles (Optional)

**File**: `packages/utils/src/pdf-styles.ts`

```typescript
import { StyleSheet } from '@react-pdf/renderer'

/**
 * Shared PDF styles for consistent report formatting
 */
export const pdfStyles = StyleSheet.create({
  // Common styles used across all PDF reports
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
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #d1d5db',
    paddingTop: 10,
  },
  // Add more shared styles...
})
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 7 as "Completed" with date
2. Verify all PDF exports still work correctly
3. Move to `task-8-prompt.md` to add navigation links
4. Task 8 integrates the payment history feature into student navigation

## Testing Checklist

- [ ] PDF export still works correctly after refactoring
- [ ] Currency formatting matches other reports ($ symbol)
- [ ] Date formatting matches other reports (Jan 15, 2025)
- [ ] Agency logo displays in PDF (if available)
- [ ] Filename generation uses consistent pattern
- [ ] PDF styles match Commission Report patterns
- [ ] Formatters work with different currencies and locales
- [ ] generatePDF utility handles errors gracefully
- [ ] fetchAgencyLogo handles missing logos gracefully
- [ ] No code duplication between reports
- [ ] All existing reports (CSV, Commission) still work
- [ ] Import paths are correct (@pleeno/utils)
- [ ] TypeScript types are correct
- [ ] No console errors or warnings
