# Story 7-3: PDF Export Functionality - Task 2

**Story**: PDF Export Functionality
**Task**: Create PDF Template with React Components
**Acceptance Criteria**: AC #2, 3, 4
**Previous Task**: Task 1 (Create PDF Export API Route) - Should be completed

## User Story Context

**As a** Agency Admin
**I want** to export reports to PDF format
**So that** I can share professional-looking reports with stakeholders or college partners

## Task Description

Design and implement React-PDF components that provide a professional, well-formatted PDF template for payment plan reports. These components will include header, filters, data table, and footer sections.

## Subtasks Checklist

- [ ] Design PDF template structure:
  - Header section: Agency logo, report title, generation date
  - Filters section: Display applied filters
  - Data table: Formatted report data
  - Footer section: Summary totals, page numbers
- [ ] Create React PDF components in `packages/ui/src/pdf/`:
  - `PDFReportHeader.tsx`: Agency branding and metadata
  - `PDFFiltersSection.tsx`: Display applied filters
  - `PDFReportTable.tsx`: Formatted table with headers and data rows
  - `PDFReportFooter.tsx`: Summary totals and pagination
- [ ] Create `pdf-styles.ts` with StyleSheet for PDF components
- [ ] Format currency amounts: Display with currency symbol and thousand separators
- [ ] Format dates: Display in user-friendly format (e.g., "Nov 10, 2025")
- [ ] Test: Generate sample PDF and verify formatting

## Acceptance Criteria

**AC #2**: And the PDF includes: agency logo/name, report title, generation date, filters applied

**AC #3**: And the PDF includes a formatted table with the report data

**AC #4**: And the PDF includes summary totals

## Context & Constraints

### Key Constraints
- **Professional Styling**: Use consistent branding, proper typography, shaded backgrounds for summaries, green for earned amounts, red for outstanding
- **Landscape Orientation**: Use for wide tables with many columns
- **Performance**: Consider caching PDF generation for 5 minutes (same filters), monitor memory usage for large reports

### Relevant Interfaces

**React-PDF StyleSheet API**
- Path: `packages/ui/src/pdf/pdf-styles.ts`
- Signature: `import { StyleSheet } from '@react-pdf/renderer'; const styles = StyleSheet.create({ ... })`
- Description: StyleSheet.create() for defining PDF styles. Supports subset of CSS properties (flexbox, margins, padding, colors, fonts, borders).

**renderToStream**
- Package: `@react-pdf/renderer`
- Signature: `async function renderToStream(element: ReactElement): Promise<NodeJS.ReadableStream>`
- Description: Renders React-PDF Document component to Node.js stream for HTTP response.

### Dependencies

**Required NPM Packages:**
- `@react-pdf/renderer` (^4.3.1) - Already installed in Task 1
- `date-fns` (^4.1.0) - Date formatting
- `date-fns-tz` (latest) - Timezone support for Brisbane time

### Artifacts & References

**Documentation:**
- `docs/architecture.md` - Reporting Zone architecture
- PDF template components location: `packages/ui/src/pdf/`

**Code Structure:**
```
packages/ui/
├── src/
│   └── pdf/
│       ├── PDFReportDocument.tsx      # Main document wrapper
│       ├── PDFReportHeader.tsx        # Agency branding header
│       ├── PDFFiltersSection.tsx      # Applied filters display
│       ├── PDFReportTable.tsx         # Data table with pagination
│       ├── PDFReportFooter.tsx        # Summary totals footer
│       └── pdf-styles.ts              # PDF stylesheet
```

## Update Manifest

Before starting implementation:
1. Open `.bmad-ephemeral/stories/prompts/7-3/manifest.md`
2. Update Task 1 status to "Completed" with completion date
3. Update Task 2 status to "In Progress" with start date
4. Add any implementation notes from Task 1

## Implementation Guidelines

### Component Structure

**PDFReportDocument.tsx** - Main wrapper
```tsx
import { Document, Page, View } from '@react-pdf/renderer';
import { PDFReportHeader } from './PDFReportHeader';
import { PDFFiltersSection } from './PDFFiltersSection';
import { PDFReportTable } from './PDFReportTable';
import { PDFReportFooter } from './PDFReportFooter';

interface PDFReportDocumentProps {
  agency: { name: string; logo_url?: string; contact_email?: string };
  reportTitle: string;
  generatedAt: Date;
  filters: Record<string, any>;
  data: any[];
  columns: string[];
  summary: {
    totalRecords: number;
    totalAmount: number;
    expectedCommission: number;
    earnedCommission: number;
    outstandingCommission: number;
  };
}
```

**pdf-styles.ts** - StyleSheet definitions
- Header styles: branding, titles, metadata
- Filter section: labels and values
- Table styles: headers, rows, alternating colors
- Footer styles: summary box, totals
- Color scheme: Primary brand colors, green for earned, red/orange for outstanding

### Formatting Utilities

Create helper functions for:
- **Currency**: `$1,234.56` format with thousand separators
- **Dates**: "Nov 10, 2025" format using date-fns
- **Status badges**: Color-coded status indicators

### Testing Approach

1. Create a mock data fixture with sample payment plans
2. Generate PDF with mock data
3. Verify all sections render correctly
4. Check formatting of currency and dates
5. Verify colors and styling match design

## Implementation Notes

### What Was Completed in Task 1
- API route created and accepting format=pdf parameter
- Basic PDF generation flow established
- Dependencies installed (@react-pdf/renderer)

### How This Task Builds On Previous Work
- These components will be imported and used by the API route
- The route will pass data to these components for rendering
- Components must return React-PDF elements (not regular React components)

### Key Dependencies
- Task 1 must be complete (API route exists)
- `@react-pdf/renderer` must be installed
- Understanding of React-PDF's component API

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 2 as "Completed" with date
2. Add notes about component structure and styling decisions
3. Move to `task-3-prompt.md` to implement agency logo upload functionality
4. The logo upload in Task 3 will provide the logo_url used in PDFReportHeader

## Testing Checklist

- [ ] PDFReportHeader renders with agency name and placeholder for logo
- [ ] PDFFiltersSection displays filter labels and values
- [ ] PDFReportTable renders headers and data rows with proper formatting
- [ ] PDFReportFooter displays summary totals
- [ ] Currency values formatted correctly: $1,234.56
- [ ] Dates formatted correctly: Nov 10, 2025
- [ ] StyleSheet applied correctly - no styling errors
- [ ] Generate sample PDF successfully without errors
