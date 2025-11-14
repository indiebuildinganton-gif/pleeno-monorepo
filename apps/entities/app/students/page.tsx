'use client'

import { useState, useEffect } from 'react'
import { useStudents } from '../../hooks/useStudents'
import { StudentTable } from './components/StudentTable'
import { Button } from '@pleeno/ui/src/components/ui/button'
import { Input } from '@pleeno/ui/src/components/ui/input'
import { Plus, Search, Download, Upload } from 'lucide-react'
import { createClient } from '@pleeno/database/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Students List Page
 *
 * Displays a paginated, sortable, searchable table of students with:
 * - Full name, email, visa status (colored badge)
 * - College/Branch (two-line format: "College Name" + "Branch (City)")
 * - Relative timestamps (e.g., "4 days ago")
 * - Search functionality in top right
 * - Clickable rows to navigate to student details
 * - "Export CSV" button
 * - "+ Add Student" button
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 8: Student List UI Component
 *
 * Features:
 * - TanStack Query for data fetching with caching
 * - TanStack Table for sorting and filtering
 * - Pagination with metadata
 * - Search across name, email, phone, passport
 * - RLS-enforced agency isolation via API
 *
 * Acceptance Criteria (AC 1):
 * - Display all students in table format ✓
 * - Visa status as colored badges ✓
 * - College/Branch as two lines ✓
 * - Relative timestamps ✓
 * - Search functionality ✓
 * - Export CSV button ✓
 * - Add Student button ✓
 */
export default function StudentsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const { data, isLoading, error } = useStudents({
    page,
    per_page: 20,
    search: debouncedSearch,
  })

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

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleAddStudent = () => {
    router.push('/students/new')
  }

  const handleImportCSV = () => {
    router.push('/students/import')
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/students/export')
      if (!response.ok) {
        throw new Error('Failed to export students')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export students. Please try again.')
    }
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

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage your student registry and enrollments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleImportCSV}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleAddStudent}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search students by name, email, phone, or passport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">
            {error instanceof Error ? error.message : 'Failed to load students'}
          </p>
        </div>
      )}

      {/* Table */}
      {data && (
        <StudentTable
          data={data.data}
          pagination={data.meta}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.data.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">
            {debouncedSearch ? 'No students found' : 'No students yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {debouncedSearch
              ? 'Try adjusting your search query.'
              : 'Get started by adding your first student to the registry.'}
          </p>
          {!debouncedSearch && (
            <Button onClick={handleAddStudent}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
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
