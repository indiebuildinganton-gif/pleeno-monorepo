# Story 7-3: PDF Export Functionality - Task 7

**Story**: PDF Export Functionality
**Task**: Add Export Button to Report UI
**Acceptance Criteria**: AC #1
**Previous Tasks**: Tasks 1-6 (API, Components, Logo, Metadata, Table, Summary) - Should be completed

## User Story Context

**As a** Agency Admin
**I want** a clear button to export my report to PDF
**So that** I can easily download formatted reports for sharing

## Task Description

Add a user-facing "Export to PDF" button to the report builder page that triggers the PDF generation API and handles the download flow with proper loading states and error handling.

## Subtasks Checklist

- [ ] Add "Export to PDF" button to report builder page:
  - Location: Next to "Export CSV" button
  - Icon: Download icon (↓) or PDF icon
  - Label: "Export PDF"
- [ ] Trigger API call with current filters and columns
- [ ] Show loading spinner while PDF generates
- [ ] Handle errors gracefully:
  - Show toast notification if export fails
  - Display error message with retry option
- [ ] Test: Click button → PDF downloads with correct data

## Acceptance Criteria

**AC #1**: Given I have generated a report, When I click "Export to PDF", Then a PDF file is downloaded with formatted report data

## Context & Constraints

### Key Constraints
- **User Experience**: Show loading state during PDF generation (may take 2-5 seconds)
- **Error Handling**: Clear error messages if export fails
- **Context Preservation**: Use current report filters and column selections

### Dependencies

**Required:**
- Task 1 completed (API route exists and functional)
- Tasks 2-6 completed (PDF generation works end-to-end)
- Report builder page location (likely `apps/reports/app/reports/payment-plans/page.tsx`)
- Access to current filter state and column selection

### Artifacts & References

**Code References:**
- Report builder page - add export button
- API route: `GET /api/reports/payment-plans/export?format=pdf`

## Update Manifest

Before starting implementation:
1. Open `.bmad-ephemeral/stories/prompts/7-3/manifest.md`
2. Update Task 6 status to "Completed" with completion date
3. Update Task 7 status to "In Progress" with start date
4. Add implementation notes from Task 6

## Implementation Guidelines

### Step 1: Locate Report Builder Page

Find the report builder/viewer page (likely one of these):
- `apps/reports/app/reports/payment-plans/page.tsx`
- `apps/reports/app/reports/page.tsx`
- `apps/reports/app/page.tsx`

Look for existing "Export CSV" button to add PDF button next to it.

### Step 2: Add Export PDF Button Component

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExportPDFButtonProps {
  filters: ReportFilters;
  columns: string[];
  disabled?: boolean;
}

export function ExportPDFButton({ filters, columns, disabled }: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Build query string from filters and columns
      const params = new URLSearchParams({
        format: 'pdf',
        ...filters,
        columns: columns.join(','),
      });

      // Fetch PDF from API
      const response = await fetch(`/api/reports/payment-plans/export?${params}`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get PDF blob
      const blob = await response.blob();

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `payment_plans_${Date.now()}.pdf`;

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export successful',
        description: `PDF report downloaded: ${filename}`,
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting}
      variant="outline"
    >
      {isExporting ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}
```

### Step 3: Integrate Button into Report Page

In the report builder page:

```tsx
import { ExportPDFButton } from '@/components/reports/ExportPDFButton';
import { ExportCSVButton } from '@/components/reports/ExportCSVButton'; // Existing

export default function PaymentPlansReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [reportData, setReportData] = useState([]);

  return (
    <div>
      {/* Report filters and controls */}
      <div className="mb-4">
        {/* ... filter components ... */}
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mb-4">
        <ExportCSVButton
          filters={filters}
          columns={selectedColumns}
          disabled={!reportData.length}
        />
        <ExportPDFButton
          filters={filters}
          columns={selectedColumns}
          disabled={!reportData.length}
        />
      </div>

      {/* Report table/data display */}
      <div>
        {/* ... report data ... */}
      </div>
    </div>
  );
}
```

### Step 4: Filter and Column Serialization

Ensure filters are properly serialized for URL params:

```typescript
function serializeFilters(filters: ReportFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.college_id) params.college_id = filters.college_id;
  if (filters.branch_id) params.branch_id = filters.branch_id;
  if (filters.student_id) params.student_id = filters.student_id;

  if (filters.status && filters.status.length > 0) {
    filters.status.forEach((status, idx) => {
      params[`status[${idx}]`] = status;
    });
  }

  if (filters.contract_expiration_from) {
    params.contract_expiration_from = filters.contract_expiration_from;
  }
  if (filters.contract_expiration_to) {
    params.contract_expiration_to = filters.contract_expiration_to;
  }

  return params;
}
```

### Step 5: Loading and Error States

Enhance UX with clear feedback:

**Loading States**:
- Spinner icon during export
- Disable button during export
- Change button text to "Generating PDF..."
- Optional: Show progress toast notification

**Error States**:
- Toast notification with error message
- Log detailed error to console
- Retry option in error message
- Handle specific error cases:
  - Network errors
  - API errors (400, 500)
  - Timeout errors
  - Large file warnings

### Step 6: Accessibility

Ensure button is accessible:

```tsx
<Button
  onClick={handleExport}
  disabled={disabled || isExporting}
  aria-label="Export report to PDF"
  aria-busy={isExporting}
>
  {/* ... button content ... */}
</Button>
```

## Implementation Notes

### What Was Completed in Previous Tasks
- Tasks 1-6: Complete PDF generation pipeline from API to rendering
- API route accepts filters and generates PDF
- All PDF components implemented and tested

### How This Task Builds On Previous Work
- Provides user interface to trigger the API from Task 1
- Uses the complete PDF generation pipeline from Tasks 2-6
- Completes the user journey: UI → API → PDF → Download

### Key Technical Decisions

**Download Approach**:
- Blob + createObjectURL method (client-side download)
- Alternative: Server triggers download via Content-Disposition header

**Loading State**:
- Show inline spinner in button (better UX than modal)
- Keep button disabled during export to prevent multiple clicks

**Error Handling**:
- Toast notifications for user-friendly feedback
- Console errors for debugging
- Specific error messages based on error type

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 7 as "Completed" with date
2. Add notes about button placement and user experience
3. Move to `task-8-prompt.md` to implement export tracking
4. Task 8 will add activity logging for audit trail

## Testing Checklist

- [ ] Button appears next to "Export CSV" button
- [ ] Button displays PDF icon or download icon
- [ ] Button label reads "Export PDF"
- [ ] Button disabled when no report data
- [ ] Click button triggers API call with correct filters
- [ ] Loading spinner shows during export
- [ ] Button text changes to "Generating PDF..." during export
- [ ] Button disabled during export (prevents double-click)
- [ ] PDF downloads successfully on completion
- [ ] Downloaded file has correct filename with timestamp
- [ ] Toast notification shows on success
- [ ] Toast notification shows on error
- [ ] Error message is clear and helpful
- [ ] Console logs detailed error for debugging
- [ ] Button re-enables after export completes or fails
- [ ] Test with various filter combinations
- [ ] Test with different column selections
- [ ] Test with network failure (offline mode)
- [ ] Test accessibility with keyboard navigation
- [ ] Test with screen reader
