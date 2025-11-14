/**
 * PDF Report Document Component
 *
 * Story 7.3: PDF Export Functionality
 *
 * Main PDF document component that combines header, table, and footer with summary totals
 */

import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './pdf-styles'
import { PDFReportHeader, type PDFReportHeaderProps } from './PDFReportHeader'
import { PDFReportTable, type PDFTableColumn } from './PDFReportTable'
import { PDFReportFooter } from './PDFReportFooter'
import { calculateSummary, type SummaryMetrics } from './pdf-utils'

export interface PDFReportDocumentProps {
  header: PDFReportHeaderProps
  columns: PDFTableColumn[]
  data: any[]
  currency?: string
  rowsPerPage?: number
}

/**
 * PDF Report Document
 *
 * Features:
 * - Automatic pagination
 * - Header on all pages
 * - Summary totals on last page only
 * - Page numbers in footer
 * - Professional formatting
 */
export function PDFReportDocument({
  header,
  columns,
  data,
  currency = 'AUD',
  rowsPerPage = 30,
}: PDFReportDocumentProps) {
  // Calculate summary metrics from all data
  const summary: SummaryMetrics = calculateSummary(data)

  // Paginate data
  const pages: any[][] = []
  for (let i = 0; i < data.length; i += rowsPerPage) {
    pages.push(data.slice(i, i + rowsPerPage))
  }

  // Handle empty data
  if (pages.length === 0) {
    pages.push([])
  }

  const totalPages = pages.length

  return (
    <Document>
      {pages.map((pageData, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={pdfStyles.page}>
          {/* Header (on all pages) */}
          <PDFReportHeader {...header} />

          {/* Table for this page */}
          {pageData.length > 0 ? (
            <PDFReportTable data={pageData} columns={columns} currency={currency} />
          ) : (
            <View style={{ marginTop: 20, textAlign: 'center' }}>
              <Text style={{ fontSize: 12, color: '#888' }}>No data available</Text>
            </View>
          )}

          {/* Summary (on last page only) - Task 6 */}
          {pageIndex === totalPages - 1 && data.length > 0 && (
            <PDFReportFooter summary={summary} currency={currency} />
          )}

          {/* Page footer with page number */}
          <View style={pdfStyles.pageFooter} fixed>
            <Text>
              Page {pageIndex + 1} of {totalPages}
            </Text>
            <Text>{header.agencyName || 'Pleeno'}</Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}
