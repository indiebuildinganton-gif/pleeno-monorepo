/**
 * Student Detail Page
 *
 * Displays individual student information and enrollments.
 * This page integrates the EnrollmentsSection component to show
 * all colleges/programs where the student is enrolled.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry (Base Page Structure)
 * Story 3.3: Student-College Enrollment Linking (Enrollments Section)
 * Task 6: Student Detail Page - Enrollments Section
 */

import { createServerClient } from '@pleeno/database/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@pleeno/ui'
import { EnrollmentsSection } from './components/EnrollmentsSection'
import Link from 'next/link'

interface StudentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { id: studentId } = await params
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user's agency_id for RLS
  const userAgencyId = user.app_metadata?.agency_id

  if (!userAgencyId) {
    redirect('/auth/login')
  }

  // Fetch student data
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(
      `
      *
    `
    )
    .eq('id', studentId)
    .eq('agency_id', userAgencyId)
    .single()

  if (studentError || !student) {
    console.error('Error fetching student:', studentError)
    notFound()
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header with back link */}
      <div className="mb-6">
        <Link
          href="/students"
          className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
        >
          ← Back to Students
        </Link>
        <h1 className="text-3xl font-bold">{student.full_name}</h1>
      </div>

      {/* Student Profile Card */}
      <div className="bg-card rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="text-base mt-1">{student.email || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Phone
            </label>
            <p className="text-base mt-1">{student.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Passport Number
            </label>
            <p className="text-base mt-1">
              {student.passport_number || 'N/A'}
            </p>
          </div>
          {student.visa_status && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Visa Status
              </label>
              <div className="mt-1">
                <Badge variant="secondary">{student.visa_status}</Badge>
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Date of Birth
            </label>
            <p className="text-base mt-1">
              {student.date_of_birth
                ? new Date(student.date_of_birth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Nationality
            </label>
            <p className="text-base mt-1">{student.nationality || 'N/A'}</p>
          </div>
        </div>

        {/* Emergency Contact */}
        {(student.emergency_contact_name || student.emergency_contact_phone) && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.emergency_contact_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-base mt-1">
                    {student.emergency_contact_name}
                  </p>
                </div>
              )}
              {student.emergency_contact_phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <p className="text-base mt-1">
                    {student.emergency_contact_phone}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enrollments Section - Story 3.3 Task 6 */}
      <EnrollmentsSection studentId={studentId} />
    </div>
  )
}
