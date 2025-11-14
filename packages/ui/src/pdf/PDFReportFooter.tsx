/**
 * PDF Report Footer Component
 *
 * Story 7.3: PDF Export Functionality
 * Task 6: Add Summary Totals Section
 *
 * Displays summary totals at the end of PDF reports with professional styling
 * and color coding (green for earned, red for outstanding)
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './pdf-styles'
import { formatCurrency, type SummaryMetrics } from './pdf-utils'

export interface PDFReportFooterProps {
  summary: SummaryMetrics
  currency?: string
}

/**
 * PDF Report Footer with Summary Totals
 *
 * Displays:
 * - Total records count
 * - Total amount
 * - Total expected commission
 * - Total earned commission (green)
 * - Outstanding commission (red/orange)
 *
 * Features:
 * - Professional shaded background box
 * - Color coding for emphasis (green/red)
 * - Currency formatting with thousands separator
 * - Visual separator line from table
 * - Only appears on last page
 */
export function PDFReportFooter({ summary, currency = 'AUD' }: PDFReportFooterProps) {
  return (
    <View style={pdfStyles.summaryContainer}>
      {/* Separator line from table */}
      <View style={pdfStyles.separator} />

      {/* Summary title */}
      <Text style={pdfStyles.summaryTitle}>Report Summary</Text>

      {/* Summary metrics grid */}
      <View style={pdfStyles.summaryGrid}>
        {/* Total Records */}
        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>Total Records:</Text>
          <Text style={pdfStyles.summaryValue}>{summary.totalRecords}</Text>
        </View>

        {/* Total Amount */}
        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>Total Amount:</Text>
          <Text style={pdfStyles.summaryValue}>
            {formatCurrency(summary.totalAmount, currency)}
          </Text>
        </View>

        {/* Expected Commission */}
        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>Expected Commission:</Text>
          <Text style={pdfStyles.summaryValue}>
            {formatCurrency(summary.expectedCommission, currency)}
          </Text>
        </View>

        {/* Earned Commission (green) */}
        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>Earned Commission:</Text>
          <Text style={[pdfStyles.summaryValue, pdfStyles.earnedAmount]}>
            {formatCurrency(summary.earnedCommission, currency)}
          </Text>
        </View>

        {/* Outstanding Commission (red/orange) - last row, no border */}
        <View style={[pdfStyles.summaryRow, pdfStyles.summaryRowLast]}>
          <Text style={pdfStyles.summaryLabel}>Outstanding Commission:</Text>
          <Text style={[pdfStyles.summaryValue, pdfStyles.outstandingAmount]}>
            {formatCurrency(summary.outstandingCommission, currency)}
          </Text>
        </View>
      </View>
    </View>
  )
}
