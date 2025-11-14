/**
 * Commission Report Table Component
 *
 * Story 7.4: Commission Report by College
 * Task 3: Display Commission Report Results
 *
 * Features:
 * - Grouped display by college with visual separation
 * - Expandable drill-down to show student payment plans
 * - Currency formatting for all financial values
 * - Highlighted outstanding commissions
 * - Summary totals row
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@pleeno/ui'
import type {
  CommissionReportRow,
  CommissionsSummary,
} from '../types/commissions-report'

interface CommissionReportTableProps {
  data: CommissionReportRow[]
  summary: CommissionsSummary
  dateFrom: string
  dateTo: string
  selectedCity?: string
}

/**
 * Format number as currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Group commission data by college
 */
function groupByCollege(data: CommissionReportRow[]) {
  const grouped: Record<string, CommissionReportRow[]> = {}

  data.forEach((row) => {
    if (!grouped[row.college_name]) {
      grouped[row.college_name] = []
    }
    grouped[row.college_name].push(row)
  })

  return grouped
}

export default function CommissionReportTable({
  data,
  summary,
  dateFrom,
  dateTo,
  selectedCity,
}: CommissionReportTableProps) {
  // Track expanded branches for drill-down
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())

  /**
   * Toggle branch expansion
   */
  const toggleBranch = (branchId: string) => {
    const newExpanded = new Set(expandedBranches)
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId)
    } else {
      newExpanded.add(branchId)
    }
    setExpandedBranches(newExpanded)
  }

  // Group data by college
  const groupedData = groupByCollege(data)
  const collegeNames = Object.keys(groupedData).sort()

  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">
          No commission data found for the selected date range and filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Commission Report Results</h2>
          <p className="text-sm text-muted-foreground">
            Report period: {dateFrom} to {dateTo}
            {selectedCity && ` • City: ${selectedCity}`}
          </p>
        </div>
      </div>

      {/* Commission Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-8"></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">College / Branch</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">City</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total Paid</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Rate %</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Earned Commission
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Outstanding Commission
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {collegeNames.map((collegeName) => {
                  const branches = groupedData[collegeName]

                  return (
                    <tr key={collegeName} className="group">
                      <td colSpan={7} className="p-0">
                        {/* College Header Row */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-3 border-b">
                          <h3 className="font-semibold text-sm">{collegeName}</h3>
                        </div>

                        {/* Branch Rows */}
                        <table className="w-full">
                          <tbody>
                            {branches.map((branch) => {
                              const isExpanded = expandedBranches.has(branch.branch_id)
                              const hasPaymentPlans = branch.payment_plans.length > 0

                              return (
                                <tr key={branch.branch_id}>
                                  <td colSpan={7} className="p-0">
                                    {/* Branch Row - Clickable */}
                                    <div
                                      className={`
                                        grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4
                                        px-4 py-3 hover:bg-muted/50 transition-colors
                                        ${hasPaymentPlans ? 'cursor-pointer' : ''}
                                      `}
                                      onClick={() =>
                                        hasPaymentPlans && toggleBranch(branch.branch_id)
                                      }
                                      role={hasPaymentPlans ? 'button' : undefined}
                                      aria-expanded={hasPaymentPlans ? isExpanded : undefined}
                                      tabIndex={hasPaymentPlans ? 0 : undefined}
                                      onKeyDown={(e) => {
                                        if (
                                          hasPaymentPlans &&
                                          (e.key === 'Enter' || e.key === ' ')
                                        ) {
                                          e.preventDefault()
                                          toggleBranch(branch.branch_id)
                                        }
                                      }}
                                    >
                                      {/* Expand/Collapse Icon */}
                                      <div className="flex items-center w-8">
                                        {hasPaymentPlans ? (
                                          isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                          )
                                        ) : null}
                                      </div>

                                      {/* Branch Name */}
                                      <div className="text-sm text-left pl-2">
                                        {branch.branch_name}
                                      </div>

                                      {/* City */}
                                      <div className="text-sm text-left">{branch.branch_city}</div>

                                      {/* Total Paid */}
                                      <div className="text-sm text-right font-medium">
                                        {formatCurrency(branch.total_paid)}
                                      </div>

                                      {/* Commission Rate */}
                                      <div className="text-sm text-right">
                                        {branch.commission_rate_percent}%
                                      </div>

                                      {/* Earned Commission */}
                                      <div className="text-sm text-right font-medium text-green-600 dark:text-green-400">
                                        {formatCurrency(branch.earned_commission)}
                                      </div>

                                      {/* Outstanding Commission */}
                                      <div
                                        className={`text-sm text-right font-medium ${
                                          branch.outstanding_commission > 0
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-muted-foreground'
                                        }`}
                                      >
                                        {formatCurrency(branch.outstanding_commission)}
                                      </div>
                                    </div>

                                    {/* Expanded Student Payment Plans */}
                                    {isExpanded && hasPaymentPlans && (
                                      <div className="bg-muted/30 border-t">
                                        <div className="px-4 py-3">
                                          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                            Student Payment Plans ({branch.payment_plans.length})
                                          </h4>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                              <thead className="border-b">
                                                <tr className="text-xs text-muted-foreground">
                                                  <th className="text-left pb-2 font-medium">
                                                    Student Name
                                                  </th>
                                                  <th className="text-left pb-2 font-medium">
                                                    Payment Plan ID
                                                  </th>
                                                  <th className="text-right pb-2 font-medium">
                                                    Total Amount
                                                  </th>
                                                  <th className="text-right pb-2 font-medium">
                                                    Paid Amount
                                                  </th>
                                                  <th className="text-right pb-2 font-medium">
                                                    Commission Earned
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y">
                                                {branch.payment_plans.map((plan) => (
                                                  <tr
                                                    key={plan.payment_plan_id}
                                                    className="hover:bg-muted/50"
                                                  >
                                                    <td className="py-2">{plan.student_name}</td>
                                                    <td className="py-2 font-mono text-xs">
                                                      {plan.payment_plan_id.slice(0, 8)}...
                                                    </td>
                                                    <td className="py-2 text-right">
                                                      {formatCurrency(plan.total_amount)}
                                                    </td>
                                                    <td className="py-2 text-right">
                                                      {formatCurrency(plan.paid_amount)}
                                                    </td>
                                                    <td className="py-2 text-right text-green-600 dark:text-green-400">
                                                      {formatCurrency(plan.commission_earned)}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Summary Footer */}
              <tfoot className="bg-muted border-t-2">
                <tr className="font-semibold">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(summary.total_paid)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">-</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                    {formatCurrency(summary.total_earned)}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm text-right ${
                      summary.total_outstanding > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatCurrency(summary.total_outstanding)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
