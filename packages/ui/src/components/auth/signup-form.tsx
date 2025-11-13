'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'

const signupSchema = z
  .object({
    full_name: z.string().min(1, 'Full name is required'),
    agency_name: z.string().min(1, 'Agency name is required'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

interface SignupFormProps {
  onSubmit: (data: Omit<SignupFormData, 'confirmPassword'>) => Promise<void>
  onSignIn?: () => void
}

export function SignupForm({ onSubmit, onSignIn }: SignupFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const handleFormSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true)
      setError(null)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...signupData } = data
      await onSubmit(signupData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Sign up to get started with your agency</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              {...register('full_name')}
              id="full_name"
              type="text"
              placeholder="John Doe"
              disabled={loading}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency_name">Agency Name</Label>
            <Input
              {...register('agency_name')}
              id="agency_name"
              type="text"
              placeholder="Acme Agency"
              disabled={loading}
            />
            {errors.agency_name && (
              <p className="text-sm text-destructive">{errors.agency_name.message}</p>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              {...register('password')}
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be 8+ characters with uppercase, lowercase, and number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              {...register('confirmPassword')}
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>

          {onSignIn && (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button type="button" onClick={onSignIn} className="text-primary hover:underline">
                Sign in
              </button>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
