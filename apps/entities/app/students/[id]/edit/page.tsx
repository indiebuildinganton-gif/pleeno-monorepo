'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@pleeno/database/client'
import { StudentForm, Student } from '../../components/StudentForm'
import { Button } from '@pleeno/ui/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

/**
 * Edit Student Page
 *
 * Page for editing existing students with form validation.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 9: Student Form Component
 *
 * Features:
 * - Client-side form pre-populated with existing data
 * - Form validation with Zod
 * - Required fields: full_name, passport_number
 * - Optional fields: email, phone, date_of_birth, nationality, visa_status
 * - Duplicate passport error handling
 * - Navigation back to student detail page
 *
 * Acceptance Criteria (AC 2):
 * - Student edit form ✓
 * - Form pre-populated with existing data ✓
 * - Required fields enforced ✓
 * - Optional fields allowed empty ✓
 * - Validation errors shown ✓
 * - Duplicate passport handling ✓
 */
export default function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingStudent, setIsLoadingStudent] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)

  // Unwrap params
  useEffect(() => {
    params.then((p) => setStudentId(p.id))
  }, [params])

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      setIsLoadingAuth(false)
    }

    checkAuth()
  }, [router])

  // Fetch student data
  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return

      try {
        const response = await fetch(`/api/students/${studentId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch student')
        }

        const result = await response.json()

        if (!result.success || !result.data) {
          throw new Error('Student not found')
        }

        setStudent(result.data)
        setIsLoadingStudent(false)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load student'
        setError(errorMessage)
        setIsLoadingStudent(false)
      }
    }

    if (!isLoadingAuth && studentId) {
      fetchStudent()
    }
  }, [isLoadingAuth, studentId])

  // Show loading state while checking auth or loading student
  if (isLoadingAuth || isLoadingStudent) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !student) {
    return (
      <div className="container mx-auto py-8 max-w-7xl space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/students')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </Button>
        </div>

        {/* Error message */}
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Student</h2>
          <p className="text-destructive">{error || 'Student not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/students/${studentId}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student
        </Button>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold">Edit Student</h1>
        <p className="text-muted-foreground mt-1">Update {student.full_name}'s information</p>
      </div>

      {/* Student Form */}
      <div className="flex justify-center">
        <StudentForm mode="edit" student={student} />
      </div>
    </div>
  )
}
