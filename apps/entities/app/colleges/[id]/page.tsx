/**
 * College Detail Page
 *
 * Displays individual college information, branches, and enrolled students.
 * This page integrates the EnrolledStudentsSection component to show
 * all students enrolled at each branch of the college.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry (Base Page Structure)
 * Story 3.3: Student-College Enrollment Linking (Enrolled Students Section)
 * Task 7: College Detail Page - Enrolled Students Section
 */

import { createServerClient } from '@pleeno/database/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@pleeno/ui'
import { EnrolledStudentsSection } from './components/EnrolledStudentsSection'
import Link from 'next/link'

interface CollegeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CollegeDetailPage({
  params,
}: CollegeDetailPageProps) {
  const { id: collegeId } = await params
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

  // Fetch college data with branches
  const { data: college, error: collegeError } = await supabase
    .from('colleges')
    .select(
      `
      *,
      branches (
        id,
        name,
        city,
        commission_rate_percent,
        created_at,
        updated_at
      )
    `
    )
    .eq('id', collegeId)
    .eq('agency_id', userAgencyId)
    .single()

  if (collegeError || !college) {
    console.error('Error fetching college:', collegeError)
    notFound()
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header with back link */}
      <div className="mb-6">
        <Link
          href="/colleges"
          className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
        >
          ← Back to Colleges
        </Link>
        <h1 className="text-3xl font-bold">{college.name}</h1>
      </div>

      {/* College Profile Card */}
      <div className="bg-card rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">College Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              City
            </label>
            <p className="text-base mt-1">{college.city || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Country
            </label>
            <p className="text-base mt-1">{college.country || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Default Commission Rate
            </label>
            <p className="text-base mt-1">
              {college.default_commission_rate_percent
                ? `${college.default_commission_rate_percent}%`
                : 'N/A'}
            </p>
          </div>
          {college.gst_status && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                GST Status
              </label>
              <div className="mt-1">
                <Badge variant="secondary">
                  {college.gst_status.charAt(0).toUpperCase() +
                    college.gst_status.slice(1)}
                </Badge>
              </div>
            </div>
          )}
          {college.contract_expiration_date && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Contract Expiration
              </label>
              <p className="text-base mt-1">
                {new Date(college.contract_expiration_date).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Branches Section */}
      {college.branches && college.branches.length > 0 && (
        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Branches</h2>
          <div className="space-y-4">
            {college.branches.map((branch: any) => (
              <div
                key={branch.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{branch.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {branch.city}
                    </p>
                  </div>
                  <Badge variant="outline">
                    Commission: {branch.commission_rate_percent}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Students Sections - One for each branch */}
      {college.branches && college.branches.length > 0 && (
        <div className="space-y-8">
          {college.branches.map((branch: any) => (
            <EnrolledStudentsSection
              key={branch.id}
              branchId={branch.id}
              branchName={branch.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}
