/**
 * Contact Form Component
 *
 * Client component for creating and editing contacts with:
 * - Name (required)
 * - Role/Department (optional)
 * - Position/Title (optional)
 * - Email (optional, validated format)
 * - Phone (optional, validated format)
 * - Live preview showing "Name (Role)" with position below
 *
 * Uses React Hook Form with Zod validation
 * Submits to POST /api/colleges/[id]/contacts
 * Shows success toast and refreshes contacts list
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 16: Create Contact Form Component
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, useToast } from '@pleeno/ui'
import { getApiUrl } from '@/hooks/useApiUrl'
import { ContactCreateSchema, type ContactCreate } from '@pleeno/validations'

interface ContactFormProps {
  /**
   * College ID to which this contact belongs
   */
  collegeId: string

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
 * ContactForm Component
 *
 * Form component for creating contacts for a college.
 * Validates email and phone formats, shows live preview of contact display.
 * Submits to API, shows success/error feedback, and refreshes.
 */
export function ContactForm({
  collegeId,
  collegeName,
  onSuccess,
  onCancel,
}: ContactFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContactCreate>({
    resolver: zodResolver(ContactCreateSchema),
    defaultValues: {
      name: '',
      role_department: '',
      position_title: '',
      email: '',
      phone: '',
    },
  })

  // Watch form values for live preview
  const watchedName = watch('name')
  const watchedRole = watch('role_department')
  const watchedPosition = watch('position_title')

  /**
   * Generate preview text showing how contact will be displayed
   * Format: "Name (Role)" with position below
   */
  const getPreviewText = () => {
    if (!watchedName?.trim()) {
      return { primary: 'Preview will appear here', secondary: null }
    }

    const primaryText = watchedRole?.trim()
      ? `${watchedName.trim()} (${watchedRole.trim()})`
      : watchedName.trim()

    const secondaryText = watchedPosition?.trim() || null

    return { primary: primaryText, secondary: secondaryText }
  }

  const preview = getPreviewText()

  /**
   * Submit handler - creates contact via API
   */
  const onSubmit = async (data: ContactCreate) => {
    setIsSubmitting(true)

    try {
      // Make API request to create contact
      const response = await fetch(getApiUrl(`/api/colleges/${collegeId}/contacts`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          role_department: data.role_department || null,
          position_title: data.position_title || null,
          email: data.email || null,
          phone: data.phone || null,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Show success toast
        addToast({
          title: 'Success',
          description: 'Contact created successfully',
          variant: 'success',
        })

        // Call onSuccess callback if provided (e.g., close modal)
        if (onSuccess) {
          onSuccess()
        }

        // Refresh the page to show updated contacts list
        router.refresh()
      } else {
        // Show error toast
        addToast({
          title: 'Error',
          description: result.error?.message || 'Failed to create contact',
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
        <CardTitle>Add Contact to {collegeName}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Contact Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., John Smith"
              disabled={isSubmitting}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Role/Department */}
          <div className="space-y-2">
            <Label htmlFor="role_department">Role/Department</Label>
            <Input
              id="role_department"
              type="text"
              placeholder="e.g., Admissions, International Office"
              disabled={isSubmitting}
              {...register('role_department')}
            />
            {errors.role_department && (
              <p className="text-sm text-destructive">
                {errors.role_department.message}
              </p>
            )}
          </div>

          {/* Position/Title */}
          <div className="space-y-2">
            <Label htmlFor="position_title">Position/Title</Label>
            <Input
              id="position_title"
              type="text"
              placeholder="e.g., Director of International Admissions"
              disabled={isSubmitting}
              {...register('position_title')}
            />
            {errors.position_title && (
              <p className="text-sm text-destructive">
                {errors.position_title.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., john.smith@college.edu"
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +1 234 567 8900"
              disabled={isSubmitting}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-2 pt-4 border-t">
            <Label>Preview</Label>
            <div className="p-4 rounded-md bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground">
                {preview.primary}
              </p>
              {preview.secondary && (
                <p className="text-xs text-muted-foreground mt-1">
                  {preview.secondary}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This shows how the contact will appear in the contacts list
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
              {isSubmitting ? 'Adding...' : 'Add Contact'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
