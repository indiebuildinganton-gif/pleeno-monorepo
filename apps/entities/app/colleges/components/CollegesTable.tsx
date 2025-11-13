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
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
import type { College, PaginationMeta } from '../../../hooks/useColleges'

interface CollegesTableProps {
  data: College[]
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

export function CollegesTable({
  data,
  pagination,
  onPageChange,
  isLoading = false,
}: CollegesTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<College>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('name')}</div>
        ),
      },
      {
        accessorKey: 'city',
        header: ({ column }) => <SortableHeader column={column}>City</SortableHeader>,
        cell: ({ row }) => {
          const city = row.getValue('city') as string | null
          return <div>{city || '—'}</div>
        },
      },
      {
        accessorKey: 'default_commission_rate_percent',
        header: ({ column }) => (
          <SortableHeader column={column}>Commission</SortableHeader>
        ),
        cell: ({ row }) => {
          const rate = row.getValue(
            'default_commission_rate_percent'
          ) as number | null
          return <div>{rate ? `${rate}%` : '—'}</div>
        },
      },
      {
        accessorKey: 'gst_status',
        header: 'GST',
        cell: ({ row }) => {
          const status = row.getValue('gst_status') as 'included' | 'excluded'
          return (
            <Badge variant={status === 'included' ? 'success' : 'warning'}>
              {status === 'included' ? 'Included' : 'Excluded'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'branch_count',
        header: ({ column }) => (
          <SortableHeader column={column}>Branches</SortableHeader>
        ),
        cell: ({ row }) => {
          const count = row.getValue('branch_count') as number
          return (
            <div className="text-muted-foreground">
              {count === 0 ? 'No branches' : `${count} ${count === 1 ? 'branch' : 'branches'}`}
            </div>
          )
        },
      },
      {
        accessorKey: 'updated_at',
        header: ({ column }) => <SortableHeader column={column}>Updated</SortableHeader>,
        cell: ({ row }) => {
          const date = new Date(row.getValue('updated_at'))
          return (
            <div className="text-muted-foreground">
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )
        },
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

  const handleRowClick = (collegeId: string) => {
    router.push(`/colleges/${collegeId}`)
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
                  No colleges found
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
