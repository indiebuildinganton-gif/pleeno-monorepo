'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addDays, subDays, formatISO } from 'date-fns'
import { reportBuilderSchema, type ReportBuilderFormData } from '../validations/report-builder.schema'
import { Button } from '@pleeno/ui'
import { Input } from '@pleeno/ui'
import { Label } from '@pleeno/ui'
import { Checkbox } from '@pleeno/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pleeno/ui'
import { useState, useMemo } from 'react'
import { useColleges, useBranches, useStudents } from '../hooks/useReportLookups'
import { useDebounce } from '../hooks/useDebounce'

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
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

type PresetType = 'expiring_30' | 'expiring_60' | 'expiring_90' | 'expired'

export function ReportBuilder({ onGenerate }: ReportBuilderProps) {
  const [activePreset, setActivePreset] = useState<PresetType | null>(null)
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([])
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 500)

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
    setStudentSearchQuery('')
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
          {/* Filter Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="date_from">Date From</Label>
                <Input {...register('filters.date_from')} id="date_from" type="date" />
                {errors.filters?.date_from && (
                  <p className="text-sm text-destructive">{errors.filters.date_from.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_to">Date To</Label>
                <Input {...register('filters.date_to')} id="date_to" type="date" />
                {errors.filters?.date_to && (
                  <p className="text-sm text-destructive">{errors.filters.date_to.message}</p>
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
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                    setSelectedCollegeIds(selected)
                  }}
                  disabled={isLoadingColleges}
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
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                    setSelectedBranchIds(selected)
                  }}
                  disabled={isLoadingBranches || filteredBranches.length === 0}
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
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Click on students to select/deselect them
                </p>
              </div>

              {/* Payment Status Multi-Select - Simplified for now */}
              <div className="space-y-2">
                <Label htmlFor="status">Payment Status</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {statusOptions.map((status) => (
                    <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox value={status.value} {...register('filters.status')} />
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
              >
                Expiring in 30 days
              </Button>
              <Button
                type="button"
                variant={activePreset === 'expiring_60' ? 'default' : 'outline'}
                onClick={() => handlePresetFilter('expiring_60')}
              >
                Expiring in 60 days
              </Button>
              <Button
                type="button"
                variant={activePreset === 'expiring_90' ? 'default' : 'outline'}
                onClick={() => handlePresetFilter('expiring_90')}
              >
                Expiring in 90 days
              </Button>
              <Button
                type="button"
                variant={activePreset === 'expired' ? 'default' : 'outline'}
                onClick={() => handlePresetFilter('expired')}
              >
                Already expired
              </Button>
            </div>

            {/* Custom Contract Expiration Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_expiration_from">Contract Expiration From</Label>
                <Input
                  {...register('filters.contract_expiration_from')}
                  id="contract_expiration_from"
                  type="date"
                  onChange={(e) => {
                    register('filters.contract_expiration_from').onChange(e)
                    setActivePreset(null) // Clear preset when manually changing dates
                  }}
                />
                {errors.filters?.contract_expiration_from && (
                  <p className="text-sm text-destructive">
                    {errors.filters.contract_expiration_from.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_expiration_to">Contract Expiration To</Label>
                <Input
                  {...register('filters.contract_expiration_to')}
                  id="contract_expiration_to"
                  type="date"
                  onChange={(e) => {
                    register('filters.contract_expiration_to').onChange(e)
                    setActivePreset(null) // Clear preset when manually changing dates
                  }}
                />
                {errors.filters?.contract_expiration_to && (
                  <p className="text-sm text-destructive">
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
                  />
                  <span className="text-sm">{column.label}</span>
                </label>
              ))}
            </div>
            {errors.columns && (
              <p className="text-sm text-destructive mt-2">{errors.columns.message}</p>
            )}
          </section>

          {/* Actions Section */}
          <section className="flex gap-3 pt-4 border-t">
            <Button type="submit" size="lg">
              Generate Report
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={handleReset}>
              Reset Filters
            </Button>
          </section>
        </form>
      </CardContent>
    </Card>
  )
}
