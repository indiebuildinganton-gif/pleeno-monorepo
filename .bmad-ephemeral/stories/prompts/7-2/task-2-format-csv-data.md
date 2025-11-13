# Task 2: Format CSV Data Correctly

## Story Context
**Epic 7.2**: CSV Export Functionality
**User Story**: As an Agency User, I want to export reports to CSV format, so that I can import payment data into Excel or accounting software.

## Task Objective
Implement CSV data formatting utilities that properly format headers, currency amounts, dates, and handle special characters with Excel compatibility.

## Acceptance Criteria Coverage
- AC #2: CSV includes column headers
- AC #4: Currency amounts formatted correctly
- AC #5: Dates in ISO format (YYYY-MM-DD)

## Implementation Requirements

### 1. Create CSV Formatter Utility
**Path**: `packages/utils/src/csv-formatter.ts`

### 2. Column Header Mapping
Map column keys to human-readable headers:

```typescript
const COLUMN_LABELS: Record<string, string> = {
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
```

### 3. Currency Formatting
- Remove currency symbols
- Use decimal format: "1234.56"
- Two decimal places for consistency
- Handle null/undefined as empty strings

### 4. Date Formatting
- Format dates in ISO 8601 format: "YYYY-MM-DD"
- Use `date-fns` for consistent formatting
- Handle null/undefined as empty strings

### 5. Special Character Handling
- Escape commas, quotes, newlines in text fields
- Use `csv-stringify` library for proper escaping
- Quote all fields by default

### 6. Excel Compatibility
- Add UTF-8 BOM (`\uFEFF`) at start of file
- This ensures Excel correctly detects UTF-8 encoding
- Without BOM, Excel may misinterpret special characters

## Subtasks Checklist
- [ ] Include column headers as first row
- [ ] Map column keys to human-readable headers
- [ ] Format currency amounts (decimal, 2 places)
- [ ] Format dates in ISO 8601 format
- [ ] Handle null/undefined values as empty strings
- [ ] Escape special characters in text fields
- [ ] Add UTF-8 BOM at start of file
- [ ] Test: Open exported CSV in Excel and verify formatting

## Technical Constraints
- **Compatibility**: Add UTF-8 BOM for Excel compatibility
- **Compatibility**: Quote all CSV fields to handle special characters
- **Data Format**: Currency amounts: "1234.56" (no symbols, 2 decimals)
- **Data Format**: Dates: ISO 8601 format "YYYY-MM-DD"
- **Testing**: All formatting functions must have unit tests

## Dependencies
- `csv-stringify`: For proper CSV escaping and formatting
- `date-fns`: For date formatting

## Reference Implementation

```typescript
// packages/utils/src/csv-formatter.ts

import { stringify } from 'csv-stringify/sync'
import { format as formatDate } from 'date-fns'

export interface ExportColumn {
  key: string
  label: string
}

const COLUMN_LABELS: Record<string, string> = {
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

/**
 * Export data to CSV format with proper formatting
 * @param data Array of payment plan records
 * @param columns Array of column keys to include
 * @returns Response with CSV file
 */
export function exportAsCSV(data: any[], columns: string[]): Response {
  // Generate header row
  const headers = columns.map(col => COLUMN_LABELS[col] || col)

  // Format data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = getNestedValue(row, col)

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

  // Generate CSV with headers
  const csv = stringify([headers, ...rows], {
    quoted: true, // Quote all fields
    quoted_empty: true, // Quote empty fields
    escape: '"', // Escape quotes with double quotes
  })

  // Add UTF-8 BOM for Excel compatibility
  const csvWithBOM = '\uFEFF' + csv

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `payment_plans_${timestamp}.csv`

  // Return response with proper headers
  return new Response(csvWithBOM, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

/**
 * Get nested value from object using dot notation
 * @param obj Object to traverse
 * @param path Dot-separated path (e.g., "enrollments.student.full_name")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => {
    if (Array.isArray(acc)) {
      return acc[0]?.[key]
    }
    return acc?.[key]
  }, obj)
}

/**
 * Format currency amount for CSV export
 * @param amount Numeric amount
 * @returns Formatted string "1234.56" or empty string
 */
export function formatCurrencyForCSV(amount: number | null | undefined): string {
  if (amount == null) return ''
  return amount.toFixed(2) // "1234.56"
}

/**
 * Format date for CSV export in ISO 8601 format
 * @param date Date string or Date object
 * @returns Formatted string "YYYY-MM-DD" or empty string
 */
export function formatDateISO(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatDate(d, 'yyyy-MM-dd') // "2025-11-13"
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

/**
 * Generate CSV headers from column keys
 * @param columns Array of column keys
 * @returns Array of human-readable header labels
 */
export function generateCSVHeaders(columns: string[]): string[] {
  return columns.map(col => COLUMN_LABELS[col] || col)
}

/**
 * Add UTF-8 BOM to string for Excel compatibility
 * @param content String content
 * @returns Content with BOM prepended
 */
export function addUTF8BOM(content: string): string {
  return '\uFEFF' + content
}
```

## Testing Requirements

### Unit Tests
Create file: `packages/utils/src/__tests__/csv-formatter.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import {
  formatCurrencyForCSV,
  formatDateISO,
  generateCSVHeaders,
  addUTF8BOM,
} from '../csv-formatter'

describe('CSV Formatter', () => {
  describe('formatCurrencyForCSV', () => {
    it('formats number with 2 decimal places', () => {
      expect(formatCurrencyForCSV(1234.56)).toBe('1234.56')
      expect(formatCurrencyForCSV(1000)).toBe('1000.00')
      expect(formatCurrencyForCSV(0.5)).toBe('0.50')
    })

    it('handles null and undefined', () => {
      expect(formatCurrencyForCSV(null)).toBe('')
      expect(formatCurrencyForCSV(undefined)).toBe('')
    })
  })

  describe('formatDateISO', () => {
    it('formats date string to ISO format', () => {
      expect(formatDateISO('2025-11-13T12:00:00Z')).toBe('2025-11-13')
      expect(formatDateISO('2025-01-01')).toBe('2025-01-01')
    })

    it('formats Date object to ISO format', () => {
      const date = new Date('2025-11-13T12:00:00Z')
      expect(formatDateISO(date)).toBe('2025-11-13')
    })

    it('handles null and undefined', () => {
      expect(formatDateISO(null)).toBe('')
      expect(formatDateISO(undefined)).toBe('')
    })
  })

  describe('generateCSVHeaders', () => {
    it('maps column keys to labels', () => {
      const columns = ['student_name', 'total_amount', 'status']
      const headers = generateCSVHeaders(columns)
      expect(headers).toEqual(['Student Name', 'Total Amount', 'Status'])
    })

    it('uses key as label if not mapped', () => {
      const columns = ['unknown_column']
      const headers = generateCSVHeaders(columns)
      expect(headers).toEqual(['unknown_column'])
    })
  })

  describe('addUTF8BOM', () => {
    it('prepends BOM to content', () => {
      expect(addUTF8BOM('data')).toBe('\uFEFFdata')
      expect(addUTF8BOM('')).toBe('\uFEFF')
    })
  })
})
```

### Integration Tests
- Test CSV export with actual data
- Verify headers appear correctly
- Verify currency formatting in output
- Verify date formatting in output
- Test opening CSV in Excel (manual test)

## Excel Compatibility Checklist
- [ ] UTF-8 BOM added at file start
- [ ] All fields quoted to handle commas
- [ ] Dates in ISO 8601 format recognized by Excel
- [ ] Currency amounts formatted as numbers (no symbols)
- [ ] Special characters (é, ñ, etc.) display correctly
- [ ] Newlines in text fields handled properly

## Next Task
After completing this task, proceed to:
**Task 3: Support Large Dataset Streaming** - Implement memory-efficient streaming for large exports.
