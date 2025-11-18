/**
 * Student Detail Page
 *
 * Displays individual student information and enrollments.
 * This page integrates the EnrollmentsSection component to show
 * all colleges/programs where the student is enrolled.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 10: Student Detail Page
 *
 * Features:
 * - Student name heading
 * - Back navigation to students list
 * - Action buttons (Edit Info, New Payment Plan, Delete)
 * - Student information with visa status badge
 * - College/Branch clickable link
 * - Enrollments section
 */

import { createServerClient } from '@pleeno/database/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@pleeno/ui'
import { EnrollmentsSection } from './components/EnrollmentsSection'
import { StudentActions } from './components/StudentActions'
import { DocumentViewer } from '../components/DocumentViewer'
import { PaymentHistorySection } from './components/PaymentHistorySection'
import { Breadcrumb } from './components/Breadcrumb'
import { StudentDetailNavigation } from './components/StudentDetailNavigation'
import Link from 'next/link'

interface StudentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * VisaStatusBadge Component
 *
 * Displays visa status with color coding:
 * - Denied: red (destructive)
 * - In Process: blue (default)
 * - Approved: green (success)
 * - Expired: gray (secondary)
 */
function VisaStatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-muted-foreground">—</span>
  }

  const badgeConfig: Record<
    string,
    { variant: 'destructive' | 'default' | 'success' | 'secondary'; label: string }
  > = {
    denied: { variant: 'destructive', label: 'Denied' },
    in_process: { variant: 'default', label: 'In Process' },
    approved: { variant: 'success', label: 'Approved' },
    expired: { variant: 'secondary', label: 'Expired' },
  }

  const config = badgeConfig[status] || {
    variant: 'secondary',
    label: status,
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
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

  // Fetch latest enrollment with college and branch data
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(
      `
      id,
      program_name,
      status,
      branch:branches (
        id,
        name,
        city,
        college:colleges (
          id,
          name
        )
      )
    `
    )
    .eq('student_id', studentId)
    .eq('agency_id', userAgencyId)
    .order('created_at', { ascending: false })
    .limit(1)

  const latestEnrollment = enrollments?.[0]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Students', href: '/students' },
          { label: student.full_name },
        ]}
      />

      {/* Header with Navigation and Quick-Access Buttons */}
      <div className="mb-6">
        <StudentDetailNavigation
          studentId={studentId}
          studentName={student.full_name}
        />
      </div>

      {/* Student Profile Card */}
      <section id="student-info" className="scroll-mt-8">
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
              Visa Status
            </label>
            <div className="mt-1">
              <VisaStatusBadge status={student.visa_status} />
            </div>
          </div>
          {latestEnrollment?.branch?.college && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                College / Branch
              </label>
              <p className="text-base mt-1">
                <Link
                  href={`/colleges/${latestEnrollment.branch.college.id}`}
                  className="hover:underline text-primary"
                >
                  {latestEnrollment.branch.college.name} -{' '}
                  {latestEnrollment.branch.name} ({latestEnrollment.branch.city})
                </Link>
              </p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Passport Number
            </label>
            <p className="text-base mt-1">
              {student.passport_number || 'N/A'}
            </p>
          </div>
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
      </section>

      {/* Enrollments Section - Story 3.3 Task 6 */}
      <section id="enrollments" className="scroll-mt-8">
        <EnrollmentsSection studentId={studentId} />
      </section>

      {/* Payment History Section - Story 7.5 Task 5 */}
      <section id="payment-history" className="mt-8 scroll-mt-8">
        <PaymentHistorySection studentId={studentId} />
      </section>

      {/* Document Management Section - Story 3.2 Task 14 */}
      <section id="documents" className="mt-8 scroll-mt-8">
        <DocumentViewer studentId={studentId} />
      </section>
    </div>
  )
}
