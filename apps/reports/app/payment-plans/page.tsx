/**
 * Payment Plans Report Page
 *
 * Main page for generating custom payment plans reports with flexible filtering
 * and contract expiration tracking.
 *
 * Epic 7: Payment Plans and Reporting Zone
 * Story 7-1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 2: Create Report Builder UI
 */

'use client'

import { useState } from 'react'
import { ReportBuilder } from '../components/ReportBuilder'
import type { ReportBuilderFormData } from '../validations/report-builder.schema'

export default function PaymentPlansReportPage() {
  const [reportData, setReportData] = useState<ReportBuilderFormData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async (data: ReportBuilderFormData) => {
    setIsGenerating(true)
    console.log('Generating report with data:', data)

    // Simulate API call
    try {
      // In the future, this will call the API:
      // const response = await fetch('/api/reports/payment-plans', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // })
      // const result = await response.json()

      // For now, just store the data to demonstrate form submission
      setReportData(data)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('Report generated successfully!')
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Payment Plans Report</h1>
        <p className="text-muted-foreground mt-2">
          Generate custom reports on payment plans with flexible filtering and contract expiration
          tracking
        </p>
      </div>

      <ReportBuilder onGenerate={handleGenerateReport} />

      {isGenerating && (
        <div className="mt-6 p-6 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm font-medium">Generating report...</p>
          </div>
        </div>
      )}

      {reportData && !isGenerating && (
        <div className="mt-6 p-6 border rounded-lg bg-green-50 dark:bg-green-900/20">
          <h3 className="text-lg font-semibold mb-3 text-green-800 dark:text-green-200">
            Report Generated Successfully!
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Selected Columns:</strong> {reportData.columns.length} column(s)
            </p>
            <p>
              <strong>Columns:</strong> {reportData.columns.join(', ')}
            </p>
            {reportData.filters.date_from && (
              <p>
                <strong>Date From:</strong> {reportData.filters.date_from}
              </p>
            )}
            {reportData.filters.date_to && (
              <p>
                <strong>Date To:</strong> {reportData.filters.date_to}
              </p>
            )}
            {reportData.filters.contract_expiration_from && (
              <p>
                <strong>Contract Expiration From:</strong>{' '}
                {reportData.filters.contract_expiration_from}
              </p>
            )}
            {reportData.filters.contract_expiration_to && (
              <p>
                <strong>Contract Expiration To:</strong> {reportData.filters.contract_expiration_to}
              </p>
            )}
            {reportData.filters.status && reportData.filters.status.length > 0 && (
              <p>
                <strong>Status Filter:</strong> {reportData.filters.status.join(', ')}
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Note: This is a demonstration. The actual report results will be displayed here once
              the API is implemented (Task 3).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
