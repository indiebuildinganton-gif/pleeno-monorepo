'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ResetFormData = z.infer<typeof resetSchema>

interface PasswordResetFormProps {
  onSubmit: (email: string) => Promise<void>
  onBack?: () => void
}

export function PasswordResetForm({ onSubmit, onBack }: PasswordResetFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const handleFormSubmit = async (data: ResetFormData) => {
    try {
      setLoading(true)
      setError(null)
      await onSubmit(data.email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>We've sent you a password reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            Please check your inbox for the password reset link. If you don't see it, check your
            spam folder.
          </div>
        </CardContent>
        <CardFooter>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="w-full">
              Back to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              {...register('email')}
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={loading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          {onBack && (
            <Button type="button" onClick={onBack} variant="ghost" className="w-full">
              Back to Login
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
