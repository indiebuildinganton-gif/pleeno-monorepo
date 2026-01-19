'use client'

/**
 * College Header Component
 *
 * Displays the college header with Edit and Delete buttons (admin only).
 * Handles delete confirmation and navigation.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 13: College Detail Page Layout
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@pleeno/ui'
import { getApiUrl } from '@/hooks/useApiUrl'
import Link from 'next/link'

interface CollegeHeaderProps {
  collegeId: string
  collegeName: string
  city: string | null
  commissionRate: number | null
  gstStatus: string | null
  isAdmin: boolean
}

export function CollegeHeader({
  collegeId,
  collegeName,
  city,
  commissionRate,
  gstStatus,
  isAdmin,
}: CollegeHeaderProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${collegeName}?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(getApiUrl(`/api/colleges/${collegeId}`), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete college')
      }

      router.push('/colleges')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete college:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete college. Please try again.'
      )
      setIsDeleting(false)
    }
  }

  return (
    <div className="mb-6">
      <Link
        href="/colleges"
        className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
      >
        ← Back to Colleges
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {collegeName}
            {city && <span className="text-muted-foreground"> — {city}</span>}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {commissionRate !== null && (
              <span>Commission: {commissionRate}%</span>
            )}
            {gstStatus && (
              <span>
                GST:{' '}
                {gstStatus.charAt(0).toUpperCase() + gstStatus.slice(1)}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href={`/colleges/${collegeId}/edit`}>
              <Button variant="outline">Edit Info</Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
