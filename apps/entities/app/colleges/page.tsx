'use client'

import { useState, useEffect } from 'react'
import { useColleges } from '../../hooks/useColleges'
import { CollegesTable } from './components/CollegesTable'
import { Button } from '@pleeno/ui/src/components/ui/button'
import { Plus } from 'lucide-react'
import { createClient } from '@pleeno/database/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Colleges List Page
 *
 * Displays a paginated, sortable table of colleges with:
 * - College name, city, commission rate
 * - GST status badge (Included/Excluded)
 * - Branch count
 * - Last updated timestamp
 * - Clickable rows to navigate to college details
 * - Admin-only "+ Add College" button
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 12: Frontend - College List Page (Server Component)
 *
 * Features:
 * - TanStack Query for data fetching with caching
 * - TanStack Table for sorting and filtering
 * - Pagination with metadata
 * - Role-based UI (admin button only for agency_admin)
 * - RLS-enforced agency isolation via API
 */
export default function CollegesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const { data, isLoading, error } = useColleges({ page, per_page: 20 })

  // Check authentication and get user info
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleAddCollege = () => {
    router.push('/colleges/new')
  }

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

  const isAdmin = user?.app_metadata?.role === 'agency_admin'

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Colleges</h1>
          <p className="text-muted-foreground">
            Manage your college registry and branches
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddCollege}>
            <Plus className="h-4 w-4 mr-2" />
            Add College
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">
            {error instanceof Error ? error.message : 'Failed to load colleges'}
          </p>
        </div>
      )}

      {/* Table */}
      {data && (
        <CollegesTable
          data={data.data}
          pagination={data.meta}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.data.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No colleges yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first college to the registry.
          </p>
          {isAdmin && (
            <Button onClick={handleAddCollege}>
              <Plus className="h-4 w-4 mr-2" />
              Add College
            </Button>
          )}
        </div>
      )}

      {/* Loading State (initial load) */}
      {isLoading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}
