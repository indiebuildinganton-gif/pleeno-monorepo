/**
 * PaymentPlansFilterPanel Component
 *
 * Multi-select filter panel for comprehensive payment plan filtering:
 * - Status filter: Multi-select checkboxes (active, completed, cancelled)
 * - Student filter: Autocomplete dropdown
 * - College/Branch filter: Nested dropdown (college → branches)
 * - Amount filter: Min/Max number inputs with currency formatting
 * - Installments filter: Range selection
 * - Due date filter: Date range picker (from/to)
 * - Active filters display as removable chips
 * - "Clear all filters" button
 * - URL query params synchronization for shareable URLs
 *
 * Epic 4: Payments Domain
 * Story 4.3: Payment Plan List and Detail Views
 * Task 4: Filter Panel Component
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Input,
  Checkbox,
  Select,
  Badge,
} from '@pleeno/ui'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useStudents } from '@/hooks/useStudents'
import { useColleges } from '@/hooks/useColleges'
import { useBranches } from '@/hooks/useBranches'

/**
 * Filter Schema
 */
const filterSchema = z.object({
  status: z.array(z.enum(['active', 'completed', 'cancelled'])).optional(),
  student_id: z.string().optional(),
  college_id: z.string().optional(),
  branch_id: z.string().optional(),
  amount_min: z.coerce.number().min(0).optional(),
  amount_max: z.coerce.number().min(0).optional(),
  installments_min: z.coerce.number().min(1).optional(),
  installments_max: z.coerce.number().min(1).optional(),
  due_date_from: z.string().optional(),
  due_date_to: z.string().optional(),
}).refine(
  (data) => {
    if (data.amount_min && data.amount_max) {
      return data.amount_min <= data.amount_max
    }
    return true
  },
  {
    message: 'Minimum amount must be less than or equal to maximum amount',
    path: ['amount_max'],
  }
).refine(
  (data) => {
    if (data.installments_min && data.installments_max) {
      return data.installments_min <= data.installments_max
    }
    return true
  },
  {
    message: 'Minimum installments must be less than or equal to maximum installments',
    path: ['installments_max'],
  }
).refine(
  (data) => {
    if (data.due_date_from && data.due_date_to) {
      return new Date(data.due_date_from) <= new Date(data.due_date_to)
    }
    return true
  },
  {
    message: 'From date must be before or equal to To date',
    path: ['due_date_to'],
  }
)

type FilterFormData = z.infer<typeof filterSchema>

/**
 * Active Filter Type
 */
interface ActiveFilter {
  key: string
  label: string
  value: string
}

/**
 * PaymentPlansFilterPanel Component
 */
export function PaymentPlansFilterPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isExpanded, setIsExpanded] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')

  // Fetch data for filter options
  const { data: studentsData } = useStudents({ per_page: 100 })
  const { data: collegesData } = useColleges({ per_page: 100 })

  const students = studentsData?.data || []
  const colleges = collegesData?.data || []

  // Initialize form with values from URL
  const form = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      status: searchParams.get('status')?.split(',').filter(Boolean) as ('active' | 'completed' | 'cancelled')[] || [],
      student_id: searchParams.get('student_id') || '',
      college_id: searchParams.get('college_id') || '',
      branch_id: searchParams.get('branch_id') || '',
      amount_min: searchParams.get('amount_min') ? Number(searchParams.get('amount_min')) : undefined,
      amount_max: searchParams.get('amount_max') ? Number(searchParams.get('amount_max')) : undefined,
      installments_min: searchParams.get('installments_min') ? Number(searchParams.get('installments_min')) : undefined,
      installments_max: searchParams.get('installments_max') ? Number(searchParams.get('installments_max')) : undefined,
      due_date_from: searchParams.get('due_date_from') || '',
      due_date_to: searchParams.get('due_date_to') || '',
    },
  })

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = form

  // Watch form values
  const selectedCollegeId = watch('college_id')
  const selectedStatus = watch('status') || []

  // Fetch branches based on selected college
  const { data: branchesData } = useBranches(selectedCollegeId || '')
  const branches = branchesData?.data || []

  // Helper function to format student display name
  const formatStudentName = (student: any) => {
    const firstName = student.first_name?.trim() || ''
    const lastName = student.last_name?.trim() || ''
    const fullName = `${firstName} ${lastName}`.trim()

    if (fullName) {
      return `${fullName} (${student.email})`
    }
    return student.email
  }

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm) return students.slice(0, 20) // Limit to 20 when no search
    const lowerSearch = studentSearchTerm.toLowerCase()
    return students.filter((student) => {
      const firstName = student.first_name?.toLowerCase() || ''
      const lastName = student.last_name?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const email = student.email.toLowerCase()
      return fullName.includes(lowerSearch) || email.includes(lowerSearch)
    }).slice(0, 20) // Limit results to 20
  }, [students, studentSearchTerm])

  // Reset branch when college changes
  useEffect(() => {
    if (selectedCollegeId) {
      const currentBranchId = watch('branch_id')
      const isValidBranch = branches.some(b => b.id === currentBranchId)
      if (!isValidBranch && currentBranchId) {
        setValue('branch_id', '')
      }
    }
  }, [selectedCollegeId, branches, setValue, watch])

  /**
   * Handle status checkbox toggle
   */
  const handleStatusToggle = (status: 'active' | 'completed' | 'cancelled') => {
    const currentStatus = selectedStatus
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status]
    setValue('status', newStatus)
  }

  /**
   * Build query params from form values
   */
  const buildQueryParams = (data: FilterFormData): URLSearchParams => {
    const params = new URLSearchParams()

    // Preserve non-filter query params (like page, per_page)
    searchParams.forEach((value, key) => {
      if (!['status', 'student_id', 'college_id', 'branch_id', 'amount_min', 'amount_max', 'installments_min', 'installments_max', 'due_date_from', 'due_date_to'].includes(key)) {
        params.set(key, value)
      }
    })

    // Add filter params
    if (data.status && data.status.length > 0) {
      params.set('status', data.status.join(','))
    }
    if (data.student_id) {
      params.set('student_id', data.student_id)
    }
    if (data.college_id) {
      params.set('college_id', data.college_id)
    }
    if (data.branch_id) {
      params.set('branch_id', data.branch_id)
    }
    if (data.amount_min !== undefined && data.amount_min !== null && data.amount_min !== 0) {
      params.set('amount_min', data.amount_min.toString())
    }
    if (data.amount_max !== undefined && data.amount_max !== null && data.amount_max !== 0) {
      params.set('amount_max', data.amount_max.toString())
    }
    if (data.installments_min !== undefined && data.installments_min !== null) {
      params.set('installments_min', data.installments_min.toString())
    }
    if (data.installments_max !== undefined && data.installments_max !== null) {
      params.set('installments_max', data.installments_max.toString())
    }
    if (data.due_date_from) {
      params.set('due_date_from', data.due_date_from)
    }
    if (data.due_date_to) {
      params.set('due_date_to', data.due_date_to)
    }

    return params
  }

  /**
   * Apply filters - update URL
   */
  const onSubmit = (data: FilterFormData) => {
    const params = buildQueryParams(data)
    router.push(`/payments/plans?${params.toString()}`)
  }

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    reset({
      status: [],
      student_id: '',
      college_id: '',
      branch_id: '',
      amount_min: undefined,
      amount_max: undefined,
      installments_min: undefined,
      installments_max: undefined,
      due_date_from: '',
      due_date_to: '',
    })
    router.push('/payments/plans')
  }

  /**
   * Remove individual filter
   */
  const handleRemoveFilter = (key: string) => {
    if (key === 'status') {
      setValue('status', [])
    } else if (key === 'student_id') {
      setValue('student_id', '')
    } else if (key === 'college_id') {
      setValue('college_id', '')
      setValue('branch_id', '')
    } else if (key === 'branch_id') {
      setValue('branch_id', '')
    } else if (key === 'amount_min') {
      setValue('amount_min', undefined)
    } else if (key === 'amount_max') {
      setValue('amount_max', undefined)
    } else if (key === 'installments_min') {
      setValue('installments_min', undefined)
    } else if (key === 'installments_max') {
      setValue('installments_max', undefined)
    } else if (key === 'due_date_from') {
      setValue('due_date_from', '')
    } else if (key === 'due_date_to') {
      setValue('due_date_to', '')
    }

    // Trigger form submission to update URL
    handleSubmit(onSubmit)()
  }

  /**
   * Get active filters for display as chips
   */
  const getActiveFilters = (): ActiveFilter[] => {
    const filters: ActiveFilter[] = []
    const values = watch()

    if (values.status && values.status.length > 0) {
      filters.push({
        key: 'status',
        label: 'Status',
        value: values.status.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', '),
      })
    }

    if (values.student_id) {
      const student = students.find(s => s.id === values.student_id)
      if (student) {
        const firstName = student.first_name?.trim() || ''
        const lastName = student.last_name?.trim() || ''
        const fullName = `${firstName} ${lastName}`.trim()
        filters.push({
          key: 'student_id',
          label: 'Student',
          value: fullName || student.email,
        })
      }
    }

    if (values.college_id) {
      const college = colleges.find(c => c.id === values.college_id)
      if (college) {
        filters.push({
          key: 'college_id',
          label: 'College',
          value: college.name,
        })
      }
    }

    if (values.branch_id) {
      const branch = branches.find(b => b.id === values.branch_id)
      if (branch) {
        filters.push({
          key: 'branch_id',
          label: 'Branch',
          value: branch.name,
        })
      }
    }

    if (values.amount_min !== undefined && values.amount_min !== null && values.amount_min !== 0) {
      filters.push({
        key: 'amount_min',
        label: 'Min Amount',
        value: `≥ $${values.amount_min.toLocaleString()}`,
      })
    }

    if (values.amount_max !== undefined && values.amount_max !== null && values.amount_max !== 0) {
      filters.push({
        key: 'amount_max',
        label: 'Max Amount',
        value: `≤ $${values.amount_max.toLocaleString()}`,
      })
    }

    if (values.installments_min !== undefined && values.installments_min !== null) {
      filters.push({
        key: 'installments_min',
        label: 'Min Installments',
        value: `≥ ${values.installments_min}`,
      })
    }

    if (values.installments_max !== undefined && values.installments_max !== null) {
      filters.push({
        key: 'installments_max',
        label: 'Max Installments',
        value: `≤ ${values.installments_max}`,
      })
    }

    if (values.due_date_from) {
      filters.push({
        key: 'due_date_from',
        label: 'Due From',
        value: new Date(values.due_date_from).toLocaleDateString(),
      })
    }

    if (values.due_date_to) {
      filters.push({
        key: 'due_date_to',
        label: 'Due To',
        value: new Date(values.due_date_to).toLocaleDateString(),
      })
    }

    return filters
  }

  const activeFilters = getActiveFilters()

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {activeFilters.length} active
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-muted"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                <span className="text-sm">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                <span className="text-sm">Show</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Plan Status</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                  <Checkbox
                    checked={selectedStatus.includes('active')}
                    onCheckedChange={() => handleStatusToggle('active')}
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                  <Checkbox
                    checked={selectedStatus.includes('completed')}
                    onCheckedChange={() => handleStatusToggle('completed')}
                  />
                  <span className="text-sm font-medium">Completed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                  <Checkbox
                    checked={selectedStatus.includes('cancelled')}
                    onCheckedChange={() => handleStatusToggle('cancelled')}
                  />
                  <span className="text-sm font-medium">Cancelled</span>
                </label>
              </div>
            </div>

            {/* Student & College Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Filter */}
                <div className="space-y-2">
                  <Label htmlFor="student_id" className="text-sm font-medium">Student</Label>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Search by name or email..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full"
                    />
                    <Select
                      id="student_id"
                      {...form.register('student_id')}
                      onChange={(e) => {
                        setValue('student_id', e.target.value)
                      }}
                      className="w-full"
                    >
                      <option value="">All Students</option>
                      {filteredStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {formatStudentName(student)}
                        </option>
                      ))}
                      {students.length > 20 && !studentSearchTerm && (
                        <option disabled>Search to see more students...</option>
                      )}
                    </Select>
                    {studentSearchTerm && filteredStudents.length === 0 && (
                      <p className="text-xs text-muted-foreground">No students found</p>
                    )}
                    {!studentSearchTerm && students.length > 20 && (
                      <p className="text-xs text-muted-foreground">
                        Showing first 20 students. Use search to find more.
                      </p>
                    )}
                  </div>
                </div>

                {/* College Filter */}
                <div className="space-y-2">
                  <Label htmlFor="college_id" className="text-sm font-medium">College</Label>
                  <Select
                    id="college_id"
                    {...form.register('college_id')}
                    onChange={(e) => {
                      setValue('college_id', e.target.value)
                      if (!e.target.value) {
                        setValue('branch_id', '')
                      }
                    }}
                    className="w-full"
                  >
                    <option value="">All Colleges</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.name} ({college.country})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Branch Filter - Only show when college is selected */}
              {selectedCollegeId && (
                <div className="space-y-2">
                  <Label htmlFor="branch_id" className="text-sm font-medium">Branch</Label>
                  <Select
                    id="branch_id"
                    {...form.register('branch_id')}
                    onChange={(e) => setValue('branch_id', e.target.value)}
                    className="w-full md:w-1/2"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} - {branch.city}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            {/* Advanced Filters Section */}
            <div className="pt-4 border-t space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Advanced Filters</h3>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount Range</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Min amount"
                    min="0"
                    step="100"
                    {...form.register('amount_min')}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Max amount"
                    min="0"
                    step="100"
                    {...form.register('amount_max')}
                  />
                  {errors.amount_max && (
                    <p className="text-sm text-destructive">{errors.amount_max.message}</p>
                  )}
                </div>
              </div>
            </div>

              {/* Installments Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Installments Range</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Min installments"
                    min="1"
                    step="1"
                    {...form.register('installments_min')}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Max installments"
                    min="1"
                    step="1"
                    {...form.register('installments_max')}
                  />
                  {errors.installments_max && (
                    <p className="text-sm text-destructive">{errors.installments_max.message}</p>
                  )}
                </div>
              </div>
            </div>

              {/* Due Date Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Date Range</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    type="date"
                    {...form.register('due_date_from')}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type="date"
                    {...form.register('due_date_to')}
                  />
                  {errors.due_date_to && (
                    <p className="text-sm text-destructive">{errors.due_date_to.message}</p>
                  )}
                </div>
              </div>
            </div>

            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Apply Filters
              </Button>
              <Button type="button" variant="outline" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </form>

          {/* Active Filters Chips */}
          {activeFilters.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">Active Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge
                    key={filter.key}
                    variant="secondary"
                    className="pr-1 flex items-center gap-2"
                  >
                    <span className="text-xs">
                      <span className="font-medium">{filter.label}:</span> {filter.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFilter(filter.key)}
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
