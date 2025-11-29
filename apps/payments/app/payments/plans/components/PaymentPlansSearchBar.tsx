/**
 * PaymentPlansSearchBar Component
 *
 * Search bar with debounced search functionality for payment plans.
 * - Text input with search icon
 * - Debounced search (300ms delay)
 * - Clear button (X icon) to reset search
 * - URL query param synchronization: ?search=...
 *
 * Epic 4: Payments Domain
 * Story 4.3: Payment Plan List and Detail Views
 * Task 5: Search Bar Component
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input, Button } from '@pleeno/ui'
import { Search, X } from 'lucide-react'
import { useDebounce } from '../../../../hooks/useDebounce'

/**
 * Search bar component for filtering payment plans
 *
 * Provides real-time search with debouncing to reduce API calls.
 * Search state is synchronized with URL query parameters for shareability.
 */
export function PaymentPlansSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize search state from URL param
  const [search, setSearch] = useState(searchParams.get('search') || '')

  // Debounce search input (300ms delay)
  const debouncedSearch = useDebounce(search, 300)

  // Update URL when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    } else {
      params.delete('search')
    }

    // Update URL without reloading the page
    router.push(`?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, router, searchParams])

  /**
   * Clear search input and URL param
   */
  const handleClear = () => {
    setSearch('')
  }

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Search by student name or reference number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10 pr-10"
        aria-label="Search payment plans"
      />
      {search && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      )}
    </div>
  )
}
