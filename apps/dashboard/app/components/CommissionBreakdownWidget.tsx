/**
 * CommissionBreakdownWidget Component
 *
 * Self-contained widget displaying commission breakdown by college/branch.
 * Features:
 * - Widget header with title, refresh button, and export button (placeholder)
 * - Date range indicator showing selected time period
 * - Summary metrics cards (total commissions, GST, amount, outstanding)
 * - Filter controls (time period, college, branch)
 * - Commission breakdown table with drill-down links
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 6: Add Widget Header and Controls
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@pleeno/stores'
import { formatCurrency, getDateRangeLabel } from '@pleeno/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'
import { getApiUrl } from '../hooks/useApiUrl'
import {
  RefreshCw,
  Download,
  AlertTriangle,
  X,
  Filter,
  Eye,
  DollarSign,
  Receipt,
  Calculator,
  Clock,
} from 'lucide-react'

import { useMemo } from 'react'
import { cn } from '@pleeno/ui'

/**
 * Commission breakdown data type
 */
interface CommissionBreakdown {
  college_id: string
  college_name: string
  branch_id: string
  branch_name: string
  branch_city: string | null
  total_commissions: number
  total_gst: number
  total_with_gst: number
  total_expected_commission: number
  total_earned_commission: number
  outstanding_commission: number
  payment_plan_count: number
}

/**
 * College data type
 */
interface College {
  id: string
  name: string
}

/**
 * Branch data type
 */
interface Branch {
  id: string
  name: string
  city?: string
  college_id: string
}

/**
 * API Response Type
 */
interface ApiResponse<T> {
  success: boolean
  data: T
}

/**
 * Fetch commission breakdown data
 */
async function fetchCommissionBreakdown(
  period: string,
  collegeId: string | null,
  branchId: string | null
): Promise<CommissionBreakdown[]> {
  const params = new URLSearchParams({ period })
  if (collegeId) params.set('college_id', collegeId)
  if (branchId) params.set('branch_id', branchId)

  const response = await fetch(getApiUrl(`/api/commission-by-college?${params}`))
  if (!response.ok) {
    throw new Error('Failed to fetch commission breakdown')
  }

  const result: ApiResponse<CommissionBreakdown[]> = await response.json()
  return result.data
}

/**
 * Fetch colleges
 */
async function fetchColleges(): Promise<College[]> {
  const response = await fetch(getApiUrl('/api/entities/colleges'))
  if (!response.ok) {
    throw new Error('Failed to fetch colleges')
  }

  const result: ApiResponse<College[]> = await response.json()
  return result.data
}

/**
 * Fetch branches (optionally filtered by college)
 */
async function fetchBranches(collegeId: string | null): Promise<Branch[]> {
  const params = new URLSearchParams()
  if (collegeId) params.set('college_id', collegeId)

  const response = await fetch(getApiUrl(`/api/entities/branches?${params}`))
  if (!response.ok) {
    throw new Error('Failed to fetch branches')
  }

  const result: ApiResponse<Branch[]> = await response.json()
  return result.data
}

/**
 * Summary Card Props
 */
interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: 'green' | 'blue' | 'gray' | 'red'
  percentage?: string
}

/**
 * SummaryCard Component
 * Displays a summary metric card with title, value, and optional percentage
 */
function SummaryCard({ title, value, subtitle, icon, color, percentage }: SummaryCardProps) {
  // Using arbitrary hex values to bypass global dark mode overrides
  const colorClasses = {
    green: 'bg-[#f0fdf4] border-[#bbf7d0] dark:bg-green-900/20 dark:border-green-900/30',
    blue: 'bg-[#eff6ff] border-[#bfdbfe] dark:bg-blue-900/20 dark:border-blue-900/30',
    gray: 'bg-[#f9fafb] border-[#e5e7eb] dark:bg-gray-800/50 dark:border-gray-700',
    red: 'bg-[#fef2f2] border-[#fecaca] dark:bg-red-900/20 dark:border-red-900/30',
  }

  const iconColorClasses = {
    green: 'text-[#15803d] dark:text-green-400',
    blue: 'text-[#1d4ed8] dark:text-blue-400',
    gray: 'text-[#374151] dark:text-gray-400',
    red: 'text-[#b91c1c] dark:text-red-400',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">{title}</h3>
        <div className={iconColorClasses[color]}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>}
      {percentage && <div className="text-xs font-medium text-gray-900 dark:text-gray-200 mt-2">{percentage}</div>}
    </div>
  )
}

/**
 * Filter Controls Component
 */
function FilterControls() {
  const { commissionFilters, setCommissionFilters, clearCommissionFilters } = useDashboardStore()

  // Fetch colleges
  const { data: colleges } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => fetchColleges(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch branches (filtered by selected college if any)
  const { data: branches } = useQuery({
    queryKey: ['branches', commissionFilters.college_id],
    queryFn: () => fetchBranches(commissionFilters.college_id),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Calculate active filter count
  const activeFilterCount = [
    commissionFilters.period !== 'all',
    commissionFilters.college_id !== null,
    commissionFilters.branch_id !== null,
  ].filter(Boolean).length

  // Handle filter changes
  const handlePeriodChange = (period: string) => {
    setCommissionFilters({
      period: period as 'all' | 'year' | 'quarter' | 'month',
    })
  }

  const handleCollegeChange = (collegeId: string) => {
    setCommissionFilters({
      college_id: collegeId || null,
      branch_id: null, // Reset branch when college changes
    })
  }

  const handleBranchChange = (branchId: string) => {
    setCommissionFilters({ branch_id: branchId || null })
  }

  const handleClearFilters = () => {
    clearCommissionFilters()
  }

  const isDefaultState =
    commissionFilters.period === 'all' &&
    !commissionFilters.college_id &&
    !commissionFilters.branch_id

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Time Period Dropdown */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="period-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
            Time Period
          </label>
          <select
            id="period-filter"
            value={commissionFilters.period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
          >
            <option value="all" className="text-[#000000]">All Time</option>
            <option value="year" className="text-[#000000]">This Year</option>
            <option value="quarter" className="text-[#000000]">This Quarter</option>
            <option value="month" className="text-[#000000]">This Month</option>
          </select>
        </div>

        {/* College Filter */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="college-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
            College
          </label>
          <select
            id="college-filter"
            value={commissionFilters.college_id || ''}
            onChange={(e) => handleCollegeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
          >
            <option value="" className="text-[#000000]">All Colleges</option>
            {colleges?.map((college) => (
              <option key={college.id} value={college.id} className="text-[#000000]">
                {college.name}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="branch-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
            Branch
          </label>
          <select
            id="branch-filter"
            value={commissionFilters.branch_id || ''}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
            disabled={!branches || branches.length === 0}
          >
            <option value="" className="text-[#000000]">All Branches</option>
            {branches?.map((branch) => (
              <option key={branch.id} value={branch.id} className="text-[#000000]">
                {branch.name} {branch.city ? `- ${branch.city}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <Button
            onClick={handleClearFilters}
            disabled={isDefaultState}
            variant="outline"
            size="sm"
            className="mt-auto text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Active Filter Count Badge */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#dbeafe] text-[#1e40af] rounded-md">
            <Filter className="w-3 h-3" />
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * CommissionBreakdownWidget Component
 */
export function CommissionBreakdownWidget({ className }: { className?: string }) {
  const { commissionFilters } = useDashboardStore()

  // Fetch commission breakdown data
  const {
    data: commissionData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['commission-breakdown', commissionFilters],
    queryFn: () =>
      fetchCommissionBreakdown(
        commissionFilters.period,
        commissionFilters.college_id,
        commissionFilters.branch_id
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Determine currency (default to AUD for now)
  const currency = 'AUD'

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!commissionData || commissionData.length === 0) {
      return {
        totalCommissions: 0,
        totalGST: 0,
        totalAmount: 0,
        outstandingCommission: 0,
        commissionPercentage: 0,
        gstPercentage: 0,
      }
    }

    const totalCommissions = commissionData.reduce(
      (sum, row) => sum + row.total_earned_commission,
      0
    )
    const totalGST = commissionData.reduce((sum, row) => sum + row.total_gst, 0)
    const totalAmount = totalCommissions + totalGST
    const outstandingCommission = commissionData.reduce(
      (sum, row) => sum + row.outstanding_commission,
      0
    )

    const commissionPercentage = totalAmount > 0 ? (totalCommissions / totalAmount) * 100 : 0
    const gstPercentage = totalAmount > 0 ? (totalGST / totalAmount) * 100 : 0

    return {
      totalCommissions,
      totalGST,
      totalAmount,
      outstandingCommission,
      commissionPercentage,
      gstPercentage,
    }
  }, [commissionData])

  // Handle refresh
  const handleRefresh = () => {
    refetch()
  }

  return (
    <Card className={cn('w-full bg-white dark:bg-background-dark border-gray-200 dark:border-gray-800', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Commission Breakdown by College</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="h-8 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Refresh data"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
            title="Export to CSV (coming soon)"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>

      <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-800">
        <p className="text-sm text-gray-700 dark:text-gray-400">
          Showing: <span className="font-medium text-gray-900 dark:text-gray-200">{getDateRangeLabel(commissionFilters.period)}</span>
        </p>
      </div>

      <CardContent className="p-6">
        {/* Loading State */}
        {isLoading && (
          <>
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-[#f3f4f6] rounded-lg animate-pulse" />
              ))}
            </div>

            <FilterControls />
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#f9fafb] animate-pulse rounded" />
              ))}
            </div>
          </>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <>
            {/* Summary Cards with Zero Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                title="Total Commissions Earned"
                value={formatCurrency(0)}
                color="green"
                icon={<DollarSign className="h-5 w-5" />}
                subtitle="No data available"
              />
              <SummaryCard
                title="Total GST"
                value={formatCurrency(0)}
                color="blue"
                icon={<Receipt className="h-5 w-5" />}
                subtitle="No data available"
              />
              <SummaryCard
                title="Total Amount (Commission + GST)"
                value={formatCurrency(0)}
                color="gray"
                icon={<Calculator className="h-5 w-5" />}
                subtitle="No data available"
              />
              <SummaryCard
                title="Outstanding Commission"
                value={formatCurrency(0)}
                color="red"
                icon={<Clock className="h-5 w-5" />}
                subtitle="No data available"
              />
            </div>

            <FilterControls />
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-[#ef4444] mb-4" />
              <h3 className="text-lg font-semibold text-[#000000] mb-2">Failed to Load Data</h3>
              <p className="text-sm text-[#6b7280] mb-4">
                {error instanceof Error
                  ? error.message
                  : 'An error occurred while loading commission data'}
              </p>
              <Button onClick={handleRefresh} variant="outline" className="text-[#000000] border-[#d1d5db]">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!commissionData || commissionData.length === 0) && (
          <>
            {/* Summary Cards with Zero Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                title="Total Commissions Earned"
                value={formatCurrency(0)}
                color="green"
                icon={<DollarSign className="h-5 w-5" />}
                subtitle="No data available"
              />
              <SummaryCard
                title="Total GST"
                value={formatCurrency(0)}
                color="blue"
                icon={<Receipt className="h-5 w-5" />}
                subtitle="No data available"
              />
              <SummaryCard
                title="Total Amount (Commission + GST)"
                value={formatCurrency(0)}
                color="gray"
                icon={<Calculator className="h-5 w-5" />}
                subtitle="No data available"
              />
              <SummaryCard
                title="Outstanding Commission"
                value={formatCurrency(0)}
                color="red"
                icon={<Clock className="h-5 w-5" />}
                subtitle="No data available"
              />
            </div>

            <FilterControls />
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-[#9ca3af]" />
              </div>
              <h3 className="text-lg font-semibold text-[#000000] mb-2">No Commission Data</h3>
              <p className="text-sm text-[#6b7280]">
                No commission data available for the selected filters. Try adjusting your filters.
              </p>
            </div>
          </>
        )}

        {/* Data Loaded Successfully */}
        {!isLoading && !error && commissionData && commissionData.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                title="Total Commissions Earned"
                value={formatCurrency(summaryMetrics.totalCommissions)}
                color="green"
                percentage={`${summaryMetrics.commissionPercentage.toFixed(1)}% of total`}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <SummaryCard
                title="Total GST"
                value={formatCurrency(summaryMetrics.totalGST)}
                color="blue"
                percentage={`${summaryMetrics.gstPercentage.toFixed(1)}% of total`}
                icon={<Receipt className="h-5 w-5" />}
              />
              <SummaryCard
                title="Total Amount (Commission + GST)"
                value={formatCurrency(summaryMetrics.totalAmount)}
                color="gray"
                subtitle={`${summaryMetrics.commissionPercentage.toFixed(0)}% + ${summaryMetrics.gstPercentage.toFixed(0)}%`}
                icon={<Calculator className="h-5 w-5" />}
              />
              <SummaryCard
                title="Outstanding Commission"
                value={formatCurrency(summaryMetrics.outstandingCommission)}
                color="red"
                subtitle="Not yet received"
                icon={<Clock className="h-5 w-5" />}
              />
            </div>

            <FilterControls />

            {/* Table */}
            <div className="mt-6 overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm" role="table" aria-label="Commission breakdown by college and branch">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">College</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">Branch</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">Commissions</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">GST</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">
                      Total (+ GST)
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">Expected</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">Earned</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">
                      Outstanding
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-background-dark">
                  {commissionData.map((row, index) => (
                    <tr
                      key={`${row.college_id}-${row.branch_id}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-white dark:bg-background-dark"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium">
                          <a
                            href={`/entities/colleges/${row.college_id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {row.college_name}
                          </a>
                          {index < 3 && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-[#fef9c3] text-[#854d0e] rounded font-medium">
                              Top {index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`/entities/colleges/${row.college_id}?branch=${row.branch_id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {row.branch_name}
                        </a>
                        {row.branch_city && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{row.branch_city}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(row.total_commissions)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                        {formatCurrency(row.total_gst)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(row.total_with_gst)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400 font-medium">
                        {formatCurrency(row.total_expected_commission)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-green-700 dark:text-green-400">
                        {formatCurrency(row.total_earned_commission)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          row.outstanding_commission > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                        }`}
                      >
                        {formatCurrency(row.outstanding_commission)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <a
                            href={`/payments/plans?college=${row.college_id}&branch=${row.branch_id}`}
                            title={`View ${row.payment_plan_count} payment plan${
                              row.payment_plan_count !== 1 ? 's' : ''
                            } for ${row.college_name} - ${row.branch_name}`}
                          >
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 font-medium"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View Plans</span>
                              <span className="text-xs text-[#6b7280]">
                                ({row.payment_plan_count})
                              </span>
                            </button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer info */}
            <div className="mt-4 text-sm text-[#6b7280] text-right font-medium">
              Showing {commissionData.length} {commissionData.length === 1 ? 'result' : 'results'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CommissionBreakdownWidget
