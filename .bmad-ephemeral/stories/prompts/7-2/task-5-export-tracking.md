# Task 5: Add Export Tracking

## Story Context
**Epic 7.2**: CSV Export Functionality
**User Story**: As an Agency User, I want to export reports to CSV format, so that I can import payment data into Excel or accounting software.

## Task Objective
Log export events to the activity_log table for audit trail and display them in the user activity feed, providing transparency and tracking of report exports.

## Acceptance Criteria Coverage
- AC #1: Track CSV export events for audit and activity feed

## Implementation Requirements

### 1. Activity Logging
- Log export events to `activity_log` table
- Include metadata: report type, format, row count, filters
- Track user who performed the export
- Link to agency for multi-tenant isolation

### 2. Activity Log Schema
```sql
activity_log (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  user_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL, -- 'report'
  entity_id UUID, -- NULL for report exports
  action TEXT NOT NULL, -- 'exported'
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### 3. Activity Log Entry Format
```typescript
{
  entity_type: 'report',
  action: 'exported',
  description: "{{user}} exported payment plans report to CSV ({{row_count}} rows)",
  metadata: {
    report_type: 'payment_plans',
    format: 'csv',
    row_count: 150,
    filters: {
      date_from: '2025-01-01',
      date_to: '2025-12-31',
      college_id: 'college-1',
      status: ['active', 'completed']
    },
    columns: ['student_name', 'total_amount', 'status'],
    exported_at: '2025-11-13T14:30:22Z'
  }
}
```

### 4. Integration Points
- API route (Task 1): Log after successful export
- UI component (Task 4): Log from client-side as backup
- Activity feed (Story 6.4): Display export events

## Subtasks Checklist
- [ ] Log export events to activity_log table
- [ ] Include metadata: report_type, format, row_count, filters
- [ ] Track user who performed export
- [ ] Track export in user activity feed
- [ ] Test: Verify export activity appears in recent activity feed

## Technical Constraints
- **Security**: Only log exports for authenticated users
- **Security**: RLS ensures activity_log entries filtered by agency_id
- **Performance**: Async logging to avoid blocking export response
- **Data Privacy**: Don't log sensitive data in metadata (e.g., actual payment amounts)

## Dependencies
- `packages/database/src/activity-logger.ts`: Activity logging utility (from Story 6.4)
- `activity_log` table: Database table for activity tracking
- User authentication context

## Reference Implementation

### Activity Logger Utility

```typescript
// packages/database/src/activity-logger.ts
// Extend existing utility from Story 6.4

import { createServerClient } from '@/lib/supabase/server'

export interface ActivityLogEntry {
  agency_id: string
  user_id: string | null
  entity_type: 'report' | 'payment_plan' | 'enrollment' | 'student' | 'college' | 'branch'
  entity_id?: string | null
  action: 'created' | 'updated' | 'deleted' | 'exported' | 'viewed'
  description: string
  metadata?: Record<string, any>
}

/**
 * Log activity to activity_log table
 */
export async function logActivity(entry: ActivityLogEntry): Promise<void> {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('activity_log')
      .insert({
        agency_id: entry.agency_id,
        user_id: entry.user_id,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        description: entry.description,
        metadata: entry.metadata,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to log activity:', error)
      // Don't throw - logging failures shouldn't break main flow
    }
  } catch (error) {
    console.error('Activity logging error:', error)
    // Swallow error to prevent disrupting user experience
  }
}

/**
 * Log report export event
 */
export async function logReportExport(params: {
  agency_id: string
  user_id: string
  report_type: string
  format: 'csv' | 'pdf'
  row_count: number
  filters: Record<string, any>
  columns: string[]
}): Promise<void> {
  const { agency_id, user_id, report_type, format, row_count, filters, columns } = params

  // Get user name for description
  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', user_id)
    .single()

  const userName = user ? `${user.first_name} ${user.last_name}` : 'User'

  await logActivity({
    agency_id,
    user_id,
    entity_type: 'report',
    action: 'exported',
    description: `${userName} exported ${report_type} report to ${format.toUpperCase()} (${row_count} rows)`,
    metadata: {
      report_type,
      format,
      row_count,
      filters,
      columns,
      exported_at: new Date().toISOString(),
    },
  })
}
```

### API Route Integration

```typescript
// apps/reports/app/api/reports/payment-plans/export/route.ts
// Add to existing route from Task 1

import { logReportExport } from '@/packages/database/src/activity-logger'

export async function GET(request: Request) {
  // ... existing query and export logic ...

  // After successful export, log activity
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get agency_id from user metadata or query
      const { data: userData } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (userData?.agency_id) {
        // Log export asynchronously (don't await)
        logReportExport({
          agency_id: userData.agency_id,
          user_id: user.id,
          report_type: 'payment_plans',
          format: 'csv',
          row_count: data.length,
          filters,
          columns,
        }).catch(error => {
          console.error('Failed to log export:', error)
        })
      }
    }
  } catch (error) {
    console.error('Activity logging error:', error)
    // Don't fail export if logging fails
  }

  // Return CSV response
  return exportAsCSV(data, columns)
}
```

### Client-Side Tracking (Backup)

```typescript
// apps/reports/app/components/ExportButtons.tsx
// Add to existing component from Task 4

import { logReportExport } from '@/packages/database/src/activity-logger'

const handleExportCSV = async () => {
  setIsExportingCSV(true)

  try {
    // Build URL and trigger export...

    // Log activity after successful export
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user && reportData) {
      const { data: userData } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (userData?.agency_id) {
        await logReportExport({
          agency_id: userData.agency_id,
          user_id: user.id,
          report_type: 'payment_plans',
          format: 'csv',
          row_count: reportData.length,
          filters,
          columns,
        })
      }
    }

    toast.success('Report exported successfully')
  } catch (error) {
    console.error('Export failed:', error)
    toast.error('Failed to export report')
  } finally {
    setTimeout(() => setIsExportingCSV(false), 2000)
  }
}
```

### Activity Feed Integration

```typescript
// apps/dashboard/app/components/RecentActivity.tsx
// From Story 6.4 - already displays activity_log entries

// Activity feed will automatically show export events:
// "John Doe exported payment plans report to CSV (150 rows)"
// Metadata includes filters, columns, and timestamp
```

## Testing Requirements

### Unit Tests
```typescript
// packages/database/src/__tests__/activity-logger.test.ts

import { describe, it, expect, vi } from 'vitest'
import { logReportExport } from '../activity-logger'

describe('Activity Logger - Report Export', () => {
  it('logs report export with all metadata', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({ error: null })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { first_name: 'John', last_name: 'Doe' }
            }))
          }))
        }))
      }))
    }

    await logReportExport({
      agency_id: 'agency-1',
      user_id: 'user-1',
      report_type: 'payment_plans',
      format: 'csv',
      row_count: 150,
      filters: { date_from: '2025-01-01' },
      columns: ['student_name', 'total_amount'],
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('activity_log')
  })

  it('handles logging errors gracefully', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({ error: new Error('Database error') }))
      }))
    }

    // Should not throw
    await expect(
      logReportExport({
        agency_id: 'agency-1',
        user_id: 'user-1',
        report_type: 'payment_plans',
        format: 'csv',
        row_count: 150,
        filters: {},
        columns: [],
      })
    ).resolves.not.toThrow()
  })
})
```

### Integration Tests
```typescript
// apps/reports/app/api/reports/payment-plans/export/__tests__/activity-logging.test.ts

describe('CSV Export Activity Logging', () => {
  it('logs export event to activity_log table', async () => {
    const response = await fetch('/api/reports/payment-plans/export?format=csv')
    expect(response.ok).toBe(true)

    // Query activity_log to verify entry
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', 'report')
      .eq('action', 'exported')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    expect(data).toBeDefined()
    expect(data.metadata.report_type).toBe('payment_plans')
    expect(data.metadata.format).toBe('csv')
    expect(data.metadata.row_count).toBeGreaterThan(0)
  })

  it('includes filters in metadata', async () => {
    const response = await fetch(
      '/api/reports/payment-plans/export?format=csv&date_from=2025-01-01&college_id=college-1'
    )

    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', 'report')
      .eq('action', 'exported')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    expect(data.metadata.filters).toMatchObject({
      date_from: '2025-01-01',
      college_id: 'college-1',
    })
  })
})
```

### E2E Test
```typescript
// e2e/reports/export-tracking.spec.ts

test('export appears in activity feed', async ({ page }) => {
  // Login and export report
  await page.goto('/reports')
  await page.click('button:has-text("Export CSV")')

  // Navigate to dashboard to see activity feed
  await page.goto('/dashboard')

  // Verify export appears in recent activity
  await expect(
    page.locator('text=exported payment plans report to CSV')
  ).toBeVisible()
})
```

## Activity Log Display Format

### Activity Feed Item
```typescript
{
  id: 'activity-123',
  icon: '📊', // or FileDown icon
  title: 'Report Exported',
  description: 'John Doe exported payment plans report to CSV (150 rows)',
  timestamp: '2 minutes ago',
  metadata: {
    report_type: 'payment_plans',
    format: 'csv',
    row_count: 150,
    filters: { date_from: '2025-01-01', date_to: '2025-12-31' },
    columns: ['student_name', 'college_name', 'total_amount', 'status']
  }
}
```

## Security & Privacy Checklist
- [ ] RLS policies applied to activity_log table
- [ ] Only log for authenticated users
- [ ] Agency_id required for all log entries
- [ ] No sensitive data logged (e.g., payment amounts)
- [ ] Metadata includes only filter params, not results
- [ ] Async logging doesn't block export response
- [ ] Logging failures don't break export functionality

## Data Retention
- Consider retention policy for activity_log entries
- Suggestion: Keep last 90 days of activity
- Implement cleanup job to archive old entries
- Document in future enhancement notes

## Next Task
After completing this task, proceed to:
**Task 6: Handle Column Selection** - Support exporting only selected columns from the report builder.
