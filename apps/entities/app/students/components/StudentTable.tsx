'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Receipt } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@pleeno/ui/src/components/ui/table'
import { Badge } from '@pleeno/ui/src/components/ui/badge'
import { Button } from '@pleeno/ui/src/components/ui/button'
import { useRouter } from 'next/navigation'
import { getRelativeTime } from '@pleeno/utils'
import type { Student, PaginationMeta } from '../../../hooks/useStudents'
import Link from 'next/link'

interface StudentTableProps {
  data: Student[]
  pagination: PaginationMeta
  onPageChange: (page: number) => void
  isLoading?: boolean
}

function SortableHeader({
  column,
  children,
}: {
  column: any
  children: React.ReactNode
}) {
  return (
    <button
      className="flex items-center gap-2 font-medium hover:text-foreground"
      onClick={() => column.toggleSorting()}
    >
      {children}
      {column.getIsSorted() === 'asc' ? (
        <ArrowUp className="h-4 w-4" />
      ) : column.getIsSorted() === 'desc' ? (
        <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  )
}

/**
 * VisaStatusBadge Component
 *
 * Displays visa status with color coding:
 * - Denied: red (destructive)
 * - In Process: blue (default)
 * - Approved: green (success)
 * - Expired: gray (secondary)
 */
function VisaStatusBadge({ status }: { status: Student['visa_status'] }) {
  if (!status) {
    return <span className="text-muted-foreground">—</span>
  }

  const badgeConfig = {
    denied: { variant: 'destructive' as const, label: 'Denied' },
    in_process: { variant: 'default' as const, label: 'In Process' },
    approved: { variant: 'success' as const, label: 'Approved' },
    expired: { variant: 'secondary' as const, label: 'Expired' },
  }

  const config = badgeConfig[status]

  return <Badge variant={config.variant}>{config.label}</Badge>
}

/**
 * CollegeBranchCell Component
 *
 * Displays college and branch information in two-line format:
 * Line 1: "College Name"
 * Line 2: "Branch (City)"
 */
function CollegeBranchCell({
  enrollment,
}: {
  enrollment: Student['latest_enrollment']
}) {
  if (!enrollment || !enrollment.college_name) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="space-y-0.5">
      <div className="font-medium">{enrollment.college_name}</div>
      <div className="text-sm text-muted-foreground">
        {enrollment.branch_name}
        {enrollment.branch_city && ` (${enrollment.branch_city})`}
      </div>
    </div>
  )
}

/**
 * StudentTable Component
 *
 * Displays a sortable, paginated table of students with:
 * - Full Name, Email, Visa Status (badge), College/Branch (2 lines), Updated (relative)
 * - Clickable rows to navigate to student details
 * - Pagination controls
 *
 * Uses @tanstack/react-table for table functionality
 */
export function StudentTable({
  data,
  pagination,
  onPageChange,
  isLoading = false,
}: StudentTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: ({ column }) => <SortableHeader column={column}>Full Name</SortableHeader>,
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('full_name')}</div>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
        cell: ({ row }) => {
          const email = row.getValue('email') as string | null
          return <div>{email || '—'}</div>
        },
      },
      {
        accessorKey: 'visa_status',
        header: 'Visa Status',
        cell: ({ row }) => {
          const status = row.getValue('visa_status') as Student['visa_status']
          return <VisaStatusBadge status={status} />
        },
      },
      {
        accessorKey: 'latest_enrollment',
        header: 'College / Branch',
        cell: ({ row }) => {
          const enrollment = row.getValue('latest_enrollment') as Student['latest_enrollment']
          return <CollegeBranchCell enrollment={enrollment} />
        },
        enableSorting: false,
      },
      {
        accessorKey: 'updated_at',
        header: ({ column }) => <SortableHeader column={column}>Updated</SortableHeader>,
        cell: ({ row }) => {
          const date = new Date(row.getValue('updated_at'))
          return (
            <div className="text-muted-foreground">
              {getRelativeTime(date)}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const studentId = row.original.id
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/students/${studentId}#payment-history`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-md transition-colors"
                title="View Payment History"
              >
                <Receipt className="h-4 w-4" />
                Payments
              </Link>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  const handleRowClick = (studentId: string) => {
    router.push(`/students/${studentId}`)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total}{' '}
            total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
