# Story 7-3: PDF Export Functionality - Task 5

**Story**: PDF Export Functionality
**Task**: Format Data Table with Pagination
**Acceptance Criteria**: AC #3, 5
**Previous Tasks**: Tasks 1-4 (API, Components, Logo, Metadata) - Should be completed

## User Story Context

**As a** Agency Admin
**I want** to see well-formatted payment plan data in my PDF exports with automatic pagination
**So that** large reports are readable and professionally presented

## Task Description

Implement a professional data table component with proper formatting, column headers, alternating row colors, and automatic pagination for large datasets. Handle edge cases like wide tables and long text values.

## Subtasks Checklist

- [ ] Create responsive table layout:
  - Column headers with background shading
  - Alternating row colors for readability
  - Proper column widths based on content
  - Text wrapping for long values
- [ ] Format table data:
  - Currency columns: Right-aligned, formatted with symbol and separators
  - Date columns: Formatted as "Nov 10, 2025"
  - Status columns: Badge-style formatting with colors
  - Text columns: Left-aligned, truncate if too long
- [ ] Implement pagination:
  - Max 30 rows per page (adjust based on content density)
  - Repeat table headers on each page
  - Page numbers in footer: "Page 1 of 5"
  - Automatic page breaks when content overflows
- [ ] Handle edge cases:
  - Wide tables: Adjust font size or orientation (landscape)
  - Many columns: Select most important columns only
  - Long text values: Truncate with ellipsis
- [ ] Test: Generate PDF with 100+ rows → Verify pagination works

## Acceptance Criteria

**AC #3**: And the PDF includes a formatted table with the report data

**AC #5**: And the PDF has proper page breaks for large reports

## Context & Constraints

### Key Constraints
- **Pagination**: Max 30 rows per page for PDF reports, automatic page breaks
- **Professional Styling**: Use consistent branding, proper typography, shaded backgrounds for summaries
- **Landscape Orientation**: Use for wide tables with many columns
- **Performance**: Monitor memory usage for large reports

### Relevant Interfaces

**React-PDF Table Components**
- Package: `@react-pdf/renderer`
- Components: `View`, `Text` (no native Table element)
- Layout: Use flexbox for table structure

### Dependencies

**Required:**
- Task 2 completed (PDFReportTable component structure exists)
- Understanding of React-PDF flexbox layout
- Sample payment plan data for testing

### Artifacts & References

**Code References:**
- `packages/ui/src/pdf/PDFReportTable.tsx` - Implement table and pagination logic
- `packages/ui/src/pdf/pdf-styles.ts` - Add table styling

## Update Manifest

Before starting implementation:
1. Open `.bmad-ephemeral/stories/prompts/7-3/manifest.md`
2. Update Task 4 status to "Completed" with completion date
3. Update Task 5 status to "In Progress" with start date
4. Add implementation notes from Task 4

## Implementation Guidelines

### Step 1: Table Structure with React-PDF

React-PDF doesn't have native table elements. Build table using flexbox:

```tsx
import { View, Text } from '@react-pdf/renderer';

interface PDFReportTableProps {
  data: PaymentPlan[];
  columns: string[];
  pageSize?: number; // Default: 30 rows per page
}

// Table structure:
// <View style={styles.table}>
//   <View style={styles.tableHeader}>
//     {columns.map(col => <Text style={styles.headerCell}>{col}</Text>)}
//   </View>
//   {data.map((row, idx) => (
//     <View style={styles.tableRow} key={idx}>
//       {columns.map(col => <Text style={styles.cell}>{formatCell(row, col)}</Text>)}
//     </View>
//   ))}
// </View>
```

### Step 2: Column Formatting Logic

Create formatting utilities for different column types:

```typescript
// Currency formatting
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
  // Result: "$1,234.56"
}

// Date formatting
function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy');
  // Result: "Nov 10, 2025"
}

// Status formatting (text only, colors applied via styles)
function formatStatus(status: string): string {
  const statusMap = {
    'active': 'Active',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'cancelled': 'Cancelled',
  };
  return statusMap[status] || status;
}

// Text truncation
function truncateText(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Cell formatter dispatcher
function formatCell(row: PaymentPlan, columnKey: string): string {
  const value = row[columnKey];

  // Currency columns
  if (['total_amount', 'expected_commission', 'earned_commission'].includes(columnKey)) {
    return formatCurrency(value);
  }

  // Date columns
  if (['start_date', 'end_date', 'contract_expiration'].includes(columnKey)) {
    return formatDate(value);
  }

  // Status columns
  if (columnKey === 'status') {
    return formatStatus(value);
  }

  // Text columns
  return truncateText(String(value || ''));
}
```

### Step 3: Pagination Logic

Implement automatic pagination with repeated headers:

```tsx
function paginateData<T>(data: T[], pageSize: number = 30): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < data.length; i += pageSize) {
    pages.push(data.slice(i, i + pageSize));
  }
  return pages;
}

// In component:
const pages = paginateData(data, 30);

return (
  <Document>
    {pages.map((pageData, pageIndex) => (
      <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
        {/* Page header with table headers */}
        <View style={styles.tableHeader}>
          {columns.map(col => <Text key={col} style={styles.headerCell}>{col}</Text>)}
        </View>

        {/* Page data rows */}
        {pageData.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.tableRow}>
            {columns.map(col => <Text key={col} style={styles.cell}>{formatCell(row, col)}</Text>)}
          </View>
        ))}

        {/* Page footer with page numbers */}
        <View style={styles.pageFooter} fixed>
          <Text>Page {pageIndex + 1} of {pages.length}</Text>
        </View>
      </Page>
    ))}
  </Document>
);
```

### Step 4: Table Styling

In `packages/ui/src/pdf/pdf-styles.ts`:

```typescript
const styles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196f3',
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    fontSize: 9,
    borderBottom: '1px solid #ddd',
  },
  tableRowAlt: {
    backgroundColor: '#f5f5f5', // Alternating row color
  },
  cell: {
    flex: 1,
    textAlign: 'left',
  },
  cellRight: {
    flex: 1,
    textAlign: 'right', // For currency columns
  },
  cellCenter: {
    flex: 1,
    textAlign: 'center', // For status columns
  },
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
});
```

### Step 5: Edge Case Handling

**Wide Tables (many columns)**:
- Use landscape orientation: `<Page orientation="landscape">`
- Reduce font size: 8px instead of 9px
- Prioritize important columns if too wide

**Long Text Values**:
- Truncate with ellipsis after 30 characters
- Consider tooltip-style full text in separate section

**Empty Data**:
- Show headers only with message "No data available"

**Large Datasets (1000+ rows)**:
- Consider performance implications
- May need to warn user about large exports
- Test memory usage

## Implementation Notes

### What Was Completed in Previous Tasks
- Task 1: API route
- Task 2: Component structure (PDFReportTable skeleton)
- Task 3: Logo integration
- Task 4: Metadata and filters display

### How This Task Builds On Previous Work
- Implements the core content area (table) of the PDF
- Uses formatting utilities similar to filters section
- Integrates with pagination system for multi-page reports

### Key Technical Decisions

**Pagination Strategy**:
- 30 rows per page (configurable)
- Repeat headers on each page for readability
- Page numbers in footer

**Layout Choice**:
- Landscape orientation for payment plan reports (many columns)
- Flexbox-based table (React-PDF doesn't have native table element)

**Performance Considerations**:
- Split large datasets into pages to avoid memory issues
- Consider rendering performance for 100+ page documents

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 5 as "Completed" with date
2. Add notes about table formatting and pagination decisions
3. Move to `task-6-prompt.md` to implement summary totals section
4. Task 6 will add the footer with calculated metrics

## Testing Checklist

- [ ] Table headers display with blue background
- [ ] Alternating row colors (white, light gray)
- [ ] Currency columns formatted correctly: $1,234.56
- [ ] Currency columns right-aligned
- [ ] Date columns formatted correctly: Nov 10, 2025
- [ ] Status columns display with proper labels
- [ ] Text columns truncate long values with ellipsis
- [ ] Pagination works with 30 rows per page
- [ ] Table headers repeat on each page
- [ ] Page numbers display correctly: "Page 1 of 5"
- [ ] Test with 10 rows (single page)
- [ ] Test with 100 rows (multiple pages)
- [ ] Test with 1000 rows (performance check)
- [ ] Landscape orientation applied
- [ ] Wide tables fit on page without overflow
