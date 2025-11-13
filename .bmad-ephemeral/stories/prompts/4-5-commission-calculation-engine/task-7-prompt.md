# Story 4.5: Commission Calculation Engine - Task 7

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 6 - Commission by College/Branch Report API (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 7: Commission by College/Branch Report Page

### Acceptance Criteria
AC 4: Per-College/Branch Commission Aggregation
- Display results in sortable table (TanStack Table)
- Columns: College, Branch, Expected Commission, Earned Commission, Outstanding Commission, # of Plans
- Sort by any column (default: Earned Commission DESC)
- Click row to drill down to payment plans list filtered by college/branch
- Filters: Date range, college, branch
- Export to CSV button

### Task Description
Create a report page in the reports zone that displays commission aggregation by college and branch. Uses the API from Task 6 and provides filtering, sorting, and drill-down capabilities.

### Subtasks Checklist
- [ ] Create /reports/commissions/by-college page in reports zone
- [ ] CommissionByCollegeReport component with filters:
  - Date range picker (default: All time)
  - College filter dropdown (optional)
  - Branch filter dropdown (optional, dependent on college selection)
- [ ] Display results in sortable table (TanStack Table):
  - Columns: College, Branch, Expected Commission, Earned Commission, Outstanding Commission, # of Plans
  - Sort by any column (default: Earned Commission DESC)
  - Click row to drill down to payment plans list filtered by college/branch
- [ ] Show summary row at bottom: Total Expected, Total Earned, Total Outstanding across all colleges
- [ ] Export to CSV button (reuse CSV export logic from Story 7.2)

---

## Context & Constraints

### Key Constraints
- Multi-zone architecture: Reports zone (apps/reports/)
- Use TanStack Table for sorting and filtering
- Use TanStack Query for data fetching
- Date range picker: Shadcn Calendar component
- CSV export: Use existing CSV utility from Story 7.2
- Drill-down: Navigate to payment plans list with filters

### Dependencies
```json
{
  "@tanstack/react-table": "8.21.3",
  "@tanstack/react-query": "5.90.7",
  "date-fns": "4.1.0"
}
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 6:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 6]
3. Update Task 7:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Create Report Page
Create: `apps/reports/app/commissions/by-college/page.tsx`

```typescript
import { CommissionByCollegeReport } from './components/CommissionByCollegeReport';

export default function CommissionByCollegePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Commission by College & Branch</h1>
          <p className="text-muted-foreground">
            View commission breakdown by institution and branch
          </p>
        </div>

        <CommissionByCollegeReport />
      </div>
    </div>
  );
}
```

### Step 2: Create Main Report Component
Create: `apps/reports/app/commissions/by-college/components/CommissionByCollegeReport.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CommissionFilters } from './CommissionFilters';
import { CommissionTable } from './CommissionTable';
import { CommissionSummary } from './CommissionSummary';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCSV } from '@/packages/utils/src/csv-export';

export function CommissionByCollegeReport() {
  const [filters, setFilters] = useState({
    date_from: undefined,
    date_to: undefined,
    college_id: undefined,
    branch_id: undefined,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'commission-by-college', filters],
    queryFn: () => fetchCommissionByCollege(filters),
  });

  const handleExportCSV = () => {
    if (!data) return;

    const csvData = data.map(row => ({
      College: row.college_name,
      Branch: row.branch_name,
      'Expected Commission': row.total_expected,
      'Earned Commission': row.total_earned,
      'Outstanding Commission': row.total_outstanding,
      'Number of Plans': row.plan_count,
    }));

    exportToCSV(csvData, 'commission-by-college-report.csv');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <CommissionFilters filters={filters} onFiltersChange={setFilters} />

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExportCSV} disabled={!data || data.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Table */}
      {isLoading && <TableSkeleton />}
      {error && <ErrorDisplay error={error} />}
      {data && <CommissionTable data={data} />}

      {/* Summary Row */}
      {data && <CommissionSummary data={data} />}
    </div>
  );
}

async function fetchCommissionByCollege(filters: any) {
  const params = new URLSearchParams();
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.college_id) params.append('college_id', filters.college_id);
  if (filters.branch_id) params.append('branch_id', filters.branch_id);

  const response = await fetch(`/api/reports/commission-by-college?${params}`);
  if (!response.ok) throw new Error('Failed to fetch commission report');
  return response.json();
}
```

### Step 3: Create Filters Component
Create: `apps/reports/app/commissions/by-college/components/CommissionFilters.tsx`

```typescript
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

interface CommissionFiltersProps {
  filters: {
    date_from?: string;
    date_to?: string;
    college_id?: string;
    branch_id?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function CommissionFilters({ filters, onFiltersChange }: CommissionFiltersProps) {
  const { data: colleges } = useQuery({
    queryKey: ['colleges'],
    queryFn: fetchColleges,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches', filters.college_id],
    queryFn: () => fetchBranches(filters.college_id),
    enabled: !!filters.college_id,
  });

  return (
    <div className="flex flex-wrap gap-4">
      {/* Date Range Picker */}
      <DateRangePicker
        from={filters.date_from ? new Date(filters.date_from) : undefined}
        to={filters.date_to ? new Date(filters.date_to) : undefined}
        onSelect={(range) => {
          onFiltersChange({
            ...filters,
            date_from: range?.from?.toISOString(),
            date_to: range?.to?.toISOString(),
          });
        }}
      />

      {/* College Filter */}
      <Select
        value={filters.college_id}
        onValueChange={(value) => {
          onFiltersChange({
            ...filters,
            college_id: value,
            branch_id: undefined, // Reset branch when college changes
          });
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Colleges" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Colleges</SelectItem>
          {colleges?.map(college => (
            <SelectItem key={college.id} value={college.id}>
              {college.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Branch Filter (dependent on college selection) */}
      {filters.college_id && (
        <Select
          value={filters.branch_id}
          onValueChange={(value) => {
            onFiltersChange({ ...filters, branch_id: value });
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches?.map(branch => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
```

### Step 4: Create Table Component
Create: `apps/reports/app/commissions/by-college/components/CommissionTable.tsx`

```typescript
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/packages/utils/src/formatters';
import { ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CommissionTable({ data }: { data: CommissionByCollegeResponse[] }) {
  const router = useRouter();

  const columns: ColumnDef<CommissionByCollegeResponse>[] = [
    {
      accessorKey: 'college_name',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()}>
          College <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </button>
      ),
    },
    {
      accessorKey: 'branch_name',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()}>
          Branch <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </button>
      ),
    },
    {
      accessorKey: 'total_expected',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()}>
          Expected <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </button>
      ),
      cell: ({ row }) => formatCurrency(row.original.total_expected),
    },
    {
      accessorKey: 'total_earned',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()}>
          Earned <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-green-600 font-semibold">
          {formatCurrency(row.original.total_earned)}
        </span>
      ),
    },
    {
      accessorKey: 'total_outstanding',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()}>
          Outstanding <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </button>
      ),
      cell: ({ row }) => (
        <span className={row.original.total_outstanding > 0 ? 'text-red-600' : 'text-gray-600'}>
          {formatCurrency(row.original.total_outstanding)}
        </span>
      ),
    },
    {
      accessorKey: 'plan_count',
      header: '# Plans',
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'total_earned', desc: true }],
    },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : header.column.columnDef.header}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow
            key={row.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => {
              // Drill-down to payment plans filtered by college/branch
              router.push(`/payments/plans?college_id=${row.original.college_id}&branch_id=${row.original.branch_id}`);
            }}
          >
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>
                {cell.renderCell()}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Step 5: Create Summary Component
Create: `apps/reports/app/commissions/by-college/components/CommissionSummary.tsx`

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/packages/utils/src/formatters';

export function CommissionSummary({ data }: { data: CommissionByCollegeResponse[] }) {
  const totals = data.reduce(
    (acc, row) => ({
      expected: acc.expected + row.total_expected,
      earned: acc.earned + row.total_earned,
      outstanding: acc.outstanding + row.total_outstanding,
    }),
    { expected: 0, earned: 0, outstanding: 0 }
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Expected</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.expected)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.earned)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className={`text-2xl font-bold ${totals.outstanding > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {formatCurrency(totals.outstanding)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Testing Requirements

### Component Tests
Test cases:
1. Filters update query parameters correctly
2. Table displays commission data correctly
3. Table sorting works for all columns
4. Default sort is by Earned Commission DESC
5. Row click navigates to payment plans with filters
6. Summary row calculates totals correctly
7. CSV export generates correct file
8. Date range filter works
9. College filter cascades to branch filter

### E2E Test
Create: `__tests__/e2e/commission-report.spec.ts`

Test flow:
1. Navigate to commission report page
2. Verify default data loads
3. Apply date range filter
4. Verify filtered data
5. Sort by different columns
6. Click row to drill down
7. Export CSV and verify download

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Files
- Page: `apps/reports/app/commissions/by-college/page.tsx` (NEW)
- Components: `apps/reports/app/commissions/by-college/components/` (NEW)
- API: `apps/reports/app/api/commission-by-college/route.ts` (Task 6)
- CSV Utility: `packages/utils/src/csv-export.ts` (from Story 7.2)

### Dependencies from Previous Tasks
- Task 6: Commission by college API endpoint
- Story 7.2: CSV export utility

---

## Next Steps

After completing Task 7:
1. Update MANIFEST.md:
   - Task 7 status: "Completed"
   - Task 7 completed date
   - Add notes: Report page created, all features working
2. Test report with various filters and scenarios
3. Move to Task 8: Dashboard Commission Summary Widget
4. Reference file: `task-8-prompt.md`

---

## Success Criteria

Task 7 is complete when:
- [x] Report page created at /reports/commissions/by-college
- [x] Filters work (date range, college, branch)
- [x] Table displays commission data with sorting
- [x] Default sort by Earned Commission DESC
- [x] Row click navigates to payment plans with filters
- [x] Summary row shows totals
- [x] CSV export works
- [x] Component tests pass
- [x] E2E test passes
- [x] MANIFEST.md updated with Task 7 completion
