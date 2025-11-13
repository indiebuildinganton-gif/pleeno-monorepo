# Task 3: Support Large Dataset Streaming

## Story Context
**Epic 7.2**: CSV Export Functionality
**User Story**: As an Agency User, I want to export reports to CSV format, so that I can import payment data into Excel or accounting software.

## Task Objective
Implement streaming approach for large datasets (>1000 rows) to avoid memory overflow and ensure exports complete efficiently without loading all data into memory.

## Acceptance Criteria Coverage
- AC #1: CSV file is downloaded with all report data (even for large datasets)

## Implementation Requirements

### 1. Streaming Strategy
- Use Node.js `Readable` stream for memory-efficient export
- Stream CSV rows incrementally instead of loading all into memory
- Critical for reports with thousands of rows
- Set `Transfer-Encoding: chunked` for streaming response

### 2. Performance Threshold
- Use streaming for datasets > 1000 rows
- For smaller datasets, use synchronous approach (Task 2)
- Monitor memory usage during export

### 3. Database Query Streaming
- Use Supabase cursor/pagination for large result sets
- Fetch and process data in batches (e.g., 500 rows at a time)
- Stream rows as they're fetched from database

## Subtasks Checklist
- [ ] Implement streaming approach for large datasets (>1000 rows)
- [ ] Use Node.js streams instead of loading all data into memory
- [ ] Stream CSV rows as they're generated
- [ ] Set `Transfer-Encoding: chunked` for streaming response
- [ ] Test with dataset of 5000+ rows to verify memory efficiency
- [ ] Monitor memory usage during export

## Technical Constraints
- **Performance**: Use streaming for datasets >1000 rows to avoid memory overflow
- **Performance**: Export queries must complete in <5 seconds per PRD
- **Compatibility**: Maintain UTF-8 BOM and CSV formatting from Task 2
- **Architecture**: Integrate with API route from Task 1

## Dependencies
- `csv-stringify`: Stream-based CSV writer
- `stream`: Node.js built-in streams module

## Reference Implementation

### Streaming CSV Export Function

```typescript
// packages/utils/src/csv-formatter.ts (add to existing file)

import { Readable } from 'stream'
import { stringify } from 'csv-stringify'

/**
 * Export large dataset to CSV using streaming approach
 * @param queryFn Async function that yields data in batches
 * @param columns Array of column keys to include
 * @param totalRows Estimated total rows (for optimization)
 * @returns Response with streaming CSV
 */
export async function exportAsCSVStream(
  queryFn: () => AsyncGenerator<any[], void, unknown>,
  columns: string[],
  totalRows?: number
): Promise<Response> {
  const headers = generateCSVHeaders(columns)

  // Create CSV stringifier stream
  const stringifier = stringify({
    header: true,
    columns: headers,
    quoted: true,
    quoted_empty: true,
    escape: '"',
  })

  // Create readable stream
  const readable = new Readable({
    async read() {
      try {
        // Add BOM at start
        if (this.readableLength === 0) {
          this.push('\uFEFF')
        }

        // Stream rows from query
        const generator = queryFn()

        for await (const batch of generator) {
          for (const row of batch) {
            const formattedRow = formatRowForCSV(row, columns)
            stringifier.write(formattedRow)
          }
        }

        stringifier.end()
      } catch (error) {
        console.error('Streaming export error:', error)
        this.destroy(error as Error)
      }
    }
  })

  // Pipe stringifier to readable
  stringifier.pipe(readable)

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `payment_plans_${timestamp}.csv`

  return new Response(readable as any, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Transfer-Encoding': 'chunked',
    },
  })
}

/**
 * Format single row for CSV export
 * @param row Data row
 * @param columns Array of column keys
 * @returns Formatted row data
 */
function formatRowForCSV(row: any, columns: string[]): Record<string, string> {
  const formatted: Record<string, string> = {}

  columns.forEach(col => {
    const value = getNestedValue(row, col)

    // Format based on data type
    if (col.includes('amount') || col.includes('commission')) {
      formatted[col] = formatCurrencyForCSV(value)
    } else if (col.includes('date')) {
      formatted[col] = formatDateISO(value)
    } else if (col.includes('rate') && col.includes('percent')) {
      formatted[col] = value != null ? value.toString() : ''
    } else {
      formatted[col] = value || ''
    }
  })

  return formatted
}
```

### API Route Integration

```typescript
// apps/reports/app/api/reports/payment-plans/export/route.ts
// Add to existing route from Task 1

import { exportAsCSV, exportAsCSVStream } from '@/packages/utils/src/csv-formatter'

export async function GET(request: Request) {
  // ... existing filter and query setup ...

  // Count total rows first
  const { count } = await supabase
    .from('payment_plans')
    .select('*', { count: 'exact', head: true })
    // Apply same filters...

  const totalRows = count || 0

  // Choose streaming vs. synchronous based on size
  if (totalRows > 1000) {
    // Use streaming approach for large datasets
    return exportAsCSVStream(
      async function* () {
        let offset = 0
        const batchSize = 500

        while (offset < totalRows) {
          const { data, error } = await supabase
            .from('payment_plans')
            .select(SELECT_QUERY)
            // Apply filters...
            .range(offset, offset + batchSize - 1)

          if (error) throw error
          if (!data || data.length === 0) break

          yield data
          offset += batchSize
        }
      },
      columns,
      totalRows
    )
  } else {
    // Use synchronous approach for small datasets (Task 2)
    const { data, error } = await query
    if (error) throw error

    return exportAsCSV(data, columns)
  }
}
```

### Batch Query Pattern

```typescript
/**
 * Query payment plans in batches for streaming
 */
async function* queryPaymentPlansBatch(
  supabase: SupabaseClient,
  filters: ExportFilters,
  batchSize: number = 500
): AsyncGenerator<any[], void, unknown> {
  let offset = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from('payment_plans')
      .select(`
        id,
        total_amount,
        currency,
        start_date,
        commission_rate_percent,
        expected_commission,
        earned_commission,
        status,
        enrollments (
          student:students (
            id,
            full_name
          ),
          branch:branches (
            id,
            name,
            city,
            contract_expiration_date,
            college:colleges (
              id,
              name
            )
          )
        )
      `)
      .range(offset, offset + batchSize - 1)
      .order('start_date', { ascending: false })

    // Apply filters
    if (filters.date_from) {
      query = query.gte('start_date', filters.date_from)
    }
    // ... apply other filters

    const { data, error } = await query

    if (error) {
      console.error('Batch query error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      hasMore = false
      break
    }

    yield data

    if (data.length < batchSize) {
      hasMore = false
    }

    offset += batchSize
  }
}
```

## Testing Requirements

### Performance Tests
```typescript
// apps/reports/app/api/reports/payment-plans/export/__tests__/streaming.test.ts

import { describe, it, expect, vi } from 'vitest'
import { exportAsCSVStream } from '@/packages/utils/src/csv-formatter'

describe('CSV Streaming Export', () => {
  it('streams large dataset without memory overflow', async () => {
    const mockData = Array.from({ length: 5000 }, (_, i) => ({
      id: `id-${i}`,
      total_amount: 1000 + i,
      currency: 'USD',
      start_date: new Date('2025-01-01'),
    }))

    // Mock generator that yields data in batches
    async function* mockQuery() {
      const batchSize = 500
      for (let i = 0; i < mockData.length; i += batchSize) {
        yield mockData.slice(i, i + batchSize)
      }
    }

    const columns = ['id', 'total_amount', 'currency', 'start_date']
    const response = await exportAsCSVStream(mockQuery, columns, 5000)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('Transfer-Encoding')).toBe('chunked')

    // Verify response is a stream
    expect(response.body).toBeDefined()
  })

  it('handles empty batches gracefully', async () => {
    async function* emptyQuery() {
      yield []
    }

    const columns = ['id', 'total_amount']
    const response = await exportAsCSVStream(emptyQuery, columns)

    expect(response.status).toBe(200)
    // Should still have headers
  })

  it('handles query errors', async () => {
    async function* errorQuery() {
      throw new Error('Database error')
    }

    const columns = ['id']

    await expect(
      exportAsCSVStream(errorQuery, columns)
    ).rejects.toThrow('Database error')
  })
})
```

### Memory Profiling Test
```typescript
// Manual memory test - run with Node.js memory flags
// node --expose-gc --max-old-space-size=512 test-memory.js

describe('Memory Usage Test', () => {
  it('exports 10,000 rows without exceeding 100MB', async () => {
    // Force garbage collection before test
    if (global.gc) global.gc()

    const startMemory = process.memoryUsage().heapUsed

    // Perform export
    const response = await fetch('/api/reports/payment-plans/export?format=csv')
    await response.text()

    if (global.gc) global.gc()
    const endMemory = process.memoryUsage().heapUsed

    const memoryIncrease = (endMemory - startMemory) / 1024 / 1024 // MB
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`)

    expect(memoryIncrease).toBeLessThan(100) // Less than 100MB increase
  })
})
```

## Performance Optimization Checklist
- [ ] Streaming enabled for datasets >1000 rows
- [ ] Batch size optimized (500 rows per batch)
- [ ] Database cursors used for pagination
- [ ] Memory usage monitored during export
- [ ] Transfer-Encoding: chunked header set
- [ ] CSV stringifier streams directly to response
- [ ] No intermediate array allocation for full dataset

## Edge Cases to Test
- [ ] Export with exactly 1000 rows (boundary test)
- [ ] Export with 0 rows (empty result)
- [ ] Export with 10,000+ rows (stress test)
- [ ] Export interrupted mid-stream (error handling)
- [ ] Multiple concurrent exports (resource management)
- [ ] Database connection timeout during streaming

## Next Task
After completing this task, proceed to:
**Task 4: Add Export Button to Report UI** - Create the UI component that triggers the CSV export.
