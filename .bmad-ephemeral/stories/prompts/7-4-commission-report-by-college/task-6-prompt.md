# Story 7-4: Commission Report by College - Task 6

## Story Context

**As an** Agency Admin
**I want** to generate commission reports grouped by college/branch with location details
**So that** I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions

## Task 6: Implement PDF Export API Route

**Acceptance Criteria**: #5-6

**Previous Tasks**:
- Task 1 - Created report page UI
- Task 2 - Implemented commission data API
- Task 3 - Created table display component
- Task 4 - Added CSV export functionality
- Task 5 - Created PDF template component

### Task Description

Create an API route that generates and downloads PDF reports using the template from Task 5.

### Subtasks Checklist

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

## Context

### Relevant Acceptance Criteria

5. **And** the report is exportable to CSV and PDF

6. **And** the PDF version is formatted for submission to college partners (clean, professional)

### Key Constraints

- **Multi-Tenant Security**: All queries MUST filter by agency_id
- **Professional PDF Formatting**: PDF must be submission-quality for college partners
- **File Naming Convention**: `commissions_report_YYYY-MM-DD.pdf` with timestamp

### Interface to Implement

**Commission Export API** (PDF format):
- Kind: REST endpoint
- Signature: `GET /api/reports/commissions/export?format=pdf&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&city=optional` - Returns: File download (PDF)
- Path: `apps/reports/app/api/reports/commissions/export/route.ts`

### Dependencies

- `@react-pdf/renderer` (^4.3.1) - Already installed in Task 5

### Reference Documentation

- Context File: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
- Story Dev Notes: See "PDF Generation in API Route" section
- Task 5: CommissionReportPDF component you just created

## Manifest Update Instructions

Before starting implementation:

1. **Read the manifest**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`
2. **Update Task 5**:
   - Status: Completed
   - Completed: [Today's Date]
   - Notes: [Add notes from Task 5, e.g., "Created professional PDF template with agency branding"]
3. **Update Task 6**:
   - Status: In Progress
   - Started: [Today's Date]

## Implementation Notes

**Building on Previous Tasks**: Task 4 created CSV export, Task 5 created PDF template. This task wires them together with an API route.

**Key Implementation Points**:

1. **Unified Export Route**:
   - You already have `apps/reports/app/api/reports/commissions/export/route.ts` from Task 4 (CSV)
   - Modify it to handle both CSV and PDF formats based on `format` query parameter
   - Structure:
     ```typescript
     export async function GET(request: Request) {
       const { searchParams } = new URL(request.url)
       const format = searchParams.get('format') // 'csv' or 'pdf'
       const date_from = searchParams.get('date_from')
       const date_to = searchParams.get('date_to')
       const city = searchParams.get('city')

       // Authenticate and fetch data (shared logic)
       // ...

       if (format === 'pdf') {
         return generatePDF(data, summary, filters, agency)
       } else if (format === 'csv') {
         return generateCSV(data, summary) // Existing from Task 4
       }
     }
     ```

2. **Fetch Agency Information**:
   - Query agencies table to get logo and name
   - Use Supabase server client
   - Filter by user's agency_id
   ```typescript
   const { data: agency } = await supabase
     .from('agencies')
     .select('name, logo_url')
     .eq('id', user.user_metadata.agency_id)
     .single()
   ```

3. **Render PDF**:
   - Import CommissionReportPDF component from Task 5
   - Import `renderToBuffer` from '@react-pdf/renderer'
   - Render component to buffer:
   ```typescript
   import { renderToBuffer } from '@react-pdf/renderer'
   import { CommissionReportPDF } from '@/app/components/CommissionReportPDF'

   const pdfBuffer = await renderToBuffer(
     <CommissionReportPDF
       data={data}
       summary={summary}
       filters={{ date_from, date_to, city }}
       agencyLogo={agency.logo_url}
       agencyName={agency.name}
     />
   )
   ```

4. **Set Response Headers**:
   ```typescript
   const filename = `commissions_report_${date_from}_${date_to}.pdf`

   return new Response(pdfBuffer, {
     headers: {
       'Content-Type': 'application/pdf',
       'Content-Disposition': `attachment; filename="${filename}"`,
     },
   })
   ```

5. **Data Fetching**:
   - Reuse commission data fetching from Task 2
   - Same database function or query
   - Same filtering and RLS enforcement
   - Consider extracting shared logic into helper function to avoid duplication

6. **Frontend Integration**:
   - Update commissions report page (from Task 1)
   - Add "Export PDF" button next to "Export CSV" button
   - Same pattern as CSV export:
     - Construct URL with format=pdf and filter params
     - Trigger download
     - Show loading state during generation
   - Button should be enabled only when report data is available

7. **Error Handling**:
   - Handle PDF rendering errors
   - Handle agency data not found
   - Handle logo loading failures (use fallback or skip logo)
   - Return appropriate error responses

8. **Performance Considerations**:
   - PDF generation can be slow for large reports
   - Consider adding timeout handling
   - Show "Generating PDF..." message to user
   - For very large reports, consider pagination or limiting

**Example API Route Structure**:
See story markdown Dev Notes section "PDF Generation in API Route" for complete example.

## Next Steps

After completing this task:

1. **Test PDF Export**:
   - Generate a commission report with filters
   - Click "Export PDF" button
   - Verify PDF downloads with correct filename
   - Open PDF and verify:
     - Professional formatting
     - Agency logo displays correctly
     - All commission data is present
     - Drill-down sections are included
     - Summary totals are correct
     - Page breaks work properly for multi-page reports
     - Footer with page numbers displays

2. **Test Edge Cases**:
   - Large report (many colleges/branches) → Verify pagination
   - Agency without logo → Verify PDF still generates
   - Empty report (no data) → Verify PDF generates with empty table
   - Different date ranges → Verify dates display correctly

3. **Update the manifest**:
   - Set Task 6 status to "Completed" with today's date
   - Add implementation notes (e.g., "Implemented PDF export API with agency branding")

4. **Verify Full Export Functionality**:
   - Both CSV and PDF exports working from same route
   - Both download with correct filenames
   - Both contain accurate data
   - Both respect filters (date range, city)

5. **Move to Task 7**:
   - Open file: `task-7-prompt.md`
   - Task 7 will add city grouping/filtering functionality
   - Copy and paste the contents into Claude Code Web

## Tips

- Test PDF generation locally before deploying
- Use renderToBuffer for server-side rendering (not renderToStream for Next.js)
- Handle agency logo gracefully if URL is null or image fails to load
- Consider caching agency data to reduce database queries
- Test PDF rendering with various data sizes
- Verify PDF quality when printed (for college partner submission)
- Use browser's "Save as PDF" to test without downloading
- Check console for any @react-pdf/renderer warnings
- Consider adding PDF generation progress indication for large reports
- Ensure proper error messages if PDF generation fails
