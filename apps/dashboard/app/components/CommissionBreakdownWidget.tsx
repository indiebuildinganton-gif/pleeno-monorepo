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
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      {percentage && <div className="text-xs font-medium mt-2">{percentage}</div>}
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
          <label htmlFor="period-filter" className="block text-xs font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <select
            id="period-filter"
            value={commissionFilters.period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="quarter">This Quarter</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* College Filter */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="college-filter" className="block text-xs font-medium text-gray-700 mb-1">
            College
          </label>
          <select
            id="college-filter"
            value={commissionFilters.college_id || ''}
            onChange={(e) => handleCollegeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Colleges</option>
            {colleges?.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="branch-filter" className="block text-xs font-medium text-gray-700 mb-1">
            Branch
          </label>
          <select
            id="branch-filter"
            value={commissionFilters.branch_id || ''}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!branches || branches.length === 0}
          >
            <option value="">All Branches</option>
            {branches?.map((branch) => (
              <option key={branch.id} value={branch.id}>
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
            className="mt-auto"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Active Filter Count Badge */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
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
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Commission Breakdown by College</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh data"
            aria-label="Refresh commission data"
          >
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            disabled
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to CSV (coming soon)"
            aria-label="Export to CSV (coming soon)"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Date Range Indicator */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Showing: <span className="font-medium">{getDateRangeLabel(commissionFilters.period)}</span>
        </p>
      </div>

      {/* Widget Body */}
      <div className="p-6">
        {/* Loading State */}
        {isLoading && (
          <>
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>

            <FilterControls />
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
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
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                {error instanceof Error
                  ? error.message
                  : 'An error occurred while loading commission data'}
              </p>
              <Button onClick={handleRefresh} variant="outline">
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
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Commission Data</h3>
              <p className="text-sm text-gray-600">
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
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Commission breakdown by college and branch">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">College</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Commissions</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">GST</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Total (+ GST)
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Expected</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Earned</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Outstanding
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionData.map((row, index) => (
                    <tr
                      key={`${row.college_id}-${row.branch_id}`}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        index < 3 ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium">
                          <a
                            href={`/entities/colleges/${row.college_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {row.college_name}
                          </a>
                          {index < 3 && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                              Top {index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`/entities/colleges/${row.college_id}?branch=${row.branch_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {row.branch_name}
                        </a>
                        {row.branch_city && (
                          <div className="text-xs text-gray-500">{row.branch_city}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(row.total_commissions)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600">
                        {formatCurrency(row.total_gst)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(row.total_with_gst)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatCurrency(row.total_expected_commission)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {formatCurrency(row.total_earned_commission)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          row.outstanding_commission > 0 ? 'text-red-600' : 'text-green-600'
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View Plans</span>
                              <span className="text-xs text-gray-500">
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
            <div className="mt-4 text-sm text-gray-500 text-right">
              Showing {commissionData.length} {commissionData.length === 1 ? 'result' : 'results'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CommissionBreakdownWidget
