import { stringify } from 'csv-stringify/sync'
import { stringify as stringifyStream } from 'csv-stringify'
import { format as formatDate } from 'date-fns'
import { Readable } from 'stream'

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
  const headers = columns.map((col) => COLUMN_LABELS[col] || col)

  // Format data rows
  const rows = data.map((row) => {
    return columns.map((col) => {
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
  return columns.map((col) => COLUMN_LABELS[col] || col)
}

/**
 * Add UTF-8 BOM to string for Excel compatibility
 * @param content String content
 * @returns Content with BOM prepended
 */
export function addUTF8BOM(content: string): string {
  return '\uFEFF' + content
}

/**
 * Export large dataset to CSV using streaming approach
 * Avoids loading all data into memory by streaming rows incrementally
 *
 * @param queryFn Async generator function that yields data in batches
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

  // Create CSV stringifier stream with same options as sync version
  const stringifier = stringifyStream({
    header: true,
    columns: headers,
    quoted: true,
    quoted_empty: true,
    escape: '"',
  })

  let isFirstChunk = true

  // Create readable stream that feeds data to stringifier
  const readable = new Readable({
    async read() {
      try {
        // Add BOM at start of stream
        if (isFirstChunk) {
          this.push('\uFEFF')
          isFirstChunk = false
        }

        // Get the generator
        const generator = queryFn()

        // Stream rows from query in batches
        for await (const batch of generator) {
          for (const row of batch) {
            const formattedRow = formatRowForCSV(row, columns)
            if (!stringifier.write(formattedRow)) {
              // Backpressure: wait for drain event
              await new Promise((resolve) => stringifier.once('drain', resolve))
            }
          }
        }

        // Signal end of data
        stringifier.end()
        this.push(null)
      } catch (error) {
        console.error('Streaming export error:', error)
        this.destroy(error as Error)
      }
    },
  })

  // Pipe stringifier output to readable stream
  stringifier.on('readable', function () {
    let row
    while ((row = stringifier.read()) !== null) {
      readable.push(row)
    }
  })

  stringifier.on('error', (err) => {
    console.error('CSV stringifier error:', err)
    readable.destroy(err)
  })

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `payment_plans_${timestamp}.csv`

  return new Response(readable as any, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}

/**
 * Format single row for CSV export
 * Used by both sync and streaming export functions
 *
 * @param row Data row
 * @param columns Array of column keys
 * @returns Formatted row data as object with column keys
 */
export function formatRowForCSV(row: any, columns: string[]): Record<string, string> {
  const formatted: Record<string, string> = {}

  columns.forEach((col) => {
    const value = getNestedValue(row, col)

    // Format based on data type - same logic as sync version
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
