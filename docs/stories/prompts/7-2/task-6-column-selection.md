# Task 6: Handle Column Selection

## Story Context
**Epic 7.2**: CSV Export Functionality
**User Story**: As an Agency User, I want to export reports to CSV format, so that I can import payment data into Excel or accounting software.

## Task Objective
Support exporting only user-selected columns from the report builder, allowing flexible CSV exports with customizable column sets based on user preferences.

## Acceptance Criteria Coverage
- AC #3: CSV respects the selected columns and filters

## Implementation Requirements

### 1. Column Selection Parameter
- Accept `columns[]` query parameter as array of column keys
- If no columns specified, export all available columns
- Only include selected columns in CSV headers and rows
- Maintain column order based on user selection

### 2. URL Format
```
/api/reports/payment-plans/export?format=csv&columns[]=student_name&columns[]=total_amount&columns[]=status
```

### 3. Available Columns
```typescript
const AVAILABLE_COLUMNS = [
  'student_name',
  'college_name',
  'branch_name',
  'branch_city',
  'total_amount',
  'currency',
  'start_date',
  'commission_rate_percent',
  'expected_commission',
  'earned_commission',
  'status',
  'contract_expiration_date',
]
```

### 4. Column Validation
- Validate column keys against whitelist
- Reject invalid column keys with 400 error
- Provide helpful error message listing valid columns

### 5. Default Behavior
If no columns specified, export all available columns in default order

## Subtasks Checklist
- [ ] Accept `columns[]` query parameter as array of column keys
- [ ] If no columns specified, export all available columns
- [ ] Only include selected columns in CSV headers and rows
- [ ] Maintain column order based on user selection
- [ ] Validate column keys (must be valid payment plan fields)
- [ ] Test: Export with subset of columns → Only selected columns appear

## Technical Constraints
- **Validation**: Column keys must match valid payment plan fields
- **Order**: Maintain user-specified column order
- **Default**: Export all columns if none specified
- **Integration**: Work with API route (Task 1) and UI (Task 4)

## Dependencies
- API route from Task 1
- CSV formatter from Task 2
- Export button component from Task 4

## Reference Implementation

### API Route Enhancement

```typescript
// apps/reports/app/api/reports/payment-plans/export/route.ts
// Enhance existing route from Task 1

const AVAILABLE_COLUMNS = [
  'student_name',
  'college_name',
  'branch_name',
  'branch_city',
  'total_amount',
  'currency',
  'start_date',
  'commission_rate_percent',
  'expected_commission',
  'earned_commission',
  'status',
  'contract_expiration_date',
] as const

const DEFAULT_COLUMNS = AVAILABLE_COLUMNS

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Extract selected columns
  const selectedColumns = searchParams.getAll('columns[]')

  // Validate columns
  if (selectedColumns.length > 0) {
    const invalidColumns = selectedColumns.filter(
      col => !AVAILABLE_COLUMNS.includes(col as any)
    )

    if (invalidColumns.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid columns',
          invalid: invalidColumns,
          available: AVAILABLE_COLUMNS,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  // Use selected columns or default to all
  const columns = selectedColumns.length > 0 ? selectedColumns : DEFAULT_COLUMNS

  // ... rest of export logic using `columns` ...

  return exportAsCSV(data, columns)
}
```

### Column Mapping Configuration

```typescript
// packages/utils/src/csv-formatter.ts
// Enhance existing formatter from Task 2

export const COLUMN_LABELS: Record<string, string> = {
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

export const COLUMN_PATHS: Record<string, string> = {
  student_name: 'enrollments.0.student.full_name',
  college_name: 'enrollments.0.branch.college.name',
  branch_name: 'enrollments.0.branch.name',
  branch_city: 'enrollments.0.branch.city',
  total_amount: 'total_amount',
  currency: 'currency',
  start_date: 'start_date',
  commission_rate_percent: 'commission_rate_percent',
  expected_commission: 'expected_commission',
  earned_commission: 'earned_commission',
  status: 'status',
  contract_expiration_date: 'enrollments.0.branch.contract_expiration_date',
}

/**
 * Get value from row using column key
 * @param row Data row
 * @param columnKey Column key
 * @returns Value at column path
 */
export function getColumnValue(row: any, columnKey: string): any {
  const path = COLUMN_PATHS[columnKey] || columnKey
  return getNestedValue(row, path)
}

/**
 * Export data to CSV with selected columns
 * @param data Array of payment plan records
 * @param columns Array of column keys to include
 * @returns Response with CSV file
 */
export function exportAsCSV(data: any[], columns: string[]): Response {
  // Generate headers for selected columns only
  const headers = columns.map(col => COLUMN_LABELS[col] || col)

  // Format data rows with selected columns only
  const rows = data.map(row => {
    return columns.map(col => {
      const value = getColumnValue(row, col)

      // Format based on data type
      if (col.includes('amount') || col.includes('commission')) {
        return formatCurrencyForCSV(value)
      }
      if (col.includes('date')) {
        return formatDateISO(value)
      }
      if (col.includes('rate') && col.includes('percent')) {
        return value != null ? value.toString() : ''
      }
      return value || ''
    })
  })

  // ... rest of CSV generation ...
}
```

### UI Component Enhancement

```typescript
// apps/reports/app/components/ExportButtons.tsx
// Enhance existing component from Task 4

interface ExportButtonsProps {
  filters: ReportFilters
  columns: string[] // Selected columns from report builder
  reportData?: any[]
}

export function ExportButtons({ filters, columns, reportData }: ExportButtonsProps) {
  const handleExportCSV = async () => {
    setIsExportingCSV(true)

    try {
      const url = new URL('/api/reports/payment-plans/export', window.location.origin)
      url.searchParams.set('format', 'csv')

      // Add filters...

      // Add selected columns (important!)
      if (columns && columns.length > 0) {
        columns.forEach(col => url.searchParams.append('columns[]', col))
      }
      // If no columns provided, API will default to all columns

      window.location.href = url.toString()

      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setTimeout(() => setIsExportingCSV(false), 2000)
    }
  }

  // ... rest of component ...
}
```

### Report Builder Column Selection

```typescript
// apps/reports/app/page.tsx or report builder component

import { ExportButtons } from './components/ExportButtons'

export default function ReportBuilderPage() {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'student_name',
    'college_name',
    'total_amount',
    'status',
  ])

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  return (
    <div>
      {/* Column selection UI */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Select Columns</h3>
        <div className="space-y-2">
          {AVAILABLE_COLUMNS.map(col => (
            <label key={col} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={() => handleColumnToggle(col)}
              />
              <span>{COLUMN_LABELS[col]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Export buttons with selected columns */}
      <ExportButtons
        filters={filters}
        columns={selectedColumns}
        reportData={reportData}
      />

      {/* Report results table with selected columns */}
      <table>
        <thead>
          <tr>
            {selectedColumns.map(col => (
              <th key={col}>{COLUMN_LABELS[col]}</th>
            ))}
          </tr>
        </thead>
        {/* ... */}
      </table>
    </div>
  )
}
```

## Testing Requirements

### Unit Tests
```typescript
// packages/utils/src/__tests__/csv-formatter.test.ts

describe('CSV Column Selection', () => {
  const mockData = [
    {
      total_amount: 1000,
      currency: 'USD',
      status: 'active',
      start_date: '2025-01-01',
      enrollments: [
        {
          student: { full_name: 'John Doe' },
          branch: {
            name: 'Main Branch',
            college: { name: 'State University' },
          },
        },
      ],
    },
  ]

  it('exports only selected columns', () => {
    const columns = ['student_name', 'total_amount', 'status']
    const response = exportAsCSV(mockData, columns)

    const csvText = response.body // Extract text from response
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')

    // Should have exactly 3 columns
    expect(headers).toHaveLength(3)
    expect(headers).toEqual(['Student Name', 'Total Amount', 'Status'])
  })

  it('maintains column order', () => {
    const columns = ['status', 'student_name', 'total_amount']
    const response = exportAsCSV(mockData, columns)

    const csvText = response.body
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')

    // Order should match input
    expect(headers).toEqual(['Status', 'Student Name', 'Total Amount'])
  })

  it('exports all columns when none specified', () => {
    const columns = DEFAULT_COLUMNS
    const response = exportAsCSV(mockData, columns)

    const csvText = response.body
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')

    // Should have all default columns
    expect(headers).toHaveLength(DEFAULT_COLUMNS.length)
  })

  it('handles single column selection', () => {
    const columns = ['student_name']
    const response = exportAsCSV(mockData, columns)

    const csvText = response.body
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')

    expect(headers).toEqual(['Student Name'])
  })
})
```

### Integration Tests
```typescript
// apps/reports/app/api/reports/payment-plans/export/__tests__/column-selection.test.ts

describe('Export API Column Selection', () => {
  it('exports only selected columns', async () => {
    const response = await fetch(
      '/api/reports/payment-plans/export?format=csv&columns[]=student_name&columns[]=total_amount'
    )

    expect(response.ok).toBe(true)

    const csvText = await response.text()
    const lines = csvText.split('\n')
    const headers = lines[0]

    expect(headers).toContain('Student Name')
    expect(headers).toContain('Total Amount')
    expect(headers).not.toContain('Branch')
    expect(headers).not.toContain('Status')
  })

  it('validates column keys', async () => {
    const response = await fetch(
      '/api/reports/payment-plans/export?format=csv&columns[]=invalid_column'
    )

    expect(response.status).toBe(400)

    const error = await response.json()
    expect(error.error).toBe('Invalid columns')
    expect(error.invalid).toContain('invalid_column')
    expect(error.available).toEqual(AVAILABLE_COLUMNS)
  })

  it('exports all columns when none specified', async () => {
    const response = await fetch('/api/reports/payment-plans/export?format=csv')

    expect(response.ok).toBe(true)

    const csvText = await response.text()
    const lines = csvText.split('\n')
    const headerCount = lines[0].split(',').length

    expect(headerCount).toBe(DEFAULT_COLUMNS.length)
  })

  it('maintains column order', async () => {
    const response = await fetch(
      '/api/reports/payment-plans/export?format=csv&columns[]=status&columns[]=student_name&columns[]=total_amount'
    )

    const csvText = await response.text()
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')

    expect(headers[0]).toContain('Status')
    expect(headers[1]).toContain('Student Name')
    expect(headers[2]).toContain('Total Amount')
  })
})
```

### E2E Tests
```typescript
// e2e/reports/column-selection.spec.ts

test('exports only selected columns', async ({ page }) => {
  await page.goto('/reports')

  // Deselect some columns
  await page.uncheck('input[type="checkbox"][value="branch_name"]')
  await page.uncheck('input[type="checkbox"][value="college_name"]')

  // Keep student_name, total_amount, status checked

  // Setup download listener
  const downloadPromise = page.waitForEvent('download')

  // Click export
  await page.click('button:has-text("Export CSV")')

  // Verify download
  const download = await downloadPromise
  const path = await download.path()

  // Read CSV file
  const fs = require('fs')
  const csvContent = fs.readFileSync(path, 'utf-8')
  const headers = csvContent.split('\n')[0]

  // Verify only selected columns
  expect(headers).toContain('Student Name')
  expect(headers).toContain('Total Amount')
  expect(headers).toContain('Status')
  expect(headers).not.toContain('Branch')
  expect(headers).not.toContain('College')
})
```

## Column Selection UI Mockup

```
┌─────────────────────────────────────────────────────┐
│ Payment Plans Report                   Export CSV ▼ │
├─────────────────────────────────────────────────────┤
│                                                       │
│ Columns to Display:                                  │
│ ☑ Student Name                                       │
│ ☑ College                                            │
│ ☑ Branch                                             │
│ ☐ City                                               │
│ ☑ Total Amount                                       │
│ ☑ Currency                                           │
│ ☐ Start Date                                         │
│ ☐ Commission Rate                                    │
│ ☑ Expected Commission                                │
│ ☑ Earned Commission                                  │
│ ☑ Status                                             │
│ ☐ Contract Expiration                                │
│                                                       │
│ [Clear All] [Select All]                             │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## Validation Rules
- [ ] Column keys must be in AVAILABLE_COLUMNS list
- [ ] At least 1 column must be selected (or default to all)
- [ ] Maximum column limit: No limit (all available columns)
- [ ] Invalid columns return 400 error with helpful message
- [ ] Empty columns[] defaults to all columns

## Error Messages
```typescript
// Invalid column
{
  error: 'Invalid columns',
  message: 'The following columns are not valid: invalid_column',
  invalid: ['invalid_column'],
  available: AVAILABLE_COLUMNS
}

// No columns (not an error - defaults to all)
// This is handled gracefully by using DEFAULT_COLUMNS
```

## Next Task
After completing this task, proceed to:
**Task 7: Testing** - Comprehensive test suite covering all acceptance criteria, edge cases, and integration points.
