'use client'

/**
 * Contacts Section Component
 *
 * Displays college contacts with Add Contact button (admin only).
 * Fetches and displays contacts dynamically.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 13: College Detail Page Layout
 */

import { useEffect, useState } from 'react'
import { Button } from '@pleeno/ui'
import { getApiUrl } from '@/hooks/useApiUrl'

interface Contact {
  id: string
  name: string
  role_department: string | null
  position_title: string | null
  email: string | null
  phone: string | null
}

interface ContactsSectionProps {
  collegeId: string
  isAdmin: boolean
}

export function ContactsSection({ collegeId, isAdmin }: ContactsSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch(getApiUrl(`/api/colleges/${collegeId}/contacts`))
        if (response.ok) {
          const result = await response.json()
          setContacts(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [collegeId])

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Contacts</h2>
        <p className="text-sm text-muted-foreground">Loading contacts...</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Contacts</h2>
        {isAdmin && (
          <Button variant="outline" size="sm">
            Add Contact
          </Button>
        )}
      </div>
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No contacts added yet.
        </p>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="border-b pb-3 last:border-b-0">
              <div className="font-medium">{contact.name}</div>
              {contact.position_title && (
                <div className="text-sm text-muted-foreground">
                  {contact.position_title}
                </div>
              )}
              {contact.role_department && (
                <div className="text-sm text-muted-foreground">
                  {contact.role_department}
                </div>
              )}
              <div className="flex gap-4 mt-1 text-sm">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-primary hover:underline"
                  >
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <span className="text-muted-foreground">{contact.phone}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
