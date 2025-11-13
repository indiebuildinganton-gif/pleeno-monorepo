/**
 * Accept Invitation Form Component
 *
 * Client component that handles the invitation acceptance signup form.
 * Features:
 * - Pre-filled email from invitation
 * - Password validation with strength requirements
 * - Password confirmation matching
 * - Loading states
 * - Error handling
 * - Success redirect to dashboard with welcome toast
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 06: Create invitation acceptance page and flow
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

/**
 * Form validation schema (client-side)
 * Mirrors the server-side validation for consistent UX
 */
const acceptInvitationSchema = z
  .object({
    full_name: z.string().min(1, 'Full name is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[a-z]/, 'Must contain lowercase letter')
      .regex(/[0-9]/, 'Must contain number'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>

interface AcceptInvitationFormProps {
  token: string
  email: string
  agencyName: string
  tasks?: string
}

export default function AcceptInvitationForm({
  token,
  email,
  agencyName,
  tasks,
}: AcceptInvitationFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
  })

  const onSubmit = async (data: AcceptInvitationFormData) => {
    try {
      setLoading(true)
      setError(null)

      // Build API URL with tasks parameter if provided
      let apiUrl = '/api/accept-invitation'
      if (tasks) {
        apiUrl += `?tasks=${encodeURIComponent(tasks)}`
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          full_name: data.full_name,
          password: data.password,
          password_confirmation: data.password_confirmation,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Signup failed')
      }

      // Redirect to dashboard with success message
      // Note: In a real implementation, you might want to use a toast library
      // For now, we'll use query parameters to show the success message
      const welcomeMessage = encodeURIComponent(`Welcome to ${result.data.agency_name}!`)
      router.push(`/dashboard?welcome=${welcomeMessage}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Join {agencyName}</h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your profile to get started with Pleeno
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
          )}

          {/* Email field (read-only, pre-filled from invitation) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm"
            />
            <p className="mt-1 text-xs text-gray-500">This email is set by your invitation</p>
          </div>

          {/* Full Name field */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              {...register('full_name')}
              type="text"
              id="full_name"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="John Doe"
              autoFocus
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Must be 8+ characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Password Confirmation field */}
          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              {...register('password_confirmation')}
              type="password"
              id="password_confirmation"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Accept Invitation & Sign Up'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Log in
          </a>
        </div>
      </div>
    </div>
  )
}
