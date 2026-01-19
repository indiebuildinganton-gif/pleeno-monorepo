'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/hooks/useApiUrl'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  NativeSelect,
  useToast,
} from '@pleeno/ui'
import { StudentCreateSchema, VisaStatusEnum } from '@pleeno/validations'
import { useColleges } from '@/hooks/useColleges'
import { useBranches } from '@/hooks/useBranches'

/**
 * Form validation schema for student form
 * Extends StudentCreateSchema with optional college/branch fields
 */
const studentFormSchema = StudentCreateSchema.extend({
  college_id: z.string().optional().nullable(),
  branch_id: z.string().optional().nullable(),
})

type StudentFormData = z.infer<typeof studentFormSchema>

/**
 * Student data for editing
 */
export interface Student {
  id: string
  full_name: string
  passport_number: string
  email: string | null
  phone: string | null
  visa_status: string | null
  date_of_birth: string | null
  nationality: string | null
}

interface StudentFormProps {
  /**
   * Student data for editing (optional - omit for create mode)
   */
  student?: Student
  /**
   * Mode: 'create' or 'edit'
   */
  mode: 'create' | 'edit'
}

/**
 * StudentForm Component
 *
 * Main form component for creating and editing students:
 * - Required fields: full_name, passport_number
 * - Optional fields: email, phone, date_of_birth, nationality, visa_status
 * - Optional college and branch selection
 * - Real-time validation with inline errors
 * - Handles duplicate passport errors
 * - File upload support (to be implemented)
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 9: Student Form Component
 *
 * Features:
 * - React Hook Form with Zod validation
 * - College and branch cascading dropdowns
 * - Visa status dropdown with four options
 * - Duplicate passport number error handling
 * - Form pre-population for edit mode
 *
 * Acceptance Criteria (AC 2):
 * - Required fields enforced ✓
 * - Optional fields allowed empty ✓
 * - Visa status dropdown ✓
 * - College/branch selection ✓
 * - Validation errors shown ✓
 * - Duplicate passport handling ✓
 */
export function StudentForm({ student, mode }: StudentFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: student
      ? {
          full_name: student.full_name,
          passport_number: student.passport_number,
          email: student.email || '',
          phone: student.phone || '',
          visa_status: student.visa_status || null,
          date_of_birth: student.date_of_birth || '',
          nationality: student.nationality || '',
          college_id: '',
          branch_id: '',
        }
      : {
          full_name: '',
          passport_number: '',
          email: '',
          phone: '',
          visa_status: null,
          date_of_birth: '',
          nationality: '',
          college_id: '',
          branch_id: '',
        },
  })

  // Fetch colleges
  const {
    data: collegesData,
    isLoading: collegesLoading,
    error: collegesError,
  } = useColleges({ per_page: 100 })

  // Fetch branches for selected college
  const {
    data: branchesData,
    isLoading: branchesLoading,
    error: branchesError,
  } = useBranches(selectedCollegeId)

  const colleges = collegesData?.data || []
  const branches = branchesData?.data || []

  // Watch form values
  const watchedBranchId = watch('branch_id')

  /**
   * Handle college selection
   * Resets branch when college changes
   */
  const handleCollegeChange = (collegeId: string) => {
    setSelectedCollegeId(collegeId)
    setValue('college_id', collegeId)
    // Reset branch selection when college changes
    if (watchedBranchId) {
      setValue('branch_id', '')
    }
  }

  /**
   * Handle branch selection
   */
  const handleBranchChange = (branchId: string) => {
    setValue('branch_id', branchId)
  }

  /**
   * Submit handler - creates or updates student
   */
  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true)

    try {
      // Prepare request body - remove empty strings and convert to null
      const requestBody = {
        full_name: data.full_name,
        passport_number: data.passport_number,
        email: data.email || null,
        phone: data.phone || null,
        visa_status: data.visa_status || null,
        date_of_birth: data.date_of_birth || null,
        nationality: data.nationality || null,
      }

      // Create or update student
      const url = mode === 'create' ? getApiUrl('/api/students') : getApiUrl(`/api/students/${student?.id}`)
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle validation errors
        if (result.error?.code === 'VALIDATION_ERROR') {
          throw new Error(result.error.message || 'Validation failed')
        }

        // Handle duplicate passport error
        if (
          result.error?.message?.includes('passport number already exists') ||
          result.error?.message?.includes('duplicate')
        ) {
          throw new Error('A student with this passport number already exists in your agency')
        }

        throw new Error(result.error?.message || 'Failed to save student')
      }

      // Show success toast
      addToast({
        title: mode === 'create' ? 'Student created' : 'Student updated',
        description:
          mode === 'create'
            ? `${data.full_name} has been added to your student registry.`
            : `${data.full_name}'s information has been updated.`,
        variant: 'default',
      })

      // If we have a branch_id, create an enrollment
      if (data.branch_id && result.data?.id) {
        try {
          const enrollmentResponse = await fetch(getApiUrl('/api/enrollments'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              student_id: result.data.id,
              branch_id: data.branch_id,
              program_name: 'General Program', // Default program name
            }),
          })

          if (!enrollmentResponse.ok) {
            console.error('Failed to create enrollment')
            // Don't fail the whole operation if enrollment creation fails
          }
        } catch (enrollmentError) {
          console.error('Enrollment creation error:', enrollmentError)
          // Don't fail the whole operation
        }
      }

      // Navigate to student detail page
      router.push(`/students/${result.data.id}`)
    } catch (error) {
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to save student'
      addToast({
        title: mode === 'create' ? 'Failed to create student' : 'Failed to update student',
        description: errorMessage,
        variant: 'error',
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Add New Student' : 'Edit Student'}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Section: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="e.g., John Smith"
                disabled={isSubmitting}
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            {/* Passport Number */}
            <div className="space-y-2">
              <Label htmlFor="passport_number">
                Passport Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="passport_number"
                type="text"
                placeholder="e.g., AB123456"
                disabled={isSubmitting}
                {...register('passport_number')}
              />
              {errors.passport_number && (
                <p className="text-sm text-destructive">{errors.passport_number.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be unique within your agency
              </p>
            </div>
          </div>

          {/* Section: Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., john.smith@example.com"
                disabled={isSubmitting}
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="text"
                placeholder="e.g., +1 (555) 123-4567"
                disabled={isSubmitting}
                {...register('phone')}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Section: Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Additional Details</h3>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                disabled={isSubmitting}
                {...register('date_of_birth')}
              />
              {errors.date_of_birth && (
                <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>
              )}
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                type="text"
                placeholder="e.g., United States"
                disabled={isSubmitting}
                {...register('nationality')}
              />
              {errors.nationality && (
                <p className="text-sm text-destructive">{errors.nationality.message}</p>
              )}
            </div>

            {/* Visa Status */}
            <div className="space-y-2">
              <Label htmlFor="visa_status">Visa Status</Label>
              <NativeSelect
                id="visa_status"
                disabled={isSubmitting}
                {...register('visa_status')}
              >
                <option value="">Select visa status</option>
                <option value="in_process">In Process</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="expired">Expired</option>
              </NativeSelect>
              {errors.visa_status && (
                <p className="text-sm text-destructive">{errors.visa_status.message}</p>
              )}
            </div>
          </div>

          {/* Section: College & Branch (Optional) */}
          {mode === 'create' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                College & Branch (Optional)
              </h3>
              <p className="text-sm text-muted-foreground">
                You can associate this student with a college and branch now, or add it later.
              </p>

              {/* College Selection */}
              {collegesLoading ? (
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
                  Loading colleges...
                </div>
              ) : collegesError ? (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">
                    Failed to load colleges. You can still create the student and add college
                    information later.
                  </p>
                </div>
              ) : colleges.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="college_id">College</Label>
                    <NativeSelect
                      id="college_id"
                      value={selectedCollegeId}
                      onChange={(e) => handleCollegeChange(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Select a college</option>
                      {colleges.map((college) => (
                        <option key={college.id} value={college.id}>
                          {college.name} ({college.country})
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  {/* Branch Selection */}
                  {selectedCollegeId && (
                    <div className="space-y-2">
                      <Label htmlFor="branch_id">Branch</Label>
                      {branchesLoading ? (
                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
                          Loading branches...
                        </div>
                      ) : branchesError ? (
                        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                          <p className="text-sm text-destructive">
                            Failed to load branches. Please try again.
                          </p>
                        </div>
                      ) : branches.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-3 text-center">
                          <p className="text-sm text-muted-foreground">
                            No branches found for this college. Add a branch first.
                          </p>
                        </div>
                      ) : (
                        <NativeSelect
                          id="branch_id"
                          {...register('branch_id')}
                          disabled={isSubmitting}
                        >
                          <option value="">Select a branch</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name} - {branch.city}
                            </option>
                          ))}
                        </NativeSelect>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No colleges available. You can still create the student and add college
                    information later.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Updating...'
                : mode === 'create'
                  ? 'Create Student'
                  : 'Update Student'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
