/**
 * Email Verification Page
 *
 * Verifies email change via token and handles the verification flow.
 * - Extracts token from query params
 * - Calls POST /api/users/verify-email?token=... on page load
 * - Shows loading state while verifying
 * - On success: Shows success message and redirects to profile after 3 seconds
 * - On error: Shows error message with link to request new verification email
 *
 * Epic 2: Agency & User Management
 * Story 2.4: User Profile Management
 * Task 10: Create email verification page
 *
 * Acceptance Criteria: 9
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@pleeno/ui'
import Link from 'next/link'

type VerificationState = 'loading' | 'success' | 'error'

interface ErrorDetails {
  message: string
  code?: string
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<VerificationState>('loading')
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const token = searchParams.get('token')

    // If no token provided, show error immediately
    if (!token) {
      setState('error')
      setError({
        message: 'No verification token provided. Please check your email for the verification link.',
        code: 'MISSING_TOKEN',
      })
      return
    }

    // Call API to verify email
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/users/verify-email?token=${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setState('success')
          // Start countdown for redirect
          let secondsLeft = 3
          const countdownInterval = setInterval(() => {
            secondsLeft -= 1
            setCountdown(secondsLeft)
            if (secondsLeft <= 0) {
              clearInterval(countdownInterval)
              router.push('/profile')
            }
          }, 1000)
        } else {
          setState('error')
          setError({
            message: data.error?.message || 'Failed to verify email. Please try again.',
            code: data.error?.code,
          })
        }
      } catch (err) {
        setState('error')
        setError({
          message: 'An unexpected error occurred. Please try again later.',
          code: 'NETWORK_ERROR',
        })
        console.error('Email verification error:', err)
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {state === 'loading' && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verifying Your Email</CardTitle>
              <CardDescription>
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {state === 'success' && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email Verified Successfully!</CardTitle>
              <CardDescription>
                Your email address has been updated successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting to your profile in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <Button onClick={() => router.push('/profile')} className="w-full">
                Go to Profile Now
              </Button>
            </CardContent>
          </Card>
        )}

        {state === 'error' && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
              <CardDescription className="text-red-600">
                {error?.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-red-900 mb-2">
                  What happened?
                </h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {error?.code === 'MISSING_TOKEN' && (
                    <li>• The verification link is incomplete</li>
                  )}
                  {(error?.message.includes('expired') || error?.message.includes('Invalid')) && (
                    <>
                      <li>• The verification link may have expired (valid for 1 hour)</li>
                      <li>• The link may have already been used</li>
                      <li>• The link may be invalid or corrupted</li>
                    </>
                  )}
                  {error?.code === 'NETWORK_ERROR' && (
                    <li>• There was a problem connecting to the server</li>
                  )}
                </ul>
              </div>

              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/profile">
                    <Mail className="mr-2 h-4 w-4" />
                    Go to Profile
                  </Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Need a new verification email? Go to your profile and request a new email change.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
