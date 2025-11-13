'use client'

import { useEffect, useState } from 'react'
import { Label, Select } from '@pleeno/ui'

interface Enrollment {
  id: string
  student: {
    first_name: string
    last_name: string
  }
  college: {
    name: string
  }
  branch: {
    name: string
    program_name: string
    commission_rate_percent: number
  }
}

interface EnrollmentSelectProps {
  value: string
  onChange: (value: string, commissionRate: number) => void
  error?: string
}

/**
 * EnrollmentSelect Component
 *
 * Provides a searchable dropdown for selecting enrollments.
 * Displays enrollments in the format: "Student Name - College (Branch) - Program"
 * Automatically filters enrollments by agency_id via RLS.
 *
 * @param value - Currently selected enrollment ID
 * @param onChange - Callback when enrollment is selected (includes commission rate)
 * @param error - Validation error message
 */
export function EnrollmentSelect({ value, onChange, error }: EnrollmentSelectProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true)

        const response = await fetch('/api/enrollments')
        const result = await response.json()

        if (!response.ok) {
          console.error('Error fetching enrollments:', result.message)
          return
        }

        if (result.data) {
          setEnrollments(result.data)
        }
      } catch (err) {
        console.error('Failed to fetch enrollments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollments()
  }, [])

  const handleChange = (enrollmentId: string) => {
    const selectedEnrollment = enrollments.find((e) => e.id === enrollmentId)
    const commissionRate = selectedEnrollment?.branch?.commission_rate_percent || 0
    onChange(enrollmentId, commissionRate)
  }

  const getEnrollmentLabel = (enrollment: Enrollment): string => {
    const studentName =
      `${enrollment.student?.first_name || ''} ${enrollment.student?.last_name || ''}`.trim()
    const collegeName = enrollment.college?.name || 'Unknown College'
    const branchName = enrollment.branch?.name || 'Unknown Branch'
    const programName = enrollment.branch?.program_name || 'Unknown Program'

    return `${studentName} - ${collegeName} (${branchName}) - ${programName}`
  }

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (!searchTerm) return true
    const label = getEnrollmentLabel(enrollment).toLowerCase()
    return label.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-2">
      <Label htmlFor="enrollment_id">
        Enrollment <span className="text-destructive">*</span>
      </Label>

      {loading ? (
        <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
          Loading enrollments...
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search enrollments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-2"
          />

          <Select
            id="enrollment_id"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={loading || enrollments.length === 0}
          >
            <option value="">Select an enrollment</option>
            {filteredEnrollments.map((enrollment) => (
              <option key={enrollment.id} value={enrollment.id}>
                {getEnrollmentLabel(enrollment)}
              </option>
            ))}
          </Select>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && enrollments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No enrollments found. Please create an enrollment first.
        </p>
      )}
    </div>
  )
}
