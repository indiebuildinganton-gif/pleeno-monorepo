/**
 * Branch Form Component
 *
 * Client component for creating and editing branches with:
 * - Branch Name (required)
 * - City (required)
 * - Commission Rate (optional, auto-filled from college's default)
 *
 * Uses React Hook Form with Zod validation
 * Submits to POST /api/colleges/[id]/branches
 * Shows success toast and refreshes page to display updated branches list
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 15: Create Branch Form Component
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, useToast } from '@pleeno/ui'
import { getApiUrl } from '@/hooks/useApiUrl'
import { BranchCreateSchema, type BranchCreate } from '@pleeno/validations'

interface BranchFormProps {
  /**
   * College ID to which this branch belongs
   */
  collegeId: string

  /**
   * Default commission rate from college (used for auto-fill)
   */
  defaultCommissionRate: number

  /**
   * College name (for display context)
   */
  collegeName: string

  /**
   * Optional callback to execute on successful creation
   * (e.g., close modal, refresh data)
   */
  onSuccess?: () => void

  /**
   * Optional callback to execute on cancel
   * (e.g., close modal)
   */
  onCancel?: () => void
}

/**
 * BranchForm Component
 *
 * Form component for creating branches for a college.
 * Auto-fills commission rate from college default (editable).
 * Validates inputs, submits to API, shows success/error feedback, and refreshes.
 */
export function BranchForm({
  collegeId,
  defaultCommissionRate,
  collegeName,
  onSuccess,
  onCancel,
}: BranchFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BranchCreate>({
    resolver: zodResolver(BranchCreateSchema),
    defaultValues: {
      name: '',
      city: '',
      commission_rate_percent: defaultCommissionRate,
    },
  })

  /**
   * Submit handler - creates branch via API
   */
  const onSubmit = async (data: BranchCreate) => {
    setIsSubmitting(true)

    try {
      // Make API request to create branch
      const response = await fetch(getApiUrl(`/api/colleges/${collegeId}/branches`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Show success toast
        addToast({
          title: 'Success',
          description: 'Branch created successfully',
          variant: 'success',
        })

        // Call onSuccess callback if provided (e.g., close modal)
        if (onSuccess) {
          onSuccess()
        }

        // Refresh the page to show updated branches list
        router.refresh()
      } else {
        // Show error toast
        addToast({
          title: 'Error',
          description: result.error?.message || 'Failed to create branch',
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle cancel - execute callback or navigate back
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push(`/colleges/${collegeId}`)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add Branch to {collegeName}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Branch Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Branch Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Main Campus, Downtown Branch"
              disabled={isSubmitting}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="e.g., Sydney, Melbourne"
              disabled={isSubmitting}
              {...register('city')}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="commission_rate_percent">
              Commission Rate (%)
            </Label>
            <Input
              id="commission_rate_percent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g., 15"
              disabled={isSubmitting}
              {...register('commission_rate_percent', {
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : Number(v)
              })}
            />
            {errors.commission_rate_percent && (
              <p className="text-sm text-destructive">
                {errors.commission_rate_percent.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Auto-filled from college default ({defaultCommissionRate}%). You can override this value if needed.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Branch'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
