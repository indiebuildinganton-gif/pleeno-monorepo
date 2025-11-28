'use client'

import { useState } from 'react'
import { Button, Label, Select } from '@pleeno/ui'
import { useEnrollments, type Enrollment } from '@/hooks/useEnrollments'

interface EnrollmentSelectProps {
  value: string
  onChange: (value: string, commissionRate: number) => void
  error?: string
}

/**
 * EnrollmentSelect Component
 *
 * Reusable dropdown component for selecting student enrollments.
 * Fetches active enrollments, supports search/filter, and displays formatted enrollment info.
 *
 * Features:
 * - Fetches enrollments with status=active filter
 * - Display format: "Student Name - College Name (Branch City) - Program"
 * - Search/filter by student name or college name
 * - Loading state with skeleton UI
 * - Empty state with helpful message and link to student creation
 * - Automatic commission rate passthrough to parent
 *
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 7: Enrollment Dropdown Component
 *
 * @param value - Currently selected enrollment ID
 * @param onChange - Callback when enrollment is selected (includes commission rate)
 * @param error - Validation error message
 */
export function EnrollmentSelect({ value, onChange, error }: EnrollmentSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading, error: fetchError } = useEnrollments({ status: 'active' })

  const enrollments = data?.data || []

  /**
   * Formats enrollment data for display
   * Format: "Student Name - College Name (Branch City) - Program"
   */
  const formatEnrollment = (enrollment: Enrollment): string => {
    const studentName =
      `${enrollment.student?.first_name || ''} ${enrollment.student?.last_name || ''}`.trim()
    const collegeName = enrollment.branch?.college?.name || 'Unknown College'
    const branchCity = enrollment.branch?.city || 'Unknown City'
    const programName = enrollment.program_name || 'Unknown Program'

    return `${studentName} - ${collegeName} (${branchCity}) - ${programName}`
  }

  /**
   * Handles enrollment selection and passes commission rate to parent
   */
  const handleChange = (enrollmentId: string) => {
    const selectedEnrollment = enrollments.find((e) => e.id === enrollmentId)
    const commissionRate = selectedEnrollment?.branch?.commission_rate_percent || 0
    onChange(enrollmentId, commissionRate)
  }

  /**
   * Filters enrollments by search term (student name or college name)
   */
  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (!searchTerm) return true
    const label = formatEnrollment(enrollment).toLowerCase()
    return label.includes(searchTerm.toLowerCase())
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="enrollment_id">
          Student Enrollment <span className="text-destructive">*</span>
        </Label>
        <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
          Loading enrollments...
        </div>
      </div>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <div className="space-y-2">
        <Label htmlFor="enrollment_id">
          Student Enrollment <span className="text-destructive">*</span>
        </Label>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            Failed to load enrollments. Please try again.
          </p>
        </div>
      </div>
    )
  }

  // Empty state - no active enrollments found
  if (enrollments.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="enrollment_id">
          Student Enrollment <span className="text-destructive">*</span>
        </Label>
        <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No active enrollments found. Create a student enrollment first.
          </p>
          <Button asChild variant="outline">
            <a href="/students/new">Create Student & Enrollment</a>
          </Button>
        </div>
      </div>
    )
  }

  // Main component - enrollment selection
  return (
    <div className="space-y-2">
      <Label htmlFor="enrollment_id">
        Student Enrollment <span className="text-destructive">*</span>
      </Label>

      {/* Search input for filtering enrollments */}
      <input
        type="text"
        placeholder="Search by student or college name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-2"
      />

      {/* Enrollment dropdown */}
      <Select
        id="enrollment_id"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isLoading || enrollments.length === 0}
      >
        <option value="">Select an enrollment</option>
        {filteredEnrollments.map((enrollment) => (
          <option key={enrollment.id} value={enrollment.id}>
            {formatEnrollment(enrollment)}
          </option>
        ))}
      </Select>

      {/* Validation error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* No results message when search returns nothing */}
      {!isLoading && searchTerm && filteredEnrollments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No enrollments found matching "{searchTerm}". Try a different search term.
        </p>
      )}
    </div>
  )
}
