# Story 7-4: Commission Report by College - Task 4

## Story Context

**As an** Agency Admin
**I want** to generate commission reports grouped by college/branch with location details
**So that** I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions

## Task 4: Add CSV Export for Commissions Report

**Acceptance Criteria**: #5

**Previous Tasks**:
- Task 1 - Created report page UI with filters
- Task 2 - Implemented API route for commission data
- Task 3 - Created table component to display results

### Task Description

Add CSV export functionality for commission reports, reusing established CSV export utilities from Story 7.2.

### Subtasks Checklist

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

## Context

### Relevant Acceptance Criteria

5. **And** the report is exportable to CSV and PDF

### Key Constraints

- **Reuse CSV Export Utilities**: Use established `formatCurrencyForCSV()`, `formatDateISO()`, `addUTF8BOM()` from `packages/utils/src/csv-formatter.ts` (Story 7.2)
- **File Naming Convention**: `commissions_report_YYYY-MM-DD.csv` with timestamp
- **Multi-Tenant Security**: All queries MUST filter by agency_id

### Interface to Implement

**Commission Export API**:
- Kind: REST endpoint
- Signature: `GET /api/reports/commissions/export?format=csv&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&city=optional` - Returns: File download (CSV)
- Path: `apps/reports/app/api/reports/commissions/export/route.ts`

### CSV Export Utilities (from Story 7.2)

Located at `packages/utils/src/csv-formatter.ts`:

- `formatCurrencyForCSV(amount: number | null): string` - Returns decimal format "1234.56" without symbols
- `formatDateISO(date: string | Date | null): string` - Returns ISO format "YYYY-MM-DD"
- `addUTF8BOM(content: string): string` - Prepends UTF-8 BOM (\uFEFF) for Excel compatibility

### Dependencies

- `csv-stringify` (latest) - Stream-based CSV generation for commission data export

### Reference Documentation

- Context File: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
- Related Story: `.bmad-ephemeral/stories/7-2-csv-export-functionality.md` - CSV export patterns and utilities
- Pattern to Follow: `apps/reports/app/api/reports/payment-plans/export/route.ts` (if exists)

## Manifest Update Instructions

Before starting implementation:

1. **Read the manifest**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`
2. **Update Task 3**:
   - Status: Completed
   - Completed: [Today's Date]
   - Notes: [Add notes from Task 3, e.g., "Created table component with college grouping and expandable drill-down"]
3. **Update Task 4**:
   - Status: In Progress
   - Started: [Today's Date]

## Implementation Notes

**Building on Previous Tasks**: Tasks 1-3 created the full reporting UI and API. This task adds CSV export capability.

**Key Implementation Points**:

1. **API Route Structure** (`apps/reports/app/api/reports/commissions/export/route.ts`):
   - Create a GET handler (not POST - exports are typically GET)
   - Extract query parameters: format, date_from, date_to, city
   - Validate format parameter (should be 'csv' for this task)
   - Authenticate user and get agency_id
   - Reuse commission data fetching logic from Task 2
   - Generate CSV with proper formatting
   - Set response headers for file download

2. **CSV Generation**:
   - Use `csv-stringify` library for structured CSV generation
   - Create header row: College, Branch, City, Total Paid, Rate (%), Earned Commission, Outstanding Commission
   - For each commission row, format as CSV row
   - Use `formatCurrencyForCSV()` for all currency amounts (no symbols, decimal format)
   - After main data, add blank row, then drill-down section header
   - For each branch, add student payment plan details rows
   - Apply `addUTF8BOM()` to final CSV content

3. **Data Fetching**:
   - Reuse the database function or query from Task 2
   - Same filtering logic (date_from, date_to, city)
   - Same RLS enforcement (agency_id)
   - Consider extracting shared logic into a helper function

4. **Response Headers**:
   ```typescript
   return new Response(csvContent, {
     headers: {
       'Content-Type': 'text/csv; charset=utf-8',
       'Content-Disposition': `attachment; filename="commissions_report_${dateStr}.csv"`,
     },
   })
   ```

5. **CSV Structure Example**:
   ```
   College,Branch,City,Total Paid,Rate (%),Earned Commission,Outstanding Commission
   University of Example,Main Campus,New York,15000.00,10,1500.00,250.00
   University of Example,Downtown Branch,New York,8000.00,10,800.00,100.00
   Another College,City Center,Boston,12000.00,8,960.00,0.00

   Student Payment Details
   College,Branch,Student Name,Payment Plan ID,Total Amount,Paid Amount,Commission Earned
   University of Example,Main Campus,John Doe,pp-001,5000.00,5000.00,500.00
   University of Example,Main Campus,Jane Smith,pp-002,10000.00,10000.00,1000.00
   ...
   ```

6. **Frontend Integration**:
   - Add "Export CSV" button to the commissions report page (Task 1 file)
   - Button should be enabled only when report data is available
   - On click, construct URL with current filter params
   - Trigger download using window.location.href or fetch with blob
   - Show loading state during export

7. **File Naming**:
   - Format: `commissions_report_2024-11-13.csv`
   - Use date range start date or current date
   - Use `formatDateISO()` for consistent formatting

**Pattern to Follow**:
Reference `apps/reports/app/api/reports/payment-plans/export/route.ts` from Story 7.2 for CSV export route pattern.

## Next Steps

After completing this task:

1. **Test CSV Export**:
   - Generate a commission report with filters
   - Click "Export CSV" button
   - Verify file downloads with correct filename
   - Open CSV in Excel - verify UTF-8 BOM works (special characters display correctly)
   - Verify currency formatting (decimal, no symbols)
   - Verify drill-down data is included
   - Test with different filters and data sizes

2. **Update the manifest**:
   - Set Task 4 status to "Completed" with today's date
   - Add implementation notes (e.g., "Added CSV export with Excel compatibility")

3. **Edge Case Testing**:
   - Empty report (no data) → Should generate CSV with headers only
   - Large dataset → Verify performance is acceptable
   - Special characters in names → Verify proper CSV escaping

4. **Move to Task 5**:
   - Open file: `task-5-prompt.md`
   - Task 5 will create the professional PDF template
   - Copy and paste the contents into Claude Code Web

## Tips

- Import CSV utilities from packages/utils/src/csv-formatter.ts
- Test the CSV in both Excel and Google Sheets for compatibility
- Use csv-stringify's streaming API for better performance with large datasets
- Consider adding column for date range in CSV header for context
- Ensure proper CSV escaping (commas, quotes, newlines in data)
- Test download works in different browsers
- Add error handling for export failures
- Consider adding export progress indication for large reports
