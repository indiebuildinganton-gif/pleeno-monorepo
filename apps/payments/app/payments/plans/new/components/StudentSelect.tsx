'use client'

import { useState, useMemo } from 'react'
import { Label, Select } from '@pleeno/ui'
import { useStudents } from '@/hooks/useStudents'

interface StudentSelectProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

/**
 * StudentSelect Component
 *
 * Dropdown component for selecting students with search functionality.
 * Fetches all students and allows filtering by name or email.
 *
 * Features:
 * - Fetches students from API
 * - Search/filter by student name or email
 * - Loading state with skeleton UI
 * - Empty state with helpful message
 * - Display format: "First Last (email)"
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 5: Payment Plan Creation Integration
 *
 * @param value - Currently selected student ID
 * @param onChange - Callback when student is selected
 * @param error - Validation error message
 * @param disabled - Whether the select is disabled
 */
export function StudentSelect({ value, onChange, error, disabled = false }: StudentSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading, error: fetchError } = useStudents({ per_page: 100 })

  const students = data?.data || []

  /**
   * Formats student data for display
   * Format: "First Last (email)"
   */
  const formatStudent = (student: { first_name: string; last_name: string; email: string }) => {
    const fullName = `${student.first_name} ${student.last_name}`.trim()
    return `${fullName} (${student.email})`
  }

  /**
   * Filters students by search term (name or email)
   */
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students
    const lowerSearch = searchTerm.toLowerCase()
    return students.filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
      const email = student.email.toLowerCase()
      return fullName.includes(lowerSearch) || email.includes(lowerSearch)
    })
  }, [students, searchTerm])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="student_id">
          Student <span className="text-destructive">*</span>
        </Label>
        <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
          Loading students...
        </div>
      </div>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <div className="space-y-2">
        <Label htmlFor="student_id">
          Student <span className="text-destructive">*</span>
        </Label>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">Failed to load students. Please try again.</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (students.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="student_id">
          Student <span className="text-destructive">*</span>
        </Label>
        <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-4 text-center">
          <p className="text-sm text-muted-foreground">No students found. Create a student first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="student_id">
        Student <span className="text-destructive">*</span>
      </Label>

      {/* Search input */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={disabled}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-2"
      />

      {/* Student dropdown */}
      <Select
        id="student_id"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading || students.length === 0}
      >
        <option value="">Select a student</option>
        {filteredStudents.map((student) => (
          <option key={student.id} value={student.id}>
            {formatStudent(student)}
          </option>
        ))}
      </Select>

      {/* Validation error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* No results message */}
      {!isLoading && searchTerm && filteredStudents.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No students found matching "{searchTerm}". Try a different search term.
        </p>
      )}
    </div>
  )
}
