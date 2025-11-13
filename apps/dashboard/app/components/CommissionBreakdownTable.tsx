/**
 * CommissionBreakdownTable Component
 *
 * Displays commission breakdown by college and branch with filtering capabilities.
 * Includes filter controls for time period, college, and branch.
 * Provides drill-down links to college details and payment plans.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 2: Create CommissionBreakdownTable Component
 * Task 3: Implement Filter Controls
 * Task 4: Implement Drill-Down to Payment Plans
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@pleeno/stores'
import { formatCurrency, getDateRangeLabel } from '@pleeno/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'
import { RefreshCw, AlertTriangle, X, Filter, Eye } from 'lucide-react'
import Link from 'next/link'

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

  const response = await fetch(`/api/commission-by-college?${params}`)
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
  const response = await fetch('/api/entities/colleges')
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

  const response = await fetch(`/api/entities/branches?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch branches')
  }

  const result: ApiResponse<Branch[]> = await response.json()
  return result.data
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

      {/* Active Filter Count Badge & Date Range Indicator */}
      <div className="flex items-center gap-4 text-sm">
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
            <Filter className="w-3 h-3" />
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
        )}
        <span className="text-gray-600">
          Showing:{' '}
          <span className="font-medium">{getDateRangeLabel(commissionFilters.period)}</span>
        </span>
      </div>
    </div>
  )
}

/**
 * Commission Breakdown Table Component
 */
export function CommissionBreakdownTable() {
  const { commissionFilters } = useDashboardStore()

  // Fetch commission breakdown data
  const {
    data: commissionData,
    isLoading,
    error,
    refetch,
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

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown by College</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterControls />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown by College</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterControls />
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              {error instanceof Error
                ? error.message
                : 'An error occurred while loading commission data'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle empty state
  if (!commissionData || commissionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown by College</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Commission Breakdown by College</CardTitle>
        <Button onClick={() => refetch()} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <FilterControls />

        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">College</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Commissions</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">GST</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total (+ GST)</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Expected</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Earned</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Outstanding</th>
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
                      <Link
                        href={`/entities/colleges/${row.college_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {row.college_name}
                      </Link>
                      {index < 3 && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                          Top {index + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/entities/colleges/${row.college_id}?branch=${row.branch_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {row.branch_name}
                    </Link>
                    {row.branch_city && (
                      <div className="text-xs text-gray-500">{row.branch_city}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatCurrency(row.total_commissions, currency)}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-600">
                    {formatCurrency(row.total_gst, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {formatCurrency(row.total_with_gst, currency)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(row.total_expected_commission, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">
                    {formatCurrency(row.total_earned_commission, currency)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-medium ${
                      row.outstanding_commission > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(row.outstanding_commission, currency)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center">
                      <Link
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
                          <span className="text-xs text-gray-500">({row.payment_plan_count})</span>
                        </button>
                      </Link>
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
      </CardContent>
    </Card>
  )
}

export default CommissionBreakdownTable
