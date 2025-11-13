/**
 * User Detail Page - Display and manage task assignments for a user
 *
 * This page allows agency admins to view user profile information and
 * modify task assignments for existing users in their agency.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 09: Create task assignment UI for existing users
 */

import { createServerClient } from '@pleeno/database/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@pleeno/ui'
import { TaskAssignmentForm } from './TaskAssignmentForm'

interface UserDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id: userId } = await params
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get current user to check admin role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  // Only admins can access user detail pages
  if (currentUser?.role !== 'agency_admin') {
    redirect('/dashboard')
  }

  // Fetch target user with their current task assignments
  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select(
      `
      *,
      user_task_assignments (
        task_id,
        master_tasks (
          id,
          task_name,
          task_code,
          description
        )
      )
    `
    )
    .eq('id', userId)
    .single()

  if (userError || !targetUser) {
    console.error('Error fetching user:', userError)
    notFound()
  }

  // Verify user belongs to same agency (security check)
  if (targetUser.agency_id !== currentUser.agency_id) {
    redirect('/users')
  }

  // Fetch all master tasks for checkbox selection
  const { data: masterTasks, error: tasksError } = await supabase
    .from('master_tasks')
    .select('*')
    .order('task_name', { ascending: true })

  if (tasksError) {
    console.error('Error fetching master tasks:', tasksError)
    return <div>Error loading tasks</div>
  }

  // Extract currently assigned task IDs
  const currentTaskIds =
    targetUser.user_task_assignments?.map(
      (assignment: any) => assignment.task_id
    ) || []

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header with back link */}
      <div className="mb-6">
        <a
          href="/users"
          className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
        >
          ← Back to Team Members
        </a>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      {/* User Profile Card */}
      <div className="bg-card rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Full Name
            </label>
            <p className="text-base font-medium mt-1">
              {targetUser.full_name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="text-base mt-1">{targetUser.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Role
            </label>
            <div className="mt-1">
              <Badge
                variant={
                  targetUser.role === 'agency_admin' ? 'default' : 'secondary'
                }
              >
                {targetUser.role === 'agency_admin' ? 'Admin' : 'User'}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Status
            </label>
            <div className="mt-1">
              <Badge
                variant={
                  targetUser.status === 'active' ? 'success' : 'destructive'
                }
              >
                {targetUser.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Task Assignment Form */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Task Assignments</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Select the tasks assigned to this user. Changes will be saved
          immediately.
        </p>
        <TaskAssignmentForm
          userId={userId}
          currentTaskIds={currentTaskIds}
          masterTasks={masterTasks || []}
        />
      </div>
    </div>
  )
}
