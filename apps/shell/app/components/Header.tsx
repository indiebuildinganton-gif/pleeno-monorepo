/**
 * Application Header Component
 *
 * Displays the agency name in the application header so users always know
 * which agency they're working in. Provides context across all pages.
 * Includes navigation with role-based access control.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2-1: Agency Profile Setup
 * Task 4: Display Agency Name in Application Header
 * Task 6: Add Role-Based Access Control for Settings Page
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient, getCurrentAgencyId } from '@pleeno/database'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationBell } from './NotificationBell'

export function Header() {
  const [agencyName, setAgencyName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()

        // Get authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Check if user is admin
          const userRole = user.app_metadata?.role
          setIsAdmin(userRole === 'agency_admin')

          // Get user's agency_id from session
          const currentAgencyId = await getCurrentAgencyId(supabase)

          if (currentAgencyId) {
            // Fetch agency name
            const { data: agency, error } = await supabase
              .from('agencies')
              .select('name')
              .eq('id', currentAgencyId)
              .single()

            if (!error && agency) {
              setAgencyName(agency.name)
            } else {
              setAgencyName('Pleeno')
            }
          } else {
            setAgencyName('Pleeno')
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setAgencyName('Pleeno')
      } finally {
        setLoading(false)
      }
    }

    loadData()
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

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                pathname === '/dashboard' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              Dashboard
            </Link>

            {isAdmin && (
              <Link
                href="/settings"
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-gray-900 ${
                  pathname === '/settings' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                Settings
                <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                  Admin
                </span>
              </Link>
            )}

            {/* Notification Bell */}
            <NotificationBell />
          </nav>
        </div>
      </div>
    </header>
  )
}
