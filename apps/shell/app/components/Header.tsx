/**
 * Application Header Component
 *
 * Displays the agency name in the application header so users always know
 * which agency they're working in. Provides context across all pages.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2-1: Agency Profile Setup
 * Task 4: Display Agency Name in Application Header
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient, getCurrentAgencyId } from '@pleeno/database'

export function Header() {
  const [agencyName, setAgencyName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAgency() {
      try {
        const supabase = createClient()

        // Get user's agency_id from session
        const currentAgencyId = await getCurrentAgencyId(supabase)

        if (!currentAgencyId) {
          // No agency assigned - fall back to default name
          setAgencyName('Pleeno')
          setLoading(false)
          return
        }

        // Fetch agency name
        const { data: agency, error } = await supabase
          .from('agencies')
          .select('name')
          .eq('id', currentAgencyId)
          .single()

        if (error) {
          console.error('Failed to load agency:', error)
          setAgencyName('Pleeno')
        } else if (agency) {
          setAgencyName(agency.name)
        } else {
          setAgencyName('Pleeno')
        }
      } catch (error) {
        console.error('Error loading agency:', error)
        setAgencyName('Pleeno')
      } finally {
        setLoading(false)
      }
    }

    loadAgency()
  }, [])

  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{agencyName}</h1>
          {/* Additional header elements like navigation, user menu can be added here */}
        </div>
      </div>
    </header>
  )
}
