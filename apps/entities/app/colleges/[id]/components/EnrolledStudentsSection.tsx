/**
 * Enrolled Students Section Component
 *
 * Displays all students enrolled at a specific branch with:
 * - Student name (linked to student detail page)
 * - Program name
 * - Status badge (color-coded)
 * - Offer letter download link
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 7: College Detail Page - Enrolled Students Section
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
import { useBranchEnrollments } from '../../../../hooks/useBranchEnrollments'
import { useUpdateEnrollmentStatus } from '../../../../hooks/useUpdateEnrollmentStatus'
import { FileText, Eye } from 'lucide-react'
import Link from 'next/link'

export interface EnrolledStudentsSectionProps {
  branchId: string
  branchName?: string
}

/**
 * EnrolledStudentsSection - Displays enrolled students for a branch in a table layout
 *
 * Features:
 * - Fetches enrollments using TanStack Query
 * - Displays student name (linked), program, status, and offer letter
 * - Color-coded status badges
 * - Download links for offer letters
 * - Loading and error states
 * - Empty state when no students enrolled
 *
 * @param branchId - The ID of the branch to display enrollments for
 * @param branchName - Optional branch name to display in the section title
 */
export function EnrolledStudentsSection({
  branchId,
  branchName,
}: EnrolledStudentsSectionProps) {
  const { data, isLoading, error } = useBranchEnrollments(branchId)
  const enrollments = data?.data || []
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateEnrollmentStatus()
  const [viewingDocument, setViewingDocument] = useState<{
    url: string
    filename: string
  } | null>(null)

  const handleStatusChange = (enrollmentId: string, newStatus: 'active' | 'completed' | 'cancelled') => {
    updateStatus({ enrollmentId, newStatus })
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">
          Enrolled Students{branchName ? ` - ${branchName}` : ''}
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">
            Loading enrolled students...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">
          Enrolled Students{branchName ? ` - ${branchName}` : ''}
        </h2>
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load enrolled students</p>
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
        <h2 className="text-xl font-semibold mb-4">
          Enrolled Students{branchName ? ` - ${branchName}` : ''}
        </h2>
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground mt-4">No enrolled students found</p>
          <p className="text-sm text-muted-foreground mt-2">
            No students have been enrolled at this branch yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">
        Enrolled Students{branchName ? ` - ${branchName}` : ''}
      </h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
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
                      href={`/students/${enrollment.student.id}`}
                      className="font-medium hover:underline"
                    >
                      {enrollment.student.full_name}
                    </Link>
                    {enrollment.student.email && (
                      <div className="text-sm text-muted-foreground">
                        {enrollment.student.email}
                      </div>
                    )}
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
