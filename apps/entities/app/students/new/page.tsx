'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@pleeno/database/client'
import { StudentForm } from '../components/StudentForm'
import { Button } from '@pleeno/ui/src/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

/**
 * Create Student Page
 *
 * Page for creating new students with form validation.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 9: Student Form Component
 *
 * Features:
 * - Client-side form with validation
 * - Required fields: full_name, passport_number
 * - Optional fields: email, phone, date_of_birth, nationality, visa_status
 * - Optional college and branch association
 * - Duplicate passport error handling
 * - Navigation back to student list
 *
 * Acceptance Criteria (AC 2):
 * - Student creation form ✓
 * - Required fields enforced ✓
 * - Optional fields allowed empty ✓
 * - Validation errors shown ✓
 * - Duplicate passport handling ✓
 */
export default function NewStudentPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

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

  // Show loading state while checking auth
  if (isLoadingAuth) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          onClick={() => router.push('/students')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Button>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold">Add New Student</h1>
        <p className="text-muted-foreground mt-1">
          Create a new student record in your registry
        </p>
      </div>

      {/* Student Form */}
      <div className="flex justify-center">
        <StudentForm mode="create" />
      </div>
    </div>
  )
}
