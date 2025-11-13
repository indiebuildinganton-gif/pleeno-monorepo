/**
 * College Form Component
 *
 * Client component for creating and editing colleges with:
 * - Name (required)
 * - City (optional)
 * - Commission Rate (required, 0-100%)
 * - GST Status (toggle: Included/Excluded, default: Included)
 *
 * Uses React Hook Form with Zod validation
 * Submits to POST/PATCH /api/colleges
 * Shows success toast and redirects to detail page
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 14: Create College Form Component
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, useToast } from '@pleeno/ui'
import { CollegeCreateSchema, CollegeUpdateSchema, type CollegeCreate, type CollegeUpdate } from '@pleeno/validations'

interface CollegeFormProps {
  /**
   * Mode: 'create' for new colleges, 'edit' for updating existing colleges
   */
  mode: 'create' | 'edit'

  /**
   * Initial data for edit mode
   */
  initialData?: {
    id: string
    name: string
    city: string | null
    default_commission_rate_percent: number
    gst_status: 'included' | 'excluded'
  }
}

type FormData = CollegeCreate | CollegeUpdate

/**
 * CollegeForm Component
 *
 * Reusable form component for creating and editing colleges.
 * Validates inputs, submits to API, shows success/error feedback, and redirects.
 */
export function CollegeForm({ mode, initialData }: CollegeFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = mode === 'edit'
  const schema = isEditMode ? CollegeUpdateSchema : CollegeCreateSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode && initialData
      ? {
          name: initialData.name,
          city: initialData.city || '',
          default_commission_rate_percent: initialData.default_commission_rate_percent,
          gst_status: initialData.gst_status,
        }
      : {
          name: '',
          city: '',
          default_commission_rate_percent: 0,
          gst_status: 'included' as const,
        },
  })

  /**
   * Submit handler - creates or updates college via API
   */
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      // Prepare payload
      const payload = {
        ...data,
        city: data.city || null, // Convert empty string to null
      }

      // Determine API endpoint and method
      const url = isEditMode ? `/api/colleges/${initialData!.id}` : '/api/colleges'
      const method = isEditMode ? 'PATCH' : 'POST'

      // Make API request
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Show success toast
        addToast({
          title: 'Success',
          description: isEditMode
            ? 'College updated successfully'
            : 'College created successfully',
          variant: 'success',
        })

        // Redirect to college detail page
        const collegeId = isEditMode ? initialData!.id : result.data.id
        router.push(`/colleges/${collegeId}`)
      } else {
        // Show error toast
        addToast({
          title: 'Error',
          description: result.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} college`,
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
   * Handle cancel - navigate back
   */
  const handleCancel = () => {
    if (isEditMode && initialData) {
      router.push(`/colleges/${initialData.id}`)
    } else {
      router.push('/colleges')
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit College' : 'Create New College'}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* College Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              College Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., University of Sydney"
              disabled={isSubmitting}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City (Optional)</Label>
            <Input
              id="city"
              type="text"
              placeholder="e.g., Sydney"
              disabled={isSubmitting}
              {...register('city')}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="default_commission_rate_percent">
              Default Commission Rate (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="default_commission_rate_percent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g., 15"
              disabled={isSubmitting}
              {...register('default_commission_rate_percent', { valueAsNumber: true })}
            />
            {errors.default_commission_rate_percent && (
              <p className="text-sm text-destructive">
                {errors.default_commission_rate_percent.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter a value between 0 and 100
            </p>
          </div>

          {/* GST Status */}
          <div className="space-y-2">
            <Label htmlFor="gst_status">
              GST Status <span className="text-destructive">*</span>
            </Label>
            <Select
              id="gst_status"
              disabled={isSubmitting}
              {...register('gst_status')}
              options={[
                { value: 'included', label: 'GST Included' },
                { value: 'excluded', label: 'GST Excluded' },
              ]}
            />
            {errors.gst_status && (
              <p className="text-sm text-destructive">{errors.gst_status.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Indicates whether commission amounts include or exclude GST
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
              {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save College' : 'Create College')}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
