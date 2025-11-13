# Story 7.2: CSV Export Functionality

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to export reports to CSV format**,
so that **I can import payment data into Excel or accounting software**.

## Acceptance Criteria

1. **Given** I have generated a report
   **When** I click "Export to CSV"
   **Then** a CSV file is downloaded with all report data

2. **And** the CSV includes column headers

3. **And** the CSV respects the selected columns and filters

4. **And** currency amounts are formatted correctly

5. **And** dates are in ISO format (YYYY-MM-DD)

6. **And** the filename includes the report type and timestamp (e.g., "payment_plans_2025-11-10.csv")

## Tasks / Subtasks

- [ ] **Task 1: Create CSV Export API Route** (AC: #1, 3-6)
  - [ ] Create API route: `GET /api/reports/payment-plans/export?format=csv`
  - [ ] Accept all filter params from report generation:
    - `date_from`, `date_to` (date range filter)
    - `college_id`, `branch_id` (college/branch filter)
    - `student_id` (student filter)
    - `status[]` (payment status filter)
    - `contract_expiration_from`, `contract_expiration_to` (contract expiration filter)
    - `columns[]` (selected column list)
  - [ ] Query payment_plans with same logic as report generation API
  - [ ] Transform data rows to CSV format using `csv-stringify` or `papaparse`
  - [ ] Set HTTP response headers:
    - `Content-Type: text/csv; charset=utf-8`
    - `Content-Disposition: attachment; filename="payment_plans_YYYY-MM-DD_HHmmss.csv"`
  - [ ] Generate filename with timestamp: `payment_plans_${date}.csv`
  - [ ] Test: Verify CSV downloads with correct filename
  - [ ] Test: Verify RLS filters by agency_id

- [ ] **Task 2: Format CSV Data Correctly** (AC: #2, 4-5)
  - [ ] Include column headers as first row
  - [ ] Map column keys to human-readable headers:
    - `student_name` → "Student Name"
    - `college_name` → "College"
    - `branch_name` → "Branch"
    - `total_amount` → "Total Amount"
    - `currency` → "Currency"
    - `start_date` → "Start Date"
    - `commission_rate_percent` → "Commission Rate (%)"
    - `expected_commission` → "Expected Commission"
    - `earned_commission` → "Earned Commission"
    - `status` → "Status"
    - `contract_expiration_date` → "Contract Expiration"
  - [ ] Format currency amounts:
    - Remove currency symbols
    - Use decimal format: "1234.56"
    - Two decimal places for consistency
  - [ ] Format dates in ISO 8601 format: "YYYY-MM-DD"
  - [ ] Handle null/undefined values as empty strings
  - [ ] Escape special characters in text fields (commas, quotes, newlines)
  - [ ] Add UTF-8 BOM (`\uFEFF`) at start of file for Excel compatibility
  - [ ] Test: Open exported CSV in Excel and verify formatting

- [ ] **Task 3: Support Large Dataset Streaming** (AC: #1)
  - [ ] Implement streaming approach for large datasets (>1000 rows)
  - [ ] Use Node.js streams instead of loading all data into memory
  - [ ] Stream CSV rows as they're generated:
    ```typescript
    const stream = new Readable()
    stream.push('\uFEFF') // BOM for Excel
    stream.push('header1,header2,header3\n')
    for await (const row of queryStream) {
      stream.push(formatRow(row) + '\n')
    }
    stream.push(null) // End stream
    return new Response(stream)
    ```
  - [ ] Set `Transfer-Encoding: chunked` for streaming response
  - [ ] Test with dataset of 5000+ rows to verify memory efficiency
  - [ ] Monitor memory usage during export

- [ ] **Task 4: Add Export Button to Report UI** (AC: #1)
  - [ ] Add "Export to CSV" button to report builder page:
    - Location: Top right of report results table, next to "Export to PDF"
    - Icon: Download icon (↓)
    - Label: "Export CSV"
  - [ ] Trigger API call with current filters and columns:
    ```typescript
    const exportUrl = new URL('/api/reports/payment-plans/export', window.location.origin)
    exportUrl.searchParams.set('format', 'csv')
    exportUrl.searchParams.set('date_from', filters.dateFrom)
    exportUrl.searchParams.set('date_to', filters.dateTo)
    // Add all active filters
    window.location.href = exportUrl.toString()
    ```
  - [ ] Show loading spinner while export is processing
  - [ ] Handle errors gracefully:
    - Show toast notification if export fails
    - Log error details for debugging
  - [ ] Test: Click button → CSV downloads with correct data

- [ ] **Task 5: Add Export Tracking** (AC: #1)
  - [ ] Log export events to activity_log table:
    - `entity_type: 'report'`
    - `action: 'exported'`
    - `description: "{{user}} exported {{report_type}} report to CSV ({{row_count}} rows)"`
    - `metadata: { report_type, format: 'csv', row_count, filters }`
  - [ ] Track export in user activity feed
  - [ ] Test: Verify export activity appears in recent activity feed

- [ ] **Task 6: Handle Column Selection** (AC: #3)
  - [ ] Accept `columns[]` query parameter as array of column keys
  - [ ] If no columns specified, export all available columns
  - [ ] Only include selected columns in CSV headers and rows
  - [ ] Maintain column order based on user selection
  - [ ] Example URL: `/api/reports/payment-plans/export?format=csv&columns[]=student_name&columns[]=total_amount&columns[]=status`
  - [ ] Validate column keys (must be valid payment plan fields)
  - [ ] Test: Export with subset of columns → Only selected columns appear

- [ ] **Task 7: Testing** (AC: All)
  - [ ] Write API route unit tests:
    - Test CSV export with all filters applied
    - Test CSV headers match selected columns
    - Test currency formatting (decimal, no symbols)
    - Test date formatting (ISO 8601)
    - Test filename generation with timestamp
    - Test UTF-8 BOM inclusion
    - Test RLS filtering by agency_id
    - Test streaming for large datasets (no memory overflow)
  - [ ] Write integration tests:
    - Generate report → Click "Export CSV" → CSV downloads
    - Open CSV in Excel → Verify readable format
    - Apply filters → Export CSV → Verify filtered data
    - Select columns → Export CSV → Verify only selected columns
  - [ ] Write error handling tests:
    - Invalid filters → Return 400 error
    - No data available → Return empty CSV with headers
    - Database error → Return 500 error with message
  - [ ] Test edge cases:
    - Export with 0 rows (empty report)
    - Export with 10,000+ rows (streaming)
    - Export with special characters in text fields
    - Export with null values in optional fields

## Dev Notes

### Architecture Context

**Reporting Zone:**
- API route at `apps/reports/app/api/reports/payment-plans/export/route.ts`
- Reuses query logic from `apps/reports/app/api/reports/payment-plans/route.ts`
- Transforms JSON response to CSV format

**CSV Libraries:**
- Use `csv-stringify` (Node.js stream-based CSV writer)
- Alternative: `papaparse` (browser-friendly, but not optimal for server-side streaming)

**Streaming Response:**
- Use Node.js `Readable` stream for memory-efficient export
- Stream CSV rows incrementally instead of loading all into memory
- Critical for reports with thousands of rows

### Learnings from Previous Story (7.1)

**From Story 7.1: Payment Plans Report Generator (Status: backlog)**

Story 7.1 establishes the report generation API and UI with filtering capabilities. This story (7.2) extends that functionality by adding CSV export.

**Key Integration Points:**
- Reuse same filter logic from `/api/reports/payment-plans`
- Reuse same query builder and RLS policies
- Export applies same filters as current report view
- Column selection maintained from report builder UI

**Patterns to Reuse:**
- Query construction: Same payment_plans query with joins
- Filter application: Same date range, college, student, status filters
- RLS filtering: Auto-applied via agency_id
- Error handling: Same validation and error response patterns

**New Patterns Introduced in This Story:**
- **CSV Formatting**: Transform JSON to CSV with proper escaping and formatting
- **Streaming Export**: Memory-efficient export for large datasets
- **Content-Type Headers**: Set proper MIME type and disposition for file download
- **BOM for Excel**: Add UTF-8 BOM for Excel compatibility
- **Filename Generation**: Dynamic filename with timestamp

### Project Structure Notes

**API Route Organization:**
```
apps/reports/
├── app/
│   └── api/
│       └── reports/
│           └── payment-plans/
│               ├── route.ts                    # Report generation API
│               └── export/
│                   └── route.ts                # CSV/PDF export API
```

**Shared Utilities:**
- CSV formatter: `packages/utils/src/csv-formatter.ts`
  - `formatCSVRow(row, columns)` - Format single row with escaping
  - `generateCSVHeaders(columns)` - Generate header row
  - `addUTF8BOM(content)` - Add BOM for Excel compatibility
- Date formatter: `packages/utils/src/formatters.ts`
  - `formatDateISO(date)` - Convert to YYYY-MM-DD
- Currency formatter: `packages/utils/src/formatters.ts`
  - `formatCurrencyForCSV(amount)` - Decimal format without symbols

### CSV Export Implementation

**API Route Structure:**

```typescript
// apps/reports/app/api/reports/payment-plans/export/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') // 'csv' or 'pdf'

  // Extract filters (same as report generation)
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

  // Query payment plans with same logic as report generation
  const { data, error } = await supabase
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
    .eq('agency_id', user.agency_id)
    // Apply filters...

  if (error) throw error

  // Format as CSV
  if (format === 'csv') {
    return exportAsCSV(data, columns)
  }

  // Format as PDF (Story 7.3)
  if (format === 'pdf') {
    return exportAsPDF(data, columns)
  }
}
```

**CSV Export Function:**

```typescript
// packages/utils/src/csv-formatter.ts

import { stringify } from 'csv-stringify/sync'

export function exportAsCSV(data: any[], columns: string[]) {
  // Generate header row
  const headers = columns.map(col => COLUMN_LABELS[col] || col)

  // Format data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = getNestedValue(row, col)

      // Format based on data type
      if (col.includes('amount') || col.includes('commission')) {
        return formatCurrencyForCSV(value)
      }
      if (col.includes('date')) {
        return formatDateISO(value)
      }
      return value || ''
    })
  })

  // Generate CSV with headers
  const csv = stringify([headers, ...rows], {
    quoted: true, // Quote all fields
    quoted_empty: true, // Quote empty fields
    escape: '"', // Escape quotes with double quotes
  })

  // Add UTF-8 BOM for Excel compatibility
  const csvWithBOM = '\uFEFF' + csv

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `payment_plans_${timestamp}.csv`

  // Return response with proper headers
  return new Response(csvWithBOM, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

const COLUMN_LABELS: Record<string, string> = {
  student_name: 'Student Name',
  college_name: 'College',
  branch_name: 'Branch',
  branch_city: 'City',
  total_amount: 'Total Amount',
  currency: 'Currency',
  start_date: 'Start Date',
  commission_rate_percent: 'Commission Rate (%)',
  expected_commission: 'Expected Commission',
  earned_commission: 'Earned Commission',
  status: 'Status',
  contract_expiration_date: 'Contract Expiration',
}

function getNestedValue(obj: any, path: string) {
  // Handle nested paths like "enrollments.student.full_name"
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

function formatCurrencyForCSV(amount: number | null): string {
  if (amount == null) return ''
  return amount.toFixed(2) // "1234.56"
}

function formatDateISO(date: string | Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0] // "2025-11-10"
}
```

**Streaming Implementation (For Large Datasets):**

```typescript
// For datasets > 1000 rows, use streaming approach

import { Readable } from 'stream'
import { stringify } from 'csv-stringify'

export async function exportAsCSVStream(queryStream: AsyncIterable<any>, columns: string[]) {
  const headers = columns.map(col => COLUMN_LABELS[col] || col)

  // Create CSV stringifier stream
  const stringifier = stringify({
    header: true,
    columns: headers,
    quoted: true,
  })

  // Create readable stream
  const readable = new Readable({
    async read() {
      // Add BOM at start
      this.push('\uFEFF')

      // Stream rows
      for await (const row of queryStream) {
        const formattedRow = formatRow(row, columns)
        stringifier.write(formattedRow)
      }

      stringifier.end()
    }
  })

  // Pipe stringifier to readable
  stringifier.pipe(readable)

  const filename = `payment_plans_${Date.now()}.csv`

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Transfer-Encoding': 'chunked',
    },
  })
}
```

### UI Integration

**Export Button Component:**

```typescript
// apps/reports/app/components/ExportButtons.tsx

interface ExportButtonsProps {
  filters: ReportFilters
  columns: string[]
}

export function ExportButtons({ filters, columns }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = async () => {
    setIsExporting(true)

    try {
      // Build export URL with filters and columns
      const url = new URL('/api/reports/payment-plans/export', window.location.origin)
      url.searchParams.set('format', 'csv')

      // Add filters
      if (filters.date_from) url.searchParams.set('date_from', filters.date_from)
      if (filters.date_to) url.searchParams.set('date_to', filters.date_to)
      if (filters.college_id) url.searchParams.set('college_id', filters.college_id)
      // ... add all filters

      // Add selected columns
      columns.forEach(col => url.searchParams.append('columns[]', col))

      // Trigger download
      window.location.href = url.toString()

      // Log activity
      await logActivity('report', 'exported', `Exported payment plans report to CSV`)

      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExportCSV}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </>
        )}
      </Button>

      <Button
        onClick={handleExportPDF}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
    </div>
  )
}
```

### Database Query Optimization

**Query for Export:**

```sql
-- Efficient query for CSV export with all necessary joins
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
WHERE pp.agency_id = ?
  -- Apply filters dynamically
  AND pp.start_date >= ? -- date_from
  AND pp.start_date <= ? -- date_to
  AND c.id = ? -- college_id (optional)
  AND b.id = ? -- branch_id (optional)
  AND s.id = ? -- student_id (optional)
  AND pp.status = ANY(?) -- status[] (optional)
ORDER BY pp.start_date DESC;
```

**Performance Considerations:**
- Use indexes on frequently filtered columns: `start_date`, `status`, `agency_id`
- Limit joins to only necessary tables
- Stream results for large datasets (>1000 rows)
- Consider adding pagination for exports (max 10,000 rows per export)

### Excel Compatibility

**UTF-8 BOM:**
- Add Byte Order Mark (`\uFEFF`) at start of file
- Ensures Excel correctly detects UTF-8 encoding
- Without BOM, Excel may misinterpret special characters

**Formatting Best Practices:**
- Quote all fields to handle commas, quotes, newlines
- Use double quotes for escaping: `"He said ""hello"""` → `He said "hello"`
- Dates in ISO 8601 format: `YYYY-MM-DD`
- Currency without symbols: `1234.56` (not `$1,234.56`)
- Two decimal places for consistency

**Testing in Excel:**
- Open exported CSV in Excel
- Verify special characters display correctly
- Verify dates recognized as dates
- Verify currency amounts formatted as numbers
- Verify column headers are bold/formatted

### Error Handling

**Validation Errors:**
- Invalid filters → Return 400 Bad Request with error message
- Invalid columns → Return 400 Bad Request listing valid column options
- Missing required params → Return 400 Bad Request

**Database Errors:**
- Query timeout → Return 504 Gateway Timeout
- Connection error → Return 500 Internal Server Error
- RLS violation → Return 403 Forbidden

**Empty Results:**
- No data matching filters → Return CSV with headers only (0 data rows)
- Include message in response: "No data available for selected filters"

**Large Dataset Handling:**
- Implement pagination: max 10,000 rows per export
- If dataset exceeds limit, return error with message:
  - "Dataset too large. Please narrow your filters or contact support for bulk export."
- Consider background job for very large exports (future enhancement)

### Security Considerations

**Row-Level Security:**
- All queries MUST filter by agency_id (RLS auto-applied)
- Use server-side Supabase client with user context
- Never expose data from other agencies

**Input Validation:**
- Sanitize all filter inputs to prevent SQL injection
- Validate column names against whitelist
- Validate date formats before query
- Limit URL parameter length to prevent DoS

**Rate Limiting:**
- Implement rate limiting: max 10 exports per minute per user
- Prevent abuse of export endpoint
- Log excessive export requests for monitoring

**Data Privacy:**
- Only include columns user has permission to view
- Respect role-based access control (RBAC)
- Log all export actions to audit trail

### Testing Standards

**Unit Tests (Vitest):**
- Test CSV formatting:
  - Currency formatting: `formatCurrencyForCSV(1234.56)` → `"1234.56"`
  - Date formatting: `formatDateISO('2025-11-10T12:00:00Z')` → `"2025-11-10"`
  - Special character escaping: `"Hello, World"` → `"Hello, World"` (quoted)
- Test header generation:
  - `generateCSVHeaders(['student_name', 'total_amount'])` → `["Student Name", "Total Amount"]`
- Test BOM addition:
  - `addUTF8BOM('data')` → `"\uFEFFdata"`

**Integration Tests:**
- Test export with filters:
  - Generate report with date range filter → Export CSV → Verify filtered data
  - Generate report with college filter → Export CSV → Verify only selected college
- Test column selection:
  - Select subset of columns → Export CSV → Verify only selected columns
- Test empty results:
  - Apply filters with no matches → Export CSV → Verify headers only
- Test large dataset:
  - Generate report with 5000+ rows → Export CSV → Verify streaming works

**E2E Tests (Playwright):**
- User flow: Login → Reports → Generate report → Click "Export CSV" → CSV downloads
- Verify downloaded file:
  - Check filename format: `payment_plans_YYYY-MM-DD_HHmmss.csv`
  - Open in Excel → Verify readable format
  - Verify data matches report view

### Performance Optimization

**Caching:**
- Cache export queries for 30 seconds (short duration)
- Use same cache key as report generation API
- Invalidate cache when payment plans are modified

**Streaming:**
- Use streaming for datasets > 1000 rows
- Limit memory usage by streaming rows incrementally
- Monitor server memory during large exports

**Query Optimization:**
- Use database indexes on filtered columns
- Limit joins to necessary tables
- Consider materialized view for frequent exports

**Rate Limiting:**
- Limit to 10 exports per minute per user
- Queue excessive requests instead of rejecting
- Show "Processing..." message if queued

### Future Enhancements (Document for Later)

**Background Export Jobs:**
- For very large exports (>10,000 rows), run as background job
- Email user when export is ready for download
- Store export files in cloud storage (S3) with expiry (7 days)

**Scheduled Exports:**
- Allow users to schedule recurring exports (daily, weekly, monthly)
- Automatically email export files to configured recipients
- Store export history for audit trail

**Custom Templates:**
- Allow users to save export configurations as templates
- Predefined column selections and filters
- Quick export with one click

**Advanced Filtering:**
- Export with custom SQL queries (admin only)
- Export with complex filters (AND/OR conditions)
- Export with calculated fields

**Multi-Format Export:**
- Excel (.xlsx) format with formatting (colors, borders)
- JSON format for API integrations
- XML format for legacy systems

### References

- [Source: docs/epics.md#Story 7.2] - Story acceptance criteria and technical notes
- [Source: docs/epics.md#Story 7.1] - Report generator context and filtering
- [Source: docs/architecture.md#Reporting Zone] - Reporting component architecture
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns
- [Source: .bmad-ephemeral/stories/6-4-recent-activity-feed.md] - Activity logging patterns

## Change Log

- **2025-11-13**: Story created by SM agent via create-story workflow

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/7-2-csv-export-functionality.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
