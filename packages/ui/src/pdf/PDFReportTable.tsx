/**
 * PDF Report Table Component
 *
 * Story 7.3: PDF Export Functionality
 * Task 5: Implement PDF Table with Data Display
 *
 * Displays tabular data with headers and formatted values
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './pdf-styles'
import { formatCurrency, formatDate } from './pdf-utils'

export interface PDFTableColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  format?: 'currency' | 'date' | 'text' | 'number'
  width?: string | number
}

export interface PDFReportTableProps {
  columns: PDFTableColumn[]
  data: any[]
  currency?: string
}

/**
 * PDF Report Table
 *
 * Features:
 * - Customizable columns with formatting
 * - Striped rows for readability
 * - Automatic value formatting (currency, dates, etc.)
 * - Responsive column widths
 */
export function PDFReportTable({ columns, data, currency = 'AUD' }: PDFReportTableProps) {
  const formatCellValue = (value: any, column: PDFTableColumn): string => {
    if (value === null || value === undefined) {
      return ''
    }

    switch (column.format) {
      case 'currency':
        return formatCurrency(Number(value), currency)
      case 'date':
        return formatDate(value)
      case 'number':
        return Number(value).toLocaleString()
      default:
        return String(value)
    }
  }

  return (
    <View style={pdfStyles.table}>
      {/* Table Header */}
      <View style={pdfStyles.tableHeader}>
        {columns.map((column) => (
          <Text
            key={column.key}
            style={[
              pdfStyles.tableHeaderCell,
              column.align === 'right' && pdfStyles.tableCellNumber,
              column.width && { width: column.width },
            ]}
          >
            {column.label}
          </Text>
        ))}
      </View>

      {/* Table Rows */}
      {data.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[pdfStyles.tableRow, rowIndex % 2 === 1 && pdfStyles.tableRowEven]}
        >
          {columns.map((column) => (
            <Text
              key={`${rowIndex}-${column.key}`}
              style={[
                pdfStyles.tableCell,
                column.align === 'right' && pdfStyles.tableCellNumber,
                column.width && { width: column.width },
              ]}
            >
              {formatCellValue(row[column.key], column)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}
