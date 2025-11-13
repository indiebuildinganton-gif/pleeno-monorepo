/**
 * ReportResultsTable Component
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 4: Create Report Results Table Component
 *
 * Features:
 * - TanStack Table with sorting on all columns
 * - Server-side pagination with page size selector
 * - Contract expiration highlighting (red/orange/yellow rows)
 * - Summary totals footer
 * - Currency and date formatting
 * - Loading skeleton and empty states
 */

'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Column,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@pleeno/ui/src/components/ui/table'
import { Button } from '@pleeno/ui/src/components/ui/button'
import { Badge } from '@pleeno/ui/src/components/ui/badge'
import { Select } from '@pleeno/ui/src/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@pleeno/ui/src/components/ui/card'
import { formatCurrency } from '@pleeno/utils/src/formatters'

import type {
  PaymentPlanReportRow,
  PaginationMetadata,
  ReportSummary,
  PaymentPlanStatus,
} from '../types/payment-plans-report'
import { ContractExpirationBadge } from './ContractExpirationBadge'

interface ReportResultsTableProps {
  data: PaymentPlanReportRow[]
  pagination: PaginationMetadata
  summary: ReportSummary
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSort: (column: string, direction: 'asc' | 'desc') => void
  isLoading?: boolean
}

/**
 * Status badge with color coding
 */
function StatusBadge({ status }: { status: PaymentPlanStatus }) {
  const variants: Record<PaymentPlanStatus, 'success' | 'gray' | 'destructive'> = {
    active: 'success',
    completed: 'gray',
    cancelled: 'destructive',
  }

  const labels: Record<PaymentPlanStatus, string> = {
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

/**
 * Sortable column header with keyboard navigation
 */
function SortableHeader({
  column,
  children,
}: {
  column: Column<PaymentPlanReportRow, unknown>
  children: React.ReactNode
}) {
  const sortDirection = column.getIsSorted()

  return (
    // eslint-disable-next-line jsx-a11y/role-supports-aria-props
    <button
      className="flex items-center gap-2 font-medium hover:text-foreground"
      onClick={() => column.toggleSorting()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          column.toggleSorting()
        }
      }}
      tabIndex={0}
      aria-sort={
        sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none'
      }
      aria-label={`Sort by ${children}${
        sortDirection
          ? `, currently sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
          : ''
      }`}
    >
      {children}
      {sortDirection === 'asc' ? (
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
      ) : sortDirection === 'desc' ? (
        <ArrowDown className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" aria-hidden="true" />
      )}
    </button>
  )
}

/**
 * Loading skeleton row
 */
function SkeletonRow({ columns }: { columns: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-muted animate-pulse rounded" />
        </TableCell>
      ))}
    </TableRow>
  )
}

export function ReportResultsTable({
  data,
  pagination,
  summary,
  onPageChange,
  onPageSizeChange,
  onSort,
  isLoading = false,
}: ReportResultsTableProps) {
  // Define table columns
  const columns = useMemo<ColumnDef<PaymentPlanReportRow>[]>(
    () => [
      {
        accessorKey: 'student_name',
        header: ({ column }) => <SortableHeader column={column}>Student Name</SortableHeader>,
      },
      {
        accessorKey: 'college_name',
        header: ({ column }) => <SortableHeader column={column}>College</SortableHeader>,
      },
      {
        accessorKey: 'branch_name',
        header: ({ column }) => <SortableHeader column={column}>Branch</SortableHeader>,
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'program_name',
        header: ({ column }) => <SortableHeader column={column}>Program</SortableHeader>,
      },
      {
        accessorKey: 'plan_amount',
        header: ({ column }) => <SortableHeader column={column}>Plan Amount</SortableHeader>,
        cell: ({ getValue, row }) => formatCurrency(getValue() as number, row.original.currency),
      },
      {
        accessorKey: 'total_paid',
        header: ({ column }) => <SortableHeader column={column}>Total Paid</SortableHeader>,
        cell: ({ getValue, row }) => formatCurrency(getValue() as number, row.original.currency),
      },
      {
        accessorKey: 'earned_commission',
        header: ({ column }) => <SortableHeader column={column}>Commission</SortableHeader>,
        cell: ({ getValue, row }) => formatCurrency(getValue() as number, row.original.currency),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ getValue }) => <StatusBadge status={getValue() as PaymentPlanStatus} />,
      },
      {
        accessorKey: 'contract_expiration_date',
        header: ({ column }) => (
          <SortableHeader column={column}>Contract Expiration</SortableHeader>
        ),
        cell: ({ getValue, row }) => {
          const date = getValue() as string | null
          if (!date) return '-'

          return (
            <div className="flex items-center gap-2">
              <span>{format(new Date(date), 'MMM dd, yyyy')}</span>
              {row.original.days_until_contract_expiration !== null && (
                <ContractExpirationBadge days={row.original.days_until_contract_expiration} />
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  // Setup TanStack Table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination.total_pages,
    state: {
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.page_size,
      },
    },
    onSortingChange: (updater) => {
      if (typeof updater === 'function') {
        const newSorting = updater([])
        if (newSorting.length > 0) {
          const sort = newSorting[0]
          onSort(sort.id, sort.desc ? 'desc' : 'asc')
        }
      }
    },
  })

  /**
   * Determine row highlighting based on contract expiration status
   * Colors meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text)
   */
  const getRowClassName = (row: PaymentPlanReportRow): string => {
    if (row.contract_status === 'expired') {
      // Red: Expired contracts - High contrast red background with dark text
      return 'bg-red-50 text-red-950 border-l-4 border-l-red-600 dark:bg-red-950 dark:text-red-50 dark:border-l-red-400'
    }
    if (row.days_until_contract_expiration !== null && row.days_until_contract_expiration < 7) {
      // Orange: Expiring within 7 days - High contrast orange background with dark text
      return 'bg-orange-50 text-orange-950 border-l-4 border-l-orange-600 dark:bg-orange-950 dark:text-orange-50 dark:border-l-orange-400'
    }
    if (row.days_until_contract_expiration !== null && row.days_until_contract_expiration < 30) {
      // Yellow: Expiring within 30 days - High contrast yellow background with dark text
      return 'bg-yellow-50 text-yellow-950 border-l-4 border-l-yellow-600 dark:bg-yellow-950 dark:text-yellow-50 dark:border-l-yellow-400'
    }
    return ''
  }

  // Calculate display range for "Showing X-Y of Z"
  const startIndex = (pagination.page - 1) * pagination.page_size + 1
  const endIndex = Math.min(pagination.page * pagination.page_size, pagination.total_count)

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          // Loading state - show skeleton cards
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : data.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No payment plans match the selected filters
            </CardContent>
          </Card>
        ) : (
          // Data cards
          data.map((row) => (
            <Card key={row.id} className={getRowClassName(row)}>
              <CardHeader>
                <CardTitle className="text-lg">{row.student_name}</CardTitle>
                <CardDescription>
                  {row.college_name}
                  {row.branch_name && ` • ${row.branch_name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plan Amount</span>
                    <span className="font-medium">
                      {formatCurrency(row.plan_amount, row.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Paid</span>
                    <span className="font-medium">
                      {formatCurrency(row.total_paid, row.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Commission</span>
                    <span className="font-medium">
                      {formatCurrency(row.earned_commission, row.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <StatusBadge status={row.status} />
                  </div>
                  {row.contract_expiration_date && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Contract Expiration</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm">
                          {format(new Date(row.contract_expiration_date), 'MMM dd, yyyy')}
                        </span>
                        {row.days_until_contract_expiration !== null && (
                          <ContractExpirationBadge days={row.days_until_contract_expiration} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border">
        <Table aria-label="Payment plans report">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Loading state - show skeleton rows
              <>
                <SkeletonRow columns={columns.length} />
                <SkeletonRow columns={columns.length} />
                <SkeletonRow columns={columns.length} />
                <SkeletonRow columns={columns.length} />
                <SkeletonRow columns={columns.length} />
              </>
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No payment plans match the selected filters
                </TableCell>
              </TableRow>
            ) : (
              // Data rows with expiration highlighting
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={getRowClassName(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>

          {/* Summary Totals Footer */}
          {!isLoading && data.length > 0 && (
            <TableFooter className="sticky bottom-0 bg-muted/80 backdrop-blur">
              <TableRow>
                <TableCell colSpan={4} className="font-bold">
                  Totals (All Pages)
                </TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(summary.total_plan_amount, 'USD')}
                </TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(summary.total_paid_amount, 'USD')}
                </TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(summary.total_commission, 'USD')}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && data.length > 0 && (
        <nav
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
          aria-label="Report pagination"
        >
          {/* Results count and page size selector */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Showing {startIndex}-{endIndex} of {pagination.total_count} results
            </div>

            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="text-sm text-muted-foreground">
                  Rows per page:
                </label>
                <Select
                  id="page-size"
                  value={pagination.page_size.toString()}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="w-20"
                  aria-label="Select number of rows per page"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>
            )}
          </div>

          {/* Page navigation */}
          <div
            className="flex items-center gap-2"
            role="navigation"
            aria-label="Pagination navigation"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={pagination.page === 1}
              aria-label="Go to first page"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              aria-label="Go to previous page"
            >
              Previous
            </Button>

            <div className="flex items-center gap-2 px-2">
              <span className="text-sm text-muted-foreground" aria-current="page">
                Page {pagination.page} of {pagination.total_pages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              aria-label="Go to next page"
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.total_pages)}
              disabled={pagination.page === pagination.total_pages}
              aria-label="Go to last page"
            >
              Last
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
