/**
 * Commissions Report Page
 *
 * Story 7.4: Commission Report by College
 * Task 1: Create Commissions Report Page
 *
 * Features:
 * - Date range filter with preset options (Last 30 days, Last 90 days, This year, Custom)
 * - Optional city filter dropdown
 * - Generate Report button to trigger API call
 * - Placeholder table to display results
 * - Loading state while report generates
 * - Empty state before report generation
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { startOfYear, subDays, formatISO } from 'date-fns'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  useToast,
} from '@pleeno/ui'
import { ChevronDown, ChevronUp, FileText, Download } from 'lucide-react'
import CommissionReportTable from '../../components/CommissionReportTable'
import type { CommissionsReportResponse } from '../../types/commissions-report'

/**
 * Commission Report Filters Schema
 */
const commissionsReportSchema = z
  .object({
    date_from: z.string().min(1, 'Start date is required'),
    date_to: z.string().min(1, 'End date is required'),
    city: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.date_from && data.date_to) {
        return new Date(data.date_from) <= new Date(data.date_to)
      }
      return true
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['date_from'],
    }
  )

type CommissionsReportFormData = z.infer<typeof commissionsReportSchema>

/**
 * Date Range Preset Type
 */
type DatePreset = 'last_30' | 'last_90' | 'this_year' | 'custom'

export default function CommissionsReportPage() {
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false)
  const [isBuilderCollapsed, setIsBuilderCollapsed] = useState(false)
  const [activePreset, setActivePreset] = useState<DatePreset>('this_year')
  const [reportResponse, setReportResponse] = useState<CommissionsReportResponse | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Mock cities data (will be fetched from API in Task 2)
  const cities = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa']

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CommissionsReportFormData>({
    resolver: zodResolver(commissionsReportSchema),
    defaultValues: {
      date_from: formatISO(startOfYear(new Date()), { representation: 'date' }),
      date_to: formatISO(new Date(), { representation: 'date' }),
      city: '',
    },
  })

  const dateFrom = watch('date_from')
  const dateTo = watch('date_to')
  const selectedCity = watch('city')

  /**
   * Handle preset date range selection
   */
  const handlePresetChange = (preset: DatePreset) => {
    const today = new Date()
    setActivePreset(preset)

    switch (preset) {
      case 'last_30':
        setValue('date_from', formatISO(subDays(today, 30), { representation: 'date' }))
        setValue('date_to', formatISO(today, { representation: 'date' }))
        break
      case 'last_90':
        setValue('date_from', formatISO(subDays(today, 90), { representation: 'date' }))
        setValue('date_to', formatISO(today, { representation: 'date' }))
        break
      case 'this_year':
        setValue('date_from', formatISO(startOfYear(today), { representation: 'date' }))
        setValue('date_to', formatISO(today, { representation: 'date' }))
        break
      case 'custom':
        // Keep current values, just mark as custom
        break
    }
  }

  /**
   * Handle manual date change
   */
  const handleDateChange = () => {
    setActivePreset('custom')
  }

  /**
   * Handle form submission - Generate report
   */
  const onSubmit = async (data: CommissionsReportFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/reports/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_from: data.date_from,
          date_to: data.date_to,
          city: data.city || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate report')
      }

      const result: CommissionsReportResponse = await response.json()
      setReportResponse(result)
      setHasGeneratedReport(true)
      setIsBuilderCollapsed(true)

      addToast({
        title: 'Report Generated',
        description: `Your commission report has been generated successfully. Found ${result.data.length} branch${result.data.length !== 1 ? 'es' : ''}.`,
        variant: 'success',
      })
    } catch (error) {
      console.error('Report generation error:', error)
      addToast({
        title: 'Generation Failed',
        description:
          error instanceof Error ? error.message : 'Failed to generate report. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle CSV export
   */
  const handleExportCSV = async () => {
    setIsExporting(true)

    try {
      // Build export URL with query parameters
      const params = new URLSearchParams({
        format: 'csv',
        date_from: dateFrom,
        date_to: dateTo,
      })

      if (selectedCity) {
        params.append('city', selectedCity)
      }

      const exportUrl = `/api/reports/commissions/export?${params.toString()}`

      // Trigger download
      const response = await fetch(exportUrl)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to export report')
      }

      // Get the CSV content and create a blob
      const csvContent = await response.text()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

      // Create download link and trigger it
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `commissions_report_${dateFrom}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({
        title: 'Export Successful',
        description: 'Your commission report has been exported to CSV.',
        variant: 'success',
      })
    } catch (error) {
      console.error('Export error:', error)
      addToast({
        title: 'Export Failed',
        description:
          error instanceof Error ? error.message : 'Failed to export report. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Handle reset filters
   */
  const handleReset = () => {
    const today = new Date()
    reset({
      date_from: formatISO(startOfYear(today), { representation: 'date' }),
      date_to: formatISO(today, { representation: 'date' }),
      city: '',
    })
    setActivePreset('this_year')
    setIsBuilderCollapsed(false)
    setHasGeneratedReport(false)
    setReportResponse(null)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Commission Report by College</h1>
        <p className="text-muted-foreground">
          Generate commission reports grouped by college and branch with location details.
        </p>
      </div>

      {/* Report Builder - Collapsible after first run */}
      <div className="space-y-4">
        {isBuilderCollapsed && hasGeneratedReport && (
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <h2 className="font-semibold">Filters Applied</h2>
              <p className="text-sm text-muted-foreground">
                {reportResponse?.data.length || 0} branch{reportResponse?.data.length !== 1 ? 'es' : ''} found
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsBuilderCollapsed(false)}>
                <ChevronDown className="h-4 w-4 mr-2" />
                Modify Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset Filters
              </Button>
            </div>
          </div>
        )}

        {!isBuilderCollapsed && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Commission Report Builder</CardTitle>
              <CardDescription>
                Select date range and optional city filter to generate your commission report
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Date Range Preset Buttons */}
                <section>
                  <Label className="text-base font-semibold mb-3 block">Date Range</Label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      type="button"
                      size="sm"
                      variant={activePreset === 'last_30' ? 'default' : 'outline'}
                      onClick={() => handlePresetChange('last_30')}
                      aria-pressed={activePreset === 'last_30'}
                      aria-label="Filter last 30 days"
                    >
                      Last 30 Days
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activePreset === 'last_90' ? 'default' : 'outline'}
                      onClick={() => handlePresetChange('last_90')}
                      aria-pressed={activePreset === 'last_90'}
                      aria-label="Filter last 90 days"
                    >
                      Last 90 Days
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activePreset === 'this_year' ? 'default' : 'outline'}
                      onClick={() => handlePresetChange('this_year')}
                      aria-pressed={activePreset === 'this_year'}
                      aria-label="Filter this year"
                    >
                      This Year
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activePreset === 'custom' ? 'default' : 'outline'}
                      onClick={() => handlePresetChange('custom')}
                      aria-pressed={activePreset === 'custom'}
                      aria-label="Custom date range"
                    >
                      Custom
                    </Button>
                  </div>

                  {/* Custom Date Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_from">Date From</Label>
                      <Input
                        {...register('date_from')}
                        id="date_from"
                        type="date"
                        aria-label="Start date for commission report"
                        onChange={(e) => {
                          register('date_from').onChange(e)
                          handleDateChange()
                        }}
                      />
                      {errors.date_from && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.date_from.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_to">Date To</Label>
                      <Input
                        {...register('date_to')}
                        id="date_to"
                        type="date"
                        aria-label="End date for commission report"
                        onChange={(e) => {
                          register('date_to').onChange(e)
                          handleDateChange()
                        }}
                      />
                      {errors.date_to && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.date_to.message}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* City Filter */}
                <section>
                  <div className="space-y-2">
                    <Label htmlFor="city">City (Optional)</Label>
                    <Select
                      id="city"
                      {...register('city')}
                      onChange={(e) => setValue('city', e.target.value)}
                      aria-label="Filter by city"
                    >
                      <option value="">All Cities</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Filter results by branch city location
                    </p>
                  </div>
                </section>

                {/* Action Buttons */}
                <section className="flex gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    aria-label="Generate commission report"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleReset}
                    disabled={isLoading}
                    aria-label="Reset all filters to default values"
                  >
                    Reset Filters
                  </Button>
                </section>
              </form>
            </CardContent>
          </Card>
        )}

        {!isBuilderCollapsed && hasGeneratedReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBuilderCollapsed(true)}
            className="w-full"
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            Hide Filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="space-y-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Generating commission report...</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {hasGeneratedReport && !isLoading && reportResponse && reportResponse.data.length > 0 && (
        <div className="space-y-4">
          {/* Export Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExporting}
              aria-label="Export commission report to CSV"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </div>

          <CommissionReportTable
            data={reportResponse.data}
            summary={reportResponse.summary}
            dateFrom={dateFrom}
            dateTo={dateTo}
            selectedCity={selectedCity}
          />
        </div>
      )}

      {/* Empty State - No report generated yet */}
      {!hasGeneratedReport && !isLoading && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Configure your filters above and click &quot;Generate Report&quot; to view commission
            breakdown.
          </p>
        </div>
      )}

      {/* Empty Results State */}
      {hasGeneratedReport &&
        !isLoading &&
        reportResponse &&
        reportResponse.data.length === 0 && (
          <div className="rounded-lg border p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              No commission data found for the selected date range and filters. Try adjusting your
              filters.
            </p>
          </div>
        )}
    </div>
  )
}
