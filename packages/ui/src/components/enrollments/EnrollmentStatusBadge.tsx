/**
 * Enrollment Status Badge Component
 *
 * Displays enrollment status with color-coded badges:
 * - active: green
 * - completed: blue
 * - cancelled: gray
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 6: Student Detail Page - Enrollments Section
 */

import { Badge } from '../ui/badge'

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'

export interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus
}

/**
 * Maps enrollment status to badge variant and display text
 */
const statusConfig: Record<
  EnrollmentStatus,
  { variant: 'success' | 'blue' | 'gray'; label: string }
> = {
  active: { variant: 'success', label: 'Active' },
  completed: { variant: 'blue', label: 'Completed' },
  cancelled: { variant: 'gray', label: 'Cancelled' },
}

export function EnrollmentStatusBadge({
  status,
}: EnrollmentStatusBadgeProps) {
  const config = statusConfig[status]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
