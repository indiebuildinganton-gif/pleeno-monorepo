/**
 * Agency Settings Page
 *
 * Allows agency admins to view and edit their agency's profile information.
 * Implements React Hook Form with Zod validation for a robust form experience.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2-1: Agency Profile Setup
 * Task 3: Create Agency Settings Page and Form
 */

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AgencyUpdateSchema,
  type AgencyUpdate,
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
} from '@pleeno/validations'
import { createClient, getCurrentAgencyId } from '@pleeno/database'
import { Button, Input, Label, Card } from '@pleeno/ui'

interface Agency {
  id: string
  name: string
  contact_email: string
  contact_phone?: string | null
  currency: string
  timezone: string
}

export default function AgencySettingsPage() {
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [agencyId, setAgencyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AgencyUpdate>({
    resolver: zodResolver(AgencyUpdateSchema),
  })

  const supabase = createClient()

  // Fetch current agency data on mount
  useEffect(() => {
    async function loadAgency() {
      try {
        setFetchLoading(true)

        // Get user's agency_id from session
        const currentAgencyId = await getCurrentAgencyId(supabase)

        if (!currentAgencyId) {
          setMessage({ type: 'error', text: 'User not associated with an agency' })
          setFetchLoading(false)
          return
        }

        setAgencyId(currentAgencyId)

        // Fetch agency data
        const { data: agency, error } = await supabase
          .from('agencies')
          .select('id, name, contact_email, contact_phone, currency, timezone')
          .eq('id', currentAgencyId)
          .single<Agency>()

        if (error) {
          console.error('Failed to fetch agency:', error)
          setMessage({ type: 'error', text: 'Failed to load agency data' })
          setFetchLoading(false)
          return
        }

        if (agency) {
          // Pre-fill form with current values
          reset({
            name: agency.name,
            contact_email: agency.contact_email,
            contact_phone: agency.contact_phone || undefined,
            currency: agency.currency as AgencyUpdate['currency'],
            timezone: agency.timezone,
          })
        }

        setFetchLoading(false)
      } catch (error) {
        console.error('Error loading agency:', error)
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
        setFetchLoading(false)
      }
    }

    loadAgency()
  }, [supabase, reset])

  const onSubmit = async (data: AgencyUpdate) => {
    if (!agencyId) {
      setMessage({ type: 'error', text: 'Agency ID not found' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/agencies/${agencyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Agency settings saved successfully!' })
      } else {
        // Handle validation errors
        if (result.error?.details?.errors) {
          const errorMessages = Object.entries(result.error.details.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ')
          setMessage({ type: 'error', text: errorMessages })
        } else {
          setMessage({
            type: 'error',
            text: result.error?.message || 'Failed to save agency settings',
          })
        }
      }
    } catch (error) {
      console.error('Error saving agency:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading agency settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Agency Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your agency&apos;s profile information and preferences
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Agency Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Agency Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter agency name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">
              Contact Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact_email"
              type="email"
              {...register('contact_email')}
              placeholder="contact@agency.com"
              className={errors.contact_email ? 'border-red-500' : ''}
            />
            {errors.contact_email && (
              <p className="text-sm text-red-500">{errors.contact_email.message}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone (Optional)</Label>
            <Input
              id="contact_phone"
              type="tel"
              {...register('contact_phone')}
              placeholder="+1 (555) 123-4567"
              className={errors.contact_phone ? 'border-red-500' : ''}
            />
            {errors.contact_phone && (
              <p className="text-sm text-red-500">{errors.contact_phone.message}</p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">
              Currency <span className="text-red-500">*</span>
            </Label>
            <select
              id="currency"
              {...register('currency')}
              className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
                errors.currency ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select a currency</option>
              {SUPPORTED_CURRENCIES.map((curr: string) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
            {errors.currency && <p className="text-sm text-red-500">{errors.currency.message}</p>}
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">
              Timezone <span className="text-red-500">*</span>
            </Label>
            <select
              id="timezone"
              {...register('timezone')}
              className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
                errors.timezone ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select a timezone</option>
              {SUPPORTED_TIMEZONES.map((tz: string) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            {errors.timezone && <p className="text-sm text-red-500">{errors.timezone.message}</p>}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
