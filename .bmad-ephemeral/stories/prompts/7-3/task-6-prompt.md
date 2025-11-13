# Story 7-3: PDF Export Functionality - Task 6

**Story**: PDF Export Functionality
**Task**: Add Summary Totals Section
**Acceptance Criteria**: AC #4
**Previous Tasks**: Tasks 1-5 (API, Components, Logo, Metadata, Table) - Should be completed

## User Story Context

**As a** Agency Admin
**I want** to see summary totals at the end of my PDF report
**So that** I can quickly understand the overall financial picture without calculating manually

## Task Description

Implement a summary totals section that displays calculated metrics at the end of the PDF report. This section will show total records, total amounts, commission breakdowns, and outstanding amounts with professional styling and color coding.

## Subtasks Checklist

- [ ] Calculate summary metrics:
  - Total records: Count of payment plans
  - Total amount: Sum of total_amount
  - Total expected commission: Sum of expected_commission
  - Total earned commission: Sum of earned_commission
  - Outstanding commission: expected - earned
- [ ] Display summary in footer section:
  - Position below table on last page
  - Use bold font and larger size
  - Format currency with thousands separator
  - Visual separator (horizontal line) from table
- [ ] Style summary for emphasis:
  - Use shaded background box
  - Green color for earned amounts
  - Red/orange for outstanding amounts
- [ ] Test: Verify summary calculations match report data

## Acceptance Criteria

**AC #4**: And the PDF includes summary totals

## Context & Constraints

### Key Constraints
- **Professional Styling**: Use shaded backgrounds for summaries, green for earned amounts, red for outstanding
- **Accuracy**: Calculations must exactly match the sum of displayed data
- **Position**: Summary appears only on the last page after all table rows

### Dependencies

**Required:**
- Task 5 completed (Table formatting with data display)
- Task 2 completed (PDFReportFooter component exists)
- Access to full dataset for calculations

### Artifacts & References

**Code References:**
- `packages/ui/src/pdf/PDFReportFooter.tsx` - Implement summary display
- `packages/ui/src/pdf/pdf-styles.ts` - Add summary styling
- `packages/utils/src/pdf-exporter.ts` - Calculate summary metrics

## Update Manifest

Before starting implementation:
1. Open `.bmad-ephemeral/stories/prompts/7-3/manifest.md`
2. Update Task 5 status to "Completed" with completion date
3. Update Task 6 status to "In Progress" with start date
4. Add implementation notes from Task 5

## Implementation Guidelines

### Step 1: Calculate Summary Metrics

In `packages/utils/src/pdf-exporter.ts` or API route:

```typescript
interface SummaryMetrics {
  totalRecords: number;
  totalAmount: number;
  expectedCommission: number;
  earnedCommission: number;
  outstandingCommission: number;
}

function calculateSummary(data: PaymentPlan[]): SummaryMetrics {
  return {
    totalRecords: data.length,
    totalAmount: data.reduce((sum, plan) => sum + (plan.total_amount || 0), 0),
    expectedCommission: data.reduce((sum, plan) => sum + (plan.expected_commission || 0), 0),
    earnedCommission: data.reduce((sum, plan) => sum + (plan.earned_commission || 0), 0),
    outstandingCommission: data.reduce((sum, plan) =>
      sum + ((plan.expected_commission || 0) - (plan.earned_commission || 0)), 0
    ),
  };
}
```

### Step 2: Implement PDFReportFooter Component

Update `packages/ui/src/pdf/PDFReportFooter.tsx`:

```tsx
import { View, Text } from '@react-pdf/renderer';

interface PDFReportFooterProps {
  summary: SummaryMetrics;
}

export function PDFReportFooter({ summary }: PDFReportFooterProps) {
  return (
    <View style={styles.summaryContainer}>
      {/* Separator line */}
      <View style={styles.separator} />

      {/* Summary title */}
      <Text style={styles.summaryTitle}>Report Summary</Text>

      {/* Summary metrics grid */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Records:</Text>
          <Text style={styles.summaryValue}>{summary.totalRecords}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary.totalAmount)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Expected Commission:</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary.expectedCommission)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Earned Commission:</Text>
          <Text style={[styles.summaryValue, styles.earnedAmount]}>
            {formatCurrency(summary.earnedCommission)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Outstanding Commission:</Text>
          <Text style={[styles.summaryValue, styles.outstandingAmount]}>
            {formatCurrency(summary.outstandingCommission)}
          </Text>
        </View>
      </View>
    </View>
  );
}
```

### Step 3: Summary Styling

In `packages/ui/src/pdf/pdf-styles.ts`:

```typescript
const styles = StyleSheet.create({
  // ... existing styles

  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    border: '1px solid #ddd',
  },

  separator: {
    height: 2,
    backgroundColor: '#2196f3',
    marginBottom: 15,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },

  summaryGrid: {
    display: 'flex',
    flexDirection: 'column',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '1px solid #e0e0e0',
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#555',
  },

  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },

  earnedAmount: {
    color: '#4caf50', // Green for earned commission
  },

  outstandingAmount: {
    color: '#ff5722', // Red/orange for outstanding commission
  },
});
```

### Step 4: Integrate Summary with Pagination

Update the PDF Document to show summary only on last page:

```tsx
// In PDFReportDocument or API route rendering logic
const pages = paginateData(data, 30);
const summary = calculateSummary(data);

return (
  <Document>
    {pages.map((pageData, pageIndex) => (
      <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
        {/* Header (on all pages) */}
        <PDFReportHeader {...headerProps} />

        {/* Filters (on first page only) */}
        {pageIndex === 0 && <PDFFiltersSection filters={filters} />}

        {/* Table for this page */}
        <PDFReportTable data={pageData} columns={columns} />

        {/* Summary (on last page only) */}
        {pageIndex === pages.length - 1 && <PDFReportFooter summary={summary} />}

        {/* Page number */}
        <View style={styles.pageFooter} fixed>
          <Text>Page {pageIndex + 1} of {pages.length}</Text>
        </View>
      </Page>
    ))}
  </Document>
);
```

### Step 5: Currency Formatting

Ensure consistent currency formatting across the document:

```typescript
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  // Result: "$1,234.56"
}
```

### Step 6: Validation Logic

Add validation to ensure summary matches table data:

```typescript
function validateSummary(data: PaymentPlan[], summary: SummaryMetrics): boolean {
  const recalculated = calculateSummary(data);

  return (
    summary.totalRecords === recalculated.totalRecords &&
    Math.abs(summary.totalAmount - recalculated.totalAmount) < 0.01 &&
    Math.abs(summary.expectedCommission - recalculated.expectedCommission) < 0.01 &&
    Math.abs(summary.earnedCommission - recalculated.earnedCommission) < 0.01
  );
}

// Use in development/testing to catch calculation errors
if (!validateSummary(data, summary)) {
  console.error('Summary validation failed!');
}
```

## Implementation Notes

### What Was Completed in Previous Tasks
- Task 1: API route
- Task 2: Component structure (PDFReportFooter skeleton)
- Task 3: Logo integration
- Task 4: Metadata and filters
- Task 5: Data table with pagination

### How This Task Builds On Previous Work
- Completes the PDFReportFooter component from Task 2
- Uses the same data from table (Task 5) for calculations
- Appears on last page after all table rows (pagination from Task 5)

### Key Technical Decisions

**Color Coding**:
- Green (#4caf50) for earned commission - positive indicator
- Red/Orange (#ff5722) for outstanding commission - attention needed
- Neutral colors for other metrics

**Position**:
- Summary on last page only (not repeated on every page)
- Below table data with visual separator

**Calculations**:
- Use reduce() for sum calculations
- Handle null/undefined values gracefully
- Round to 2 decimal places for currency

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 6 as "Completed" with date
2. Add notes about summary calculations and styling
3. Move to `task-7-prompt.md` to add export button to report UI
4. Task 7 will create the user-facing button to trigger PDF generation

## Testing Checklist

- [ ] Summary displays on last page only
- [ ] Total records count matches data length
- [ ] Total amount calculation correct
- [ ] Expected commission calculation correct
- [ ] Earned commission calculation correct
- [ ] Outstanding commission = expected - earned
- [ ] Currency values formatted with $ and thousands separator
- [ ] Earned commission displays in green
- [ ] Outstanding commission displays in red/orange
- [ ] Summary box has shaded background
- [ ] Visual separator line above summary
- [ ] Summary title displays: "Report Summary"
- [ ] All summary values bold and properly sized
- [ ] Test with 0 records (summary shows zeros)
- [ ] Test with negative outstanding (if applicable)
- [ ] Validation logic catches calculation errors
