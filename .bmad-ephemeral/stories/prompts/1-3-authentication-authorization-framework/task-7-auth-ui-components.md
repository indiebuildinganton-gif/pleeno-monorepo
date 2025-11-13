# Task 7: Create Auth UI Components

## Story Context
**Story 1.3**: Authentication & Authorization Framework
**As a** developer, **I want** an authentication system with role-based access control, **so that** users can securely log in and access features based on their roles.

## Task Objective
Create reusable authentication UI components using React Hook Form, Zod validation, and Shadcn UI components.

## Acceptance Criteria Addressed
- AC 1: Users can register, log in, and log out securely

## Subtasks
- [ ] LoginForm component (packages/ui/src/components/auth/)
- [ ] SignupForm component
- [ ] LogoutButton component
- [ ] PasswordResetForm component
- [ ] Use React Hook Form + Zod validation
- [ ] Style with Shadcn UI components (Button, Input, Form)

## Implementation Guide

### 1. Setup Shadcn UI (if not already done)
```bash
# From apps/shell directory
cd apps/shell
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
```

### 2. Create Auth Components Directory
```bash
mkdir -p packages/ui/src/components/auth
```

### 3. Create LoginForm Component
**File**: `packages/ui/src/components/auth/login-form.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  onForgotPassword?: () => void
  onSignUp?: () => void
}

export function LoginForm({ onSubmit, onForgotPassword, onSignUp }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      setError(null)
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
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
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
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
          </div>

          {onForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          {onSignUp && (
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSignUp}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
```

### 4. Create SignupForm Component
**File**: `packages/ui/src/components/auth/signup-form.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const signupSchema = z.object({
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
}).refine((data) => data.password === data.confirmPassword, {
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
        <CardDescription>
          Sign up to get started with your agency
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
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
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
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
              <button
                type="button"
                onClick={onSignIn}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
```

### 5. Create LogoutButton Component
**File**: `packages/ui/src/components/auth/logout-button.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  onLogout: () => Promise<void>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  children?: React.ReactNode
}

export function LogoutButton({
  onLogout,
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  children = 'Sign Out',
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      await onLogout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      disabled={loading}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {loading ? 'Signing out...' : children}
    </Button>
  )
}
```

### 6. Create PasswordResetForm Component
**File**: `packages/ui/src/components/auth/password-reset-form.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

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
          <CardDescription>
            We've sent you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            Please check your inbox for the password reset link. If you don't see
            it, check your spam folder.
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
        <CardDescription>
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
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
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          {onBack && (
            <Button
              type="button"
              onClick={onBack}
              variant="ghost"
              className="w-full"
            >
              Back to Login
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
```

### 7. Create Auth Components Index
**File**: `packages/ui/src/components/auth/index.ts`

```typescript
export { LoginForm } from './login-form'
export { SignupForm } from './signup-form'
export { LogoutButton } from './logout-button'
export { PasswordResetForm } from './password-reset-form'
```

### 8. Update UI Package Index
**File**: `packages/ui/src/index.ts`

```typescript
// Export auth components
export * from './components/auth'

// Export other components
// ... existing exports
```

## Architecture Context
- Components are in shared UI package for reuse across zones
- Use Shadcn UI for consistent styling
- React Hook Form for form state management
- Zod for schema validation
- Components are presentational (business logic in parent)

## Component Props Pattern
All form components follow this pattern:
- `onSubmit`: Async function to handle form submission
- Navigation handlers: `onSignIn`, `onSignUp`, `onForgotPassword`, `onBack`
- No routing logic inside components (parent handles navigation)

## Styling Notes
- Uses Tailwind CSS via Shadcn UI
- Responsive design (works on mobile)
- Accessible (proper labels, ARIA attributes)
- Loading states and error handling built-in

## Prerequisites
- Shadcn UI installed and configured
- React Hook Form and Zod installed
- Tailwind CSS configured

## Validation
- [ ] LoginForm renders correctly
- [ ] SignupForm validates password complexity
- [ ] SignupForm checks password confirmation match
- [ ] LogoutButton triggers logout callback
- [ ] PasswordResetForm shows success state
- [ ] All forms show validation errors
- [ ] All components are responsive
- [ ] Loading states work correctly

## Usage Examples

### Using LoginForm in a Page
```typescript
'use client'

import { LoginForm } from '@pleeno/ui'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async (data: { email: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm
        onSubmit={handleLogin}
        onForgotPassword={() => router.push('/reset-password')}
        onSignUp={() => router.push('/signup')}
      />
    </div>
  )
}
```

## Next Steps
After completing this task, proceed to Task 8: Write Authentication Test Suite.
