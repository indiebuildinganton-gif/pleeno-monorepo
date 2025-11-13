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
import { useState } from 'react'

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
  }

  const onSubmit = (data: ReportBuilderFormData) => {
    onGenerate(data)
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

              {/* College/Branch Multi-Select - Placeholder for now */}
              <div className="space-y-2">
                <Label htmlFor="college_ids">Colleges</Label>
                <Input
                  id="college_ids"
                  placeholder="Select colleges (feature coming soon)"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Multi-select will be implemented with lookup API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_ids">Branches</Label>
                <Input id="branch_ids" placeholder="Select branches (feature coming soon)" disabled />
                <p className="text-xs text-muted-foreground">
                  Multi-select will be implemented with lookup API
                </p>
              </div>

              {/* Student Search - Placeholder for now */}
              <div className="space-y-2">
                <Label htmlFor="student_ids">Students</Label>
                <Input
                  id="student_ids"
                  placeholder="Search students (feature coming soon)"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Typeahead search will be implemented with lookup API
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
