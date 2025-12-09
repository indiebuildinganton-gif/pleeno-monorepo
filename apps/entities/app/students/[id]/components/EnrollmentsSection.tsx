/**
 * Enrollments Section Component
 *
 * Displays all enrollments for a student with:
 * - College and branch information
 * - Program name
 * - Status badge (color-coded)
 * - Offer letter download link
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 6: Student Detail Page - Enrollments Section
 */

'use client'

import { useState } from 'react'
import { EnrollmentStatusBadge, DocumentViewer, EnrollmentStatusMenu } from '@pleeno/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from '@pleeno/ui'
import { useStudentEnrollments } from '../../../../hooks/useStudentEnrollments'
import { useUpdateEnrollmentStatus } from '../../../../hooks/useUpdateEnrollmentStatus'
import { FileText, Eye } from 'lucide-react'
import Link from 'next/link'

export interface EnrollmentsSectionProps {
  studentId: string
}

/**
 * EnrollmentsSection - Displays student enrollments in a table layout
 *
 * Features:
 * - Fetches enrollments using TanStack Query
 * - Displays college/branch, program, status, and offer letter
 * - Color-coded status badges
 * - Download links for offer letters
 * - Loading and error states
 * - Empty state when no enrollments exist
 *
 * @param studentId - The ID of the student to display enrollments for
 */
export function EnrollmentsSection({ studentId }: EnrollmentsSectionProps) {
  const { data, isLoading, error } = useStudentEnrollments(studentId)
  const enrollments = data?.data || []
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateEnrollmentStatus()
  const [viewingDocument, setViewingDocument] = useState<{
    url: string
    filename: string
  } | null>(null)

  const handleStatusChange = (enrollmentId: string, newStatus: 'active' | 'completed' | 'cancelled') => {
    console.log('🎯 EnrollmentsSection.handleStatusChange called:', { enrollmentId, newStatus })
    updateStatus({ enrollmentId, newStatus })
    console.log('✅ updateStatus mutation triggered')
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Enrollments</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">
            Loading enrollments...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Enrollments</h2>
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load enrollments</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Enrollments</h2>
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground mt-4">No enrollments found</p>
          <p className="text-sm text-muted-foreground mt-2">
            This student hasn't been enrolled in any college programs yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Enrollments</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>College / Branch</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Offer Letter</TableHead>
              <TableHead>Enrolled Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment) => (
              <TableRow key={enrollment.id}>
                <TableCell>
                  <div className="space-y-1">
                    <Link
                      href={`/colleges/${enrollment.branch.college.id}`}
                      className="font-medium hover:underline"
                    >
                      {enrollment.branch.college.name}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {enrollment.branch.name} ({enrollment.branch.city})
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{enrollment.program_name}</div>
                </TableCell>
                <TableCell>
                  <EnrollmentStatusBadge status={enrollment.status} />
                </TableCell>
                <TableCell>
                  {enrollment.offer_letter_url ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setViewingDocument({
                          url: `/api/enrollments/${enrollment.id}/offer-letter`,
                          filename:
                            enrollment.offer_letter_filename ||
                            'offer-letter.pdf',
                        })
                      }
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Offer Letter
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No offer letter
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {new Date(enrollment.created_at).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <EnrollmentStatusMenu
                    currentStatus={enrollment.status}
                    enrollmentId={enrollment.id}
                    onStatusChange={handleStatusChange}
                    disabled={isUpdating}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          documentUrl={viewingDocument.url}
          filename={viewingDocument.filename}
          isOpen={true}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  )
}
