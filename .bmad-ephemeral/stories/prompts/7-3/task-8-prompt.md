# Story 7-3: PDF Export Functionality - Task 8

**Story**: PDF Export Functionality
**Task**: Add Export Tracking
**Acceptance Criteria**: AC #1
**Previous Tasks**: Tasks 1-7 (All core functionality) - Should be completed

## User Story Context

**As a** System Administrator
**I want** to track all PDF export activities
**So that** I can audit usage, monitor performance, and understand reporting patterns

## Task Description

Implement activity logging for PDF exports to track who exported what, when, and with what parameters. This provides an audit trail and usage analytics for the reporting system.

## Subtasks Checklist

- [ ] Log export events to activity_log table:
  - `entity_type: 'report'`
  - `action: 'exported'`
  - `description: "{{user}} exported {{report_type}} report to PDF ({{row_count}} rows, {{page_count}} pages)"`
  - `metadata: { report_type, format: 'pdf', row_count, page_count, filters }`
- [ ] Track export in user activity feed
- [ ] Monitor PDF generation performance (time taken)
- [ ] Test: Verify export activity appears in recent activity feed

## Acceptance Criteria

**AC #1**: Given I have generated a report, When I click "Export to PDF", Then a PDF file is downloaded with formatted report data (and the activity is logged)

## Context & Constraints

### Key Constraints
- **Export Tracking**: Log all PDF exports to activity_log table with row count, page count, and filters applied
- **Performance Monitoring**: Track PDF generation time for optimization insights
- **Privacy**: Don't log sensitive filter values (student names, etc.) - use IDs only

### Dependencies

**Required:**
- Task 1 completed (API route exists)
- Activity log table exists in database
- Activity feed component for displaying logs

### Artifacts & References

**Database Schema:**
```sql
-- activity_log table structure (should already exist)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  agency_id UUID REFERENCES agencies(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Update Manifest

Before starting implementation:
1. Open `.bmad-ephemeral/stories/prompts/7-3/manifest.md`
2. Update Task 7 status to "Completed" with completion date
3. Update Task 8 status to "In Progress" with start date
4. Add implementation notes from Task 7

## Implementation Guidelines

### Step 1: Create Activity Logging Utility

Create a utility function for logging exports:

```typescript
// packages/utils/src/activity-logger.ts

interface ExportActivityLog {
  userId: string;
  agencyId: string;
  reportType: string;
  format: 'pdf' | 'csv';
  rowCount: number;
  pageCount?: number;
  filters: Record<string, any>;
  durationMs: number;
}

export async function logExportActivity(
  supabase: SupabaseClient,
  log: ExportActivityLog
): Promise<void> {
  const { userId, agencyId, reportType, format, rowCount, pageCount, filters, durationMs } = log;

  // Build description
  const description = format === 'pdf'
    ? `Exported ${reportType} report to PDF (${rowCount} rows, ${pageCount} pages)`
    : `Exported ${reportType} report to CSV (${rowCount} rows)`;

  // Sanitize filters - remove sensitive data, keep only IDs
  const sanitizedFilters = {
    date_from: filters.date_from,
    date_to: filters.date_to,
    college_id: filters.college_id,
    branch_id: filters.branch_id,
    student_id: filters.student_id,
    status: filters.status,
    contract_expiration_from: filters.contract_expiration_from,
    contract_expiration_to: filters.contract_expiration_to,
  };

  // Metadata
  const metadata = {
    report_type: reportType,
    format,
    row_count: rowCount,
    page_count: pageCount,
    filters: sanitizedFilters,
    duration_ms: durationMs,
    exported_at: new Date().toISOString(),
  };

  // Insert activity log
  const { error } = await supabase
    .from('activity_log')
    .insert({
      user_id: userId,
      agency_id: agencyId,
      entity_type: 'report',
      action: 'exported',
      description,
      metadata,
    });

  if (error) {
    console.error('Failed to log export activity:', error);
    // Don't throw - logging failure shouldn't break export
  }
}
```

### Step 2: Integrate Logging in API Route

Update `apps/reports/app/api/reports/payment-plans/export/route.ts`:

```typescript
import { logExportActivity } from '@/utils/activity-logger';

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Get user and agency from session
    const user = await getCurrentUser();
    const agencyId = user.agency_id;

    // Parse filters from query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const filters = parseFilters(searchParams);

    // Query payment plans
    const data = await queryPaymentPlans(supabase, agencyId, filters);

    // Generate PDF or CSV
    if (format === 'pdf') {
      const pages = paginateData(data, 30);
      const pdfStream = await generatePDF({
        data,
        filters,
        agencyId,
        userId: user.id,
      });

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // Log activity (async, don't await to avoid delaying response)
      logExportActivity(supabase, {
        userId: user.id,
        agencyId,
        reportType: 'payment_plans',
        format: 'pdf',
        rowCount: data.length,
        pageCount: pages.length,
        filters,
        durationMs,
      }).catch(err => console.error('Activity logging failed:', err));

      // Return PDF
      return new Response(pdfStream, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="payment_plans_${timestamp}.pdf"`,
        },
      });
    }

    // ... CSV export logic ...

  } catch (error) {
    console.error('Export failed:', error);
    return new Response('Export failed', { status: 500 });
  }
}
```

### Step 3: Performance Monitoring

Add performance metrics to metadata:

```typescript
// Track key performance indicators
const performanceMetrics = {
  query_time_ms: queryEndTime - queryStartTime,
  render_time_ms: renderEndTime - renderStartTime,
  total_time_ms: Date.now() - startTime,
  row_count: data.length,
  page_count: pages.length,
  file_size_bytes: pdfBuffer.length,
};

// Include in activity log metadata
metadata.performance = performanceMetrics;
```

### Step 4: Activity Feed Display

If there's an activity feed component, ensure it displays export activities:

```tsx
// components/activity-feed.tsx

function ActivityFeedItem({ activity }: { activity: ActivityLog }) {
  if (activity.entity_type === 'report' && activity.action === 'exported') {
    const meta = activity.metadata;
    return (
      <div className="activity-item">
        <FileText className="icon" />
        <div>
          <p className="description">{activity.description}</p>
          <p className="meta">
            {meta.format.toUpperCase()} • {meta.row_count} rows
            {meta.page_count && ` • ${meta.page_count} pages`}
            • {formatDuration(meta.duration_ms)}
          </p>
          <p className="timestamp">{formatTimestamp(activity.created_at)}</p>
        </div>
      </div>
    );
  }

  // ... other activity types ...
}
```

### Step 5: Analytics Queries

Create queries to analyze export patterns:

```sql
-- Most exported reports
SELECT
  metadata->>'report_type' as report_type,
  COUNT(*) as export_count
FROM activity_log
WHERE entity_type = 'report' AND action = 'exported'
GROUP BY metadata->>'report_type'
ORDER BY export_count DESC;

-- Average export performance
SELECT
  metadata->>'format' as format,
  AVG((metadata->>'duration_ms')::int) as avg_duration_ms,
  AVG((metadata->>'row_count')::int) as avg_row_count
FROM activity_log
WHERE entity_type = 'report' AND action = 'exported'
GROUP BY metadata->>'format';

-- Recent exports by user
SELECT
  u.name,
  al.description,
  al.created_at
FROM activity_log al
JOIN users u ON al.user_id = u.id
WHERE al.entity_type = 'report' AND al.action = 'exported'
ORDER BY al.created_at DESC
LIMIT 50;
```

## Implementation Notes

### What Was Completed in Previous Tasks
- Tasks 1-7: Complete PDF export functionality from API to UI
- Export button triggers PDF generation and download
- All acceptance criteria for PDF content met

### How This Task Builds On Previous Work
- Adds audit trail to existing export functionality
- Enables performance monitoring for optimization
- Provides usage insights for product decisions

### Key Technical Decisions

**Async Logging**:
- Don't await logging to avoid delaying PDF response
- Log failures shouldn't break export functionality

**Privacy Considerations**:
- Store filter IDs, not names (student_id not student name)
- Avoid logging sensitive data in description or metadata

**Performance Tracking**:
- Measure total duration, query time, render time
- Track file size for bandwidth insights

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 8 as "Completed" with date
2. Add notes about activity logging implementation
3. Move to `task-9-prompt.md` for comprehensive testing
4. Task 9 will ensure all functionality works end-to-end

## Testing Checklist

- [ ] Export PDF → Check activity_log table for new entry
- [ ] Activity log has correct entity_type: 'report'
- [ ] Activity log has correct action: 'exported'
- [ ] Description includes row count and page count
- [ ] Metadata includes report_type: 'payment_plans'
- [ ] Metadata includes format: 'pdf'
- [ ] Metadata includes row_count (correct value)
- [ ] Metadata includes page_count (correct value)
- [ ] Metadata includes sanitized filters (IDs only)
- [ ] Metadata includes duration_ms (performance tracking)
- [ ] Activity appears in user's activity feed
- [ ] Activity feed displays export icon and details
- [ ] Logging failure doesn't break PDF export
- [ ] Test with various filter combinations
- [ ] Test with different data sizes (10 rows, 100 rows, 1000 rows)
- [ ] Verify user_id and agency_id are correct
- [ ] Verify timestamp is accurate
- [ ] Run analytics queries to verify data structure
