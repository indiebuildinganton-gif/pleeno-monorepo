'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addDays, subDays, formatISO } from 'date-fns'
import {
  reportBuilderSchema,
  type ReportBuilderFormData,
} from '../validations/report-builder.schema'
import { Button } from '@pleeno/ui'
import { Input } from '@pleeno/ui'
import { Label } from '@pleeno/ui'
import { Checkbox } from '@pleeno/ui'
import { DatePicker } from '@pleeno/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pleeno/ui'
import { useState, useMemo } from 'react'
import { useColleges, useBranches, useStudents } from '../hooks/useReportLookups'
import { useDebounce } from '../hooks/useDebounce'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ReportBuilderProps {
  onGenerate: (data: ReportBuilderFormData) => void
}

// Available columns for selection
const availableColumns = [
  { value: 'student_name', label: 'Student Name', default: true },
  { value: 'college_name', label: 'College', default: true },
  { value: 'branch_name', label: 'Branch', default: true },
  { value: 'plan_amount', label: 'Plan Amount', default: true },
  { value: 'total_paid', label: 'Total Paid', default: true },
  { value: 'status', label: 'Status', default: true },
  { value: 'earned_commission', label: 'Commission', default: true },
  { value: 'contract_expiration_date', label: 'Contract Expiration', default: true },
  { value: 'created_at', label: 'Created Date', default: false },
  { value: 'payment_frequency', label: 'Payment Frequency', default: false },
  { value: 'installments_count', label: 'Installments Count', default: false },
  { value: 'days_until_contract_expiration', label: 'Days Until/Overdue', default: false },
]

// Payment status options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

type PresetType = 'expiring_30' | 'expiring_60' | 'expiring_90' | 'expired'

export function ReportBuilder({ onGenerate }: ReportBuilderProps) {
  const [activePreset, setActivePreset] = useState<PresetType | null>(null)
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([])
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 500)

  // Mobile accordion state
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)
  const [isExpirationOpen, setIsExpirationOpen] = useState(false)
  const [isColumnsOpen, setIsColumnsOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReportBuilderFormData>({
    resolver: zodResolver(reportBuilderSchema),
    defaultValues: {
      filters: {},
      columns: availableColumns.filter((col) => col.default).map((col) => col.value),
      pagination: { page: 1, page_size: 25 },
    },
  })

  const selectedColumns = watch('columns') || []

  // Watch date values from form
  const dateFrom = watch('filters.date_from')
  const dateTo = watch('filters.date_to')
  const contractExpirationFrom = watch('filters.contract_expiration_from')
  const contractExpirationTo = watch('filters.contract_expiration_to')

  // Fetch lookup data using custom hooks
  const { data: colleges, isLoading: isLoadingColleges } = useColleges()
  const { data: branches, isLoading: isLoadingBranches } = useBranches(
    selectedCollegeIds.length > 0 ? selectedCollegeIds : undefined
  )
  const { data: students, isLoading: isLoadingStudents } = useStudents(debouncedStudentSearch)

  // Filter branches based on selected colleges
  const filteredBranches = useMemo(() => {
    if (!branches) return []
    if (selectedCollegeIds.length === 0) return branches
    return branches.filter((branch) => selectedCollegeIds.includes(branch.college_id))
  }, [branches, selectedCollegeIds])

  const handlePresetFilter = (preset: PresetType) => {
    const today = new Date()
    setActivePreset(preset)

    switch (preset) {
      case 'expiring_30':
        setValue('filters.contract_expiration_from', formatISO(today, { representation: 'date' }))
        setValue(
          'filters.contract_expiration_to',
          formatISO(addDays(today, 30), { representation: 'date' })
        )
        break
      case 'expiring_60':
        setValue('filters.contract_expiration_from', formatISO(today, { representation: 'date' }))
        setValue(
          'filters.contract_expiration_to',
          formatISO(addDays(today, 60), { representation: 'date' })
        )
        break
      case 'expiring_90':
        setValue('filters.contract_expiration_from', formatISO(today, { representation: 'date' }))
        setValue(
          'filters.contract_expiration_to',
          formatISO(addDays(today, 90), { representation: 'date' })
        )
        break
      case 'expired':
        setValue('filters.contract_expiration_from', undefined)
        setValue(
          'filters.contract_expiration_to',
          formatISO(subDays(today, 1), { representation: 'date' })
        )
        break
    }
  }

  const handleColumnToggle = (columnValue: string) => {
    const currentColumns = selectedColumns
    if (currentColumns.includes(columnValue)) {
      setValue(
        'columns',
        currentColumns.filter((col) => col !== columnValue)
      )
    } else {
      setValue('columns', [...currentColumns, columnValue])
    }
  }

  const handleStatusToggle = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status]

    setSelectedStatuses(newStatuses)
    // Sync with form state for validation
    setValue('filters.status', newStatuses.length > 0 ? (newStatuses as any) : undefined)
  }

  const handleReset = () => {
    reset({
      filters: {},
      columns: availableColumns.filter((col) => col.default).map((col) => col.value),
      pagination: { page: 1, page_size: 25 },
    })
    setActivePreset(null)
    setSelectedCollegeIds([])
    setSelectedBranchIds([])
    setSelectedStudentIds([])
    setSelectedStatuses([])
    setStudentSearchQuery('')
    setValue('filters.status', undefined)
  }

  const onSubmit = (data: ReportBuilderFormData) => {
    // Add the selected lookup values to the filters
    const enhancedData: ReportBuilderFormData = {
      ...data,
      filters: {
        ...data.filters,
        college_ids: selectedCollegeIds.length > 0 ? selectedCollegeIds : undefined,
        branch_ids: selectedBranchIds.length > 0 ? selectedBranchIds : undefined,
        student_ids: selectedStudentIds.length > 0 ? selectedStudentIds : undefined,
        status: selectedStatuses.length > 0 ? (selectedStatuses as any) : undefined,
      },
    }
    onGenerate(enhancedData)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Plans Report Builder</CardTitle>
        <CardDescription>
          Configure filters and select columns to generate your custom report
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className="rounded-lg border border-red-600 bg-red-50 p-4" role="alert">
              <h4 className="font-semibold text-red-600 mb-2">Please fix the following errors:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                {errors.columns && <li>{errors.columns.message}</li>}
                {errors.filters?.date_from && <li>Date From: {errors.filters.date_from.message}</li>}
                {errors.filters?.date_to && <li>Date To: {errors.filters.date_to.message}</li>}
                {errors.filters?.contract_expiration_from && <li>Contract Expiration From: {errors.filters.contract_expiration_from.message}</li>}
                {errors.filters?.contract_expiration_to && <li>Contract Expiration To: {errors.filters.contract_expiration_to.message}</li>}
                {errors.filters?.status && <li>Payment Status: {errors.filters.status.message}</li>}
              </ul>
            </div>
          )}

          {/* Mobile Accordion Version */}
          <div className="md:hidden space-y-3" role="region" aria-label="Report filters">
            {/* Filters Accordion */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold hover:bg-accent rounded-t-lg"
                aria-expanded={isFiltersOpen}
                aria-controls="filters-section"
              >
                <span>Filters</span>
                {isFiltersOpen ? (
                  <ChevronUp className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              {isFiltersOpen && (
                <div id="filters-section" className="px-4 py-3 space-y-4 border-t">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label htmlFor="date_from_mobile">Date From</Label>
                    <DatePicker
                      id="date_from_mobile"
                      value={dateFrom ? new Date(dateFrom) : undefined}
                      onChange={(date) =>
                        setValue('filters.date_from', date ? formatISO(date, { representation: 'date' }) : undefined)
                      }
                      placeholder="Select start date"
                    />
                    {errors.filters?.date_from && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.filters.date_from.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_to_mobile">Date To</Label>
                    <DatePicker
                      id="date_to_mobile"
                      value={dateTo ? new Date(dateTo) : undefined}
                      onChange={(date) =>
                        setValue('filters.date_to', date ? formatISO(date, { representation: 'date' }) : undefined)
                      }
                      placeholder="Select end date"
                    />
                    {errors.filters?.date_to && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.filters.date_to.message}
                      </p>
                    )}
                  </div>

                  {/* College Multi-Select */}
                  <div className="space-y-2">
                    <Label htmlFor="college_ids_mobile">Colleges</Label>
                    <select
                      id="college_ids_mobile"
                      multiple
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedCollegeIds}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        )
                        setSelectedCollegeIds(selected)
                      }}
                      disabled={isLoadingColleges}
                      aria-label="Select colleges"
                    >
                      {isLoadingColleges ? (
                        <option disabled>Loading colleges...</option>
                      ) : (
                        colleges?.map((college) => (
                          <option key={college.id} value={college.id}>
                            {college.name} ({college.branch_count} branches)
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Hold Ctrl (Cmd on Mac) to select multiple colleges
                    </p>
                  </div>

                  {/* Branch Multi-Select */}
                  <div className="space-y-2">
                    <Label htmlFor="branch_ids_mobile">Branches</Label>
                    <select
                      id="branch_ids_mobile"
                      multiple
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedBranchIds}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        )
                        setSelectedBranchIds(selected)
                      }}
                      disabled={isLoadingBranches || filteredBranches.length === 0}
                      aria-label="Select branches"
                    >
                      {isLoadingBranches ? (
                        <option disabled>Loading branches...</option>
                      ) : filteredBranches.length === 0 ? (
                        <option disabled>
                          {selectedCollegeIds.length === 0
                            ? 'Select colleges first'
                            : 'No branches available'}
                        </option>
                      ) : (
                        filteredBranches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Hold Ctrl (Cmd on Mac) to select multiple branches
                    </p>
                  </div>

                  {/* Student Search Typeahead */}
                  <div className="space-y-2">
                    <Label htmlFor="student_search_mobile">Students</Label>
                    <div className="relative">
                      <Input
                        id="student_search_mobile"
                        type="text"
                        placeholder="Type to search students (min 2 characters)..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        aria-label="Search for students"
                        aria-describedby="student-search-help-mobile"
                      />
                      {debouncedStudentSearch.length >= 2 && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                          {isLoadingStudents ? (
                            <div className="px-4 py-2 text-sm text-muted-foreground">
                              Loading students...
                            </div>
                          ) : students && students.length > 0 ? (
                            students.map((student) => (
                              <div
                                key={student.id}
                                className={`cursor-pointer px-4 py-2 text-sm hover:bg-accent ${
                                  selectedStudentIds.includes(student.id) ? 'bg-accent' : ''
                                }`}
                                onClick={() => {
                                  if (selectedStudentIds.includes(student.id)) {
                                    setSelectedStudentIds(
                                      selectedStudentIds.filter((id) => id !== student.id)
                                    )
                                  } else {
                                    setSelectedStudentIds([...selectedStudentIds, student.id])
                                  }
                                }}
                                role="option"
                                aria-selected={selectedStudentIds.includes(student.id)}
                              >
                                {student.name} - {student.college_name}
                                {selectedStudentIds.includes(student.id) && ' ✓'}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-muted-foreground">
                              No students found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedStudentIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedStudentIds.map((studentId) => {
                          const student = students?.find((s) => s.id === studentId)
                          return student ? (
                            <span
                              key={studentId}
                              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
                            >
                              {student.name}
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedStudentIds(
                                    selectedStudentIds.filter((id) => id !== studentId)
                                  )
                                }
                                className="hover:text-destructive"
                                aria-label={`Remove ${student.name}`}
                              >
                                ×
                              </button>
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    <p id="student-search-help-mobile" className="text-xs text-muted-foreground">
                      Click on students to select/deselect them
                    </p>
                  </div>

                  {/* Payment Status Multi-Select */}
                  <div className="space-y-2">
                    <Label htmlFor="status_mobile">Payment Status</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {statusOptions.map((status) => (
                        <label
                          key={status.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedStatuses.includes(status.value)}
                            onCheckedChange={() => handleStatusToggle(status.value)}
                            aria-label={`Filter by ${status.label} status`}
                          />
                          <span className="text-sm">{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contract Expiration Accordion */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setIsExpirationOpen(!isExpirationOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold hover:bg-accent rounded-t-lg"
                aria-expanded={isExpirationOpen}
                aria-controls="expiration-section"
              >
                <span>Contract Expiration</span>
                {isExpirationOpen ? (
                  <ChevronUp className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              {isExpirationOpen && (
                <div id="expiration-section" className="px-4 py-3 space-y-4 border-t">
                  {/* Quick Filters */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={activePreset === 'expiring_30' ? 'default' : 'outline'}
                      onClick={() => handlePresetFilter('expiring_30')}
                      aria-pressed={activePreset === 'expiring_30'}
                      aria-label="Filter contracts expiring in 30 days"
                    >
                      30 days
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activePreset === 'expiring_60' ? 'default' : 'outline'}
                      onClick={() => handlePresetFilter('expiring_60')}
                      aria-pressed={activePreset === 'expiring_60'}
                      aria-label="Filter contracts expiring in 60 days"
                    >
                      60 days
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activePreset === 'expiring_90' ? 'default' : 'outline'}
                      onClick={() => handlePresetFilter('expiring_90')}
                      aria-pressed={activePreset === 'expiring_90'}
                      aria-label="Filter contracts expiring in 90 days"
                    >
                      90 days
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activePreset === 'expired' ? 'default' : 'outline'}
                      onClick={() => handlePresetFilter('expired')}
                      aria-pressed={activePreset === 'expired'}
                      aria-label="Filter already expired contracts"
                    >
                      Expired
                    </Button>
                  </div>

                  {/* Custom Date Range */}
                  <div className="space-y-2">
                    <Label htmlFor="contract_expiration_from_mobile">Expiration From</Label>
                    <DatePicker
                      id="contract_expiration_from_mobile"
                      value={contractExpirationFrom ? new Date(contractExpirationFrom) : undefined}
                      onChange={(date) => {
                        setValue('filters.contract_expiration_from', date ? formatISO(date, { representation: 'date' }) : undefined)
                        setActivePreset(null)
                      }}
                      placeholder="Select start date"
                    />
                    {errors.filters?.contract_expiration_from && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.filters.contract_expiration_from.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_expiration_to_mobile">Expiration To</Label>
                    <DatePicker
                      id="contract_expiration_to_mobile"
                      value={contractExpirationTo ? new Date(contractExpirationTo) : undefined}
                      onChange={(date) => {
                        setValue('filters.contract_expiration_to', date ? formatISO(date, { representation: 'date' }) : undefined)
                        setActivePreset(null)
                      }}
                      placeholder="Select end date"
                    />
                    {errors.filters?.contract_expiration_to && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.filters.contract_expiration_to.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Columns Accordion */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setIsColumnsOpen(!isColumnsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold hover:bg-accent rounded-t-lg"
                aria-expanded={isColumnsOpen}
                aria-controls="columns-section"
              >
                <span>Select Columns ({selectedColumns.length})</span>
                {isColumnsOpen ? (
                  <ChevronUp className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              {isColumnsOpen && (
                <div id="columns-section" className="px-4 py-3 space-y-3 border-t">
                  {availableColumns.map((column) => (
                    <label
                      key={column.value}
                      className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedColumns.includes(column.value)}
                        onCheckedChange={() => handleColumnToggle(column.value)}
                        aria-label={`Include ${column.label} column`}
                      />
                      <span className="text-sm">{column.label}</span>
                    </label>
                  ))}
                  {errors.columns && (
                    <p className="text-sm text-red-600 mt-2" role="alert">
                      {errors.columns.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop/Tablet Version */}
          <div className="hidden md:block space-y-6">
            {/* Filter Section */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label htmlFor="date_from">Date From</Label>
                  <DatePicker
                    id="date_from"
                    value={dateFrom ? new Date(dateFrom) : undefined}
                    onChange={(date) =>
                      setValue('filters.date_from', date ? formatISO(date, { representation: 'date' }) : undefined)
                    }
                    placeholder="Select start date"
                  />
                  {errors.filters?.date_from && (
                    <p className="text-sm text-red-600" role="alert">
                      {errors.filters.date_from.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_to">Date To</Label>
                  <DatePicker
                    id="date_to"
                    value={dateTo ? new Date(dateTo) : undefined}
                    onChange={(date) =>
                      setValue('filters.date_to', date ? formatISO(date, { representation: 'date' }) : undefined)
                    }
                    placeholder="Select end date"
                  />
                  {errors.filters?.date_to && (
                    <p className="text-sm text-red-600" role="alert">
                      {errors.filters.date_to.message}
                    </p>
                  )}
                </div>

                {/* College Multi-Select */}
                <div className="space-y-2">
                  <Label htmlFor="college_ids">Colleges</Label>
                  <select
                    id="college_ids"
                    multiple
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedCollegeIds}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                      setSelectedCollegeIds(selected)
                    }}
                    disabled={isLoadingColleges}
                    aria-label="Select colleges"
                  >
                    {isLoadingColleges ? (
                      <option disabled>Loading colleges...</option>
                    ) : (
                      colleges?.map((college) => (
                        <option key={college.id} value={college.id}>
                          {college.name} ({college.branch_count} branches)
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Hold Ctrl (Cmd on Mac) to select multiple colleges
                  </p>
                </div>

                {/* Branch Multi-Select */}
                <div className="space-y-2">
                  <Label htmlFor="branch_ids">Branches</Label>
                  <select
                    id="branch_ids"
                    multiple
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedBranchIds}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                      setSelectedBranchIds(selected)
                    }}
                    disabled={isLoadingBranches || filteredBranches.length === 0}
                    aria-label="Select branches"
                  >
                    {isLoadingBranches ? (
                      <option disabled>Loading branches...</option>
                    ) : filteredBranches.length === 0 ? (
                      <option disabled>
                        {selectedCollegeIds.length === 0
                          ? 'Select colleges first'
                          : 'No branches available'}
                      </option>
                    ) : (
                      filteredBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Hold Ctrl (Cmd on Mac) to select multiple branches
                  </p>
                </div>

                {/* Student Search Typeahead */}
                <div className="space-y-2">
                  <Label htmlFor="student_search">Students</Label>
                  <div className="relative">
                    <Input
                      id="student_search"
                      type="text"
                      placeholder="Type to search students (min 2 characters)..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      aria-label="Search for students"
                      aria-describedby="student-search-help"
                    />
                    {debouncedStudentSearch.length >= 2 && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                        {isLoadingStudents ? (
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            Loading students...
                          </div>
                        ) : students && students.length > 0 ? (
                          students.map((student) => (
                            <div
                              key={student.id}
                              className={`cursor-pointer px-4 py-2 text-sm hover:bg-accent ${
                                selectedStudentIds.includes(student.id) ? 'bg-accent' : ''
                              }`}
                              onClick={() => {
                                if (selectedStudentIds.includes(student.id)) {
                                  setSelectedStudentIds(
                                    selectedStudentIds.filter((id) => id !== student.id)
                                  )
                                } else {
                                  setSelectedStudentIds([...selectedStudentIds, student.id])
                                }
                              }}
                              role="option"
                              aria-selected={selectedStudentIds.includes(student.id)}
                            >
                              {student.name} - {student.college_name}
                              {selectedStudentIds.includes(student.id) && ' ✓'}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            No students found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedStudentIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedStudentIds.map((studentId) => {
                        const student = students?.find((s) => s.id === studentId)
                        return student ? (
                          <span
                            key={studentId}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
                          >
                            {student.name}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedStudentIds(
                                  selectedStudentIds.filter((id) => id !== studentId)
                                )
                              }
                              className="hover:text-destructive"
                              aria-label={`Remove ${student.name}`}
                            >
                              ×
                            </button>
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                  <p id="student-search-help" className="text-xs text-muted-foreground">
                    Click on students to select/deselect them
                  </p>
                </div>

                {/* Payment Status Multi-Select */}
                <div className="space-y-2">
                  <Label htmlFor="status">Payment Status</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {statusOptions.map((status) => (
                      <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedStatuses.includes(status.value)}
                          onCheckedChange={() => handleStatusToggle(status.value)}
                          aria-label={`Filter by ${status.label} status`}
                        />
                        <span className="text-sm">{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Contract Expiration Quick Filters */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Contract Expiration Quick Filters</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  type="button"
                  variant={activePreset === 'expiring_30' ? 'default' : 'outline'}
                  onClick={() => handlePresetFilter('expiring_30')}
                  aria-pressed={activePreset === 'expiring_30'}
                  aria-label="Filter contracts expiring in 30 days"
                >
                  Expiring in 30 days
                </Button>
                <Button
                  type="button"
                  variant={activePreset === 'expiring_60' ? 'default' : 'outline'}
                  onClick={() => handlePresetFilter('expiring_60')}
                  aria-pressed={activePreset === 'expiring_60'}
                  aria-label="Filter contracts expiring in 60 days"
                >
                  Expiring in 60 days
                </Button>
                <Button
                  type="button"
                  variant={activePreset === 'expiring_90' ? 'default' : 'outline'}
                  onClick={() => handlePresetFilter('expiring_90')}
                  aria-pressed={activePreset === 'expiring_90'}
                  aria-label="Filter contracts expiring in 90 days"
                >
                  Expiring in 90 days
                </Button>
                <Button
                  type="button"
                  variant={activePreset === 'expired' ? 'default' : 'outline'}
                  onClick={() => handlePresetFilter('expired')}
                  aria-pressed={activePreset === 'expired'}
                  aria-label="Filter already expired contracts"
                >
                  Already expired
                </Button>
              </div>

              {/* Custom Contract Expiration Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_expiration_from">Contract Expiration From</Label>
                  <DatePicker
                    id="contract_expiration_from"
                    value={contractExpirationFrom ? new Date(contractExpirationFrom) : undefined}
                    onChange={(date) => {
                      setValue('filters.contract_expiration_from', date ? formatISO(date, { representation: 'date' }) : undefined)
                      setActivePreset(null)
                    }}
                    placeholder="Select start date"
                  />
                  {errors.filters?.contract_expiration_from && (
                    <p className="text-sm text-red-600" role="alert">
                      {errors.filters.contract_expiration_from.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_expiration_to">Contract Expiration To</Label>
                  <DatePicker
                    id="contract_expiration_to"
                    value={contractExpirationTo ? new Date(contractExpirationTo) : undefined}
                    onChange={(date) => {
                      setValue('filters.contract_expiration_to', date ? formatISO(date, { representation: 'date' }) : undefined)
                      setActivePreset(null)
                    }}
                    placeholder="Select end date"
                  />
                  {errors.filters?.contract_expiration_to && (
                    <p className="text-sm text-red-600" role="alert">
                      {errors.filters.contract_expiration_to.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Column Selection Section */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Select Columns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableColumns.map((column) => (
                  <label
                    key={column.value}
                    className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedColumns.includes(column.value)}
                      onCheckedChange={() => handleColumnToggle(column.value)}
                      aria-label={`Include ${column.label} column`}
                    />
                    <span className="text-sm">{column.label}</span>
                  </label>
                ))}
              </div>
              {errors.columns && (
                <p className="text-sm text-red-600 mt-2" role="alert">
                  {errors.columns.message}
                </p>
              )}
            </section>
          </div>

          {/* Actions Section */}
          <section className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
              aria-label="Generate payment plans report"
            >
              Generate Report
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleReset}
              aria-label="Reset all filters to default values"
            >
              Reset Filters
            </Button>
          </section>
        </form>
      </CardContent>
    </Card>
  )
}
