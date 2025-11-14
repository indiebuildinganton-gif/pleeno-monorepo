/**
 * College Detail Page
 *
 * Displays individual college information with comprehensive sections:
 * - Header with Edit/Delete buttons (admin only)
 * - College information and branches
 * - Contacts management
 * - Activity feed panel
 * - Notes section
 * - Enrolled students per branch
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 13: College Detail Page Layout
 */

import { createServerClient } from '@pleeno/database/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@pleeno/ui'
import { EnrolledStudentsSection } from './components/EnrolledStudentsSection'
import { CollegeHeader } from './components/CollegeHeader'
import { ContactsSection } from './components/ContactsSection'
import { ActivityPanel } from './components/ActivityPanel'
import { NotesSection } from './components/NotesSection'
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

  // Get user's agency_id from JWT metadata
  const userAgencyId = user.app_metadata?.agency_id

  if (!userAgencyId) {
    redirect('/auth/login')
  }

  // Check if user is admin by querying the users table
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = currentUser?.role === 'agency_admin'

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
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header with Edit/Delete buttons */}
      <CollegeHeader
        collegeId={collegeId}
        collegeName={college.name}
        city={college.city}
        commissionRate={college.default_commission_rate_percent}
        gstStatus={college.gst_status}
        isAdmin={isAdmin}
      />

      {/* Main Content Grid: Left content + Right activity panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* College Profile Card */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">College Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {new Date(
                      college.contract_expiration_date
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Branches Section */}
          {college.branches && college.branches.length > 0 && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Branches</h2>
              <div className="space-y-2">
                {college.branches.map((branch: any) => (
                  <Link
                    key={branch.id}
                    href={`#branch-${branch.id}`}
                    className="block p-3 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {college.name} — {branch.city}
                      </span>
                      <Badge variant="outline">
                        {branch.commission_rate_percent}%
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Contacts Section */}
          <ContactsSection collegeId={collegeId} isAdmin={isAdmin} />

          {/* Notes Section */}
          <NotesSection collegeId={collegeId} />

          {/* Enrolled Students Sections - One for each branch */}
          {college.branches && college.branches.length > 0 && (
            <div className="space-y-8">
              {college.branches.map((branch: any) => (
                <div key={branch.id} id={`branch-${branch.id}`}>
                  <EnrolledStudentsSection
                    branchId={branch.id}
                    branchName={branch.name}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Activity Panel */}
        <div className="lg:col-span-1">
          <ActivityPanel collegeId={collegeId} />
        </div>
      </div>
    </div>
  )
}
