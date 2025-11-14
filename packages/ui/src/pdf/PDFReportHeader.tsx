/**
 * PDF Report Header Component
 *
 * Story 7.3: PDF Export Functionality
 * Task 3: Implement PDF Logo and Metadata
 *
 * Displays logo, title, and metadata at the top of PDF reports
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './pdf-styles'
import { formatDateTime } from './pdf-utils'

export interface PDFReportHeaderProps {
  title: string
  subtitle?: string
  generatedAt?: Date
  agencyName?: string
}

/**
 * PDF Report Header
 *
 * Displays:
 * - Report title
 * - Subtitle (optional)
 * - Generation timestamp
 * - Agency name (if provided)
 */
export function PDFReportHeader({
  title,
  subtitle,
  generatedAt = new Date(),
  agencyName,
}: PDFReportHeaderProps) {
  return (
    <View style={pdfStyles.header}>
      {/* Title */}
      <Text style={pdfStyles.title}>{title}</Text>

      {/* Subtitle */}
      {subtitle && <Text style={pdfStyles.subtitle}>{subtitle}</Text>}

      {/* Metadata */}
      <View style={pdfStyles.metadata}>
        <Text>Generated: {formatDateTime(generatedAt)}</Text>
        {agencyName && <Text>Agency: {agencyName}</Text>}
      </View>
    </View>
  )
}
