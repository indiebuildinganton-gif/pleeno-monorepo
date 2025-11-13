# Story 7-4: Commission Report by College - Task 5

## Story Context

**As an** Agency Admin
**I want** to generate commission reports grouped by college/branch with location details
**So that** I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions

## Task 5: Create Professional PDF Template for Commissions

**Acceptance Criteria**: #6

**Previous Tasks**:
- Task 1 - Created report page UI
- Task 2 - Implemented commission data API
- Task 3 - Created table display component
- Task 4 - Added CSV export functionality

### Task Description

Create a professional PDF template using `@react-pdf/renderer` that is formatted for submission to college partners.

### Subtasks Checklist

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

## Context

### Relevant Acceptance Criteria

6. **And** the PDF version is formatted for submission to college partners (clean, professional)

### Key Constraints

- **Professional PDF Formatting**: Use `@react-pdf/renderer` with agency logo, clean typography, proper page breaks. PDF must be submission-quality for college partners.
- **File Naming Convention**: `commissions_report_YYYY-MM-DD.pdf` with timestamp

### Component Interface

The PDF component will receive the same data structure as the table component:

```typescript
interface CommissionReportPDFProps {
  data: CommissionRow[];
  summary: CommissionSummary;
  filters: {
    date_from: string;
    date_to: string;
    city?: string;
  };
  agencyLogo?: string;
  agencyName: string;
}
```

### Dependencies

- `@react-pdf/renderer` (^4.3.1) - PDF generation from React components for professional commission reports
- `date-fns` (^4.1.0) - Date formatting

### Reference Documentation

- Context File: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
- Story Dev Notes: See "PDF Template Implementation" section with complete example code
- `@react-pdf/renderer` docs: https://react-pdf.org/

## Manifest Update Instructions

Before starting implementation:

1. **Read the manifest**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`
2. **Update Task 4**:
   - Status: Completed
   - Completed: [Today's Date]
   - Notes: [Add notes from Task 4, e.g., "Implemented CSV export with Excel compatibility"]
3. **Update Task 5**:
   - Status: In Progress
   - Started: [Today's Date]

## Implementation Notes

**Building on Previous Tasks**: This task creates the PDF template component. Task 6 will wire it up to an API route for downloads.

**Key Implementation Points**:

1. **File Location**:
   - Create `apps/reports/app/components/CommissionReportPDF.tsx`
   - This is a React component using @react-pdf/renderer primitives
   - Does NOT render in normal React - only for PDF generation

2. **@react-pdf/renderer Basics**:
   - Import: `Document, Page, Text, View, Image, StyleSheet` from '@react-pdf/renderer'
   - `Document` wraps entire PDF
   - `Page` represents each page (size="A4")
   - `View` is like a div
   - `Text` renders text (all text must be in Text components)
   - `StyleSheet.create()` for styles (subset of CSS)

3. **PDF Structure**:
   ```typescript
   <Document>
     <Page size="A4" style={styles.page}>
       {/* Header with logo and title */}
       {/* Table header */}
       {/* Grouped commission data */}
       {/* Summary section */}
       {/* Footer */}
     </Page>
   </Document>
   ```

4. **Header Section**:
   - Use flexDirection: 'row' for side-by-side layout
   - Left side: Agency logo (if available) + title
   - Right side: Date range and generation date
   - Add bottom border for separation

5. **Table Layout**:
   - Use View with flexDirection: 'row' for each table row
   - College headers: Blue background, bold text, full width
   - Branch rows: Normal styling, columns with flex: 1
   - Column alignment: Text amounts right-aligned

6. **Styling Best Practices**:
   - Use Helvetica font (built-in, professional)
   - Font sizes: 18pt for title, 10-12pt for body, 8pt for footer
   - Colors: Use hex codes (#e6f3ff for headers, #333 for text)
   - Spacing: Consistent padding and margins
   - Border: Use borderBottom for row separation

7. **Page Breaks**:
   - @react-pdf/renderer handles automatically for most cases
   - Use `break` style property if needed to force breaks
   - Test with large datasets to ensure proper pagination

8. **Drill-Down Section**:
   - Add after each branch's main row
   - Subheading: "Payment Plans for [Branch Name]"
   - Nested table with student details
   - Use smaller font size (9-10pt)
   - Indent for visual hierarchy

9. **Summary Section**:
   - Place at end before footer
   - Use View with border and background color
   - Three rows: Total Paid, Total Earned, Total Outstanding
   - Bold labels, right-aligned amounts

10. **Footer**:
    - Position: absolute, bottom of page
    - Center-aligned text
    - Page numbers and agency name
    - Small font size (8pt)

11. **Currency and Date Formatting**:
    - Create or reuse `formatCurrency()` helper for amounts
    - Use `formatDate()` from date-fns for dates
    - Ensure consistent formatting throughout

**Complete Example Code**:
See the story markdown Dev Notes section "PDF Template Implementation" for a full working example.

## Next Steps

After completing this task:

1. **Test PDF Rendering**:
   - You cannot test the actual PDF download yet (that's Task 6)
   - But you can verify the component compiles without errors
   - Check TypeScript types are correct
   - Verify imports are working

2. **Update the manifest**:
   - Set Task 5 status to "Completed" with today's date
   - Add implementation notes (e.g., "Created professional PDF template with agency logo and grouped layout")

3. **Code Review**:
   - Verify styling matches professional standards
   - Check for proper spacing and alignment
   - Ensure all data fields are included
   - Verify colors and typography are clean

4. **Move to Task 6**:
   - Open file: `task-6-prompt.md`
   - Task 6 will create the API route that uses this template to generate PDFs
   - Copy and paste the contents into Claude Code Web

## Tips

- Install @react-pdf/renderer if not already: `npm install @react-pdf/renderer`
- @react-pdf/renderer uses a subset of CSS - not all properties are supported
- Use View for layout, not HTML divs
- All text must be wrapped in Text components
- Images need to be base64 or public URLs
- Test styles incrementally - some CSS properties work differently
- Use StyleSheet.create() for better performance
- Consider creating a separate styles object at the bottom of the file
- Reference the @react-pdf/renderer documentation for supported CSS properties
- The component won't render in browser - only server-side for PDF generation
