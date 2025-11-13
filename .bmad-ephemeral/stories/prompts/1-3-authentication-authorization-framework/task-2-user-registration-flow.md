# Task 2: Implement User Registration Flow

## Story Context
**Story 1.3**: Authentication & Authorization Framework
**As a** developer, **I want** an authentication system with role-based access control, **so that** users can securely log in and access features based on their roles.

## Task Objective
Implement complete user registration flow including API route, signup page, validation, and database record creation.

## Acceptance Criteria Addressed
- AC 1: Users can register, log in, and log out securely

## Subtasks
- [ ] Create signup API route: POST /api/auth/signup
- [ ] Create signup page: apps/shell/app/(auth)/signup/page.tsx
- [ ] Validate email format and password strength (Zod schema)
- [ ] Create user record in users table after auth.users creation
- [ ] Set initial role (agency_admin for first user, agency_user otherwise)
- [ ] Send welcome email via Resend (optional for MVP)

## Implementation Guide

### 1. Create Signup API Route
**File**: `apps/shell/app/api/auth/signup/route.ts`

```typescript
import { createServerClient } from '@pleeno/database/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  full_name: z.string().min(1, 'Full name is required'),
  agency_name: z.string().min(1, 'Agency name is required'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, full_name, agency_name } = signupSchema.parse(body)

    const supabase = createServerClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Check if this is first user (agency admin)
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const isFirstUser = userCount === 0

    // 3. Create agency if first user
    let agencyId: string
    if (isFirstUser) {
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .insert({ name: agency_name })
        .select()
        .single()

      if (agencyError) {
        return NextResponse.json({ error: 'Failed to create agency' }, { status: 500 })
      }
      agencyId = agencyData.id
    }

    // 4. Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user!.id,
        email,
        full_name,
        agency_id: agencyId!,
        role: isFirstUser ? 'agency_admin' : 'agency_user',
      })

    if (userError) {
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
    }

    // 5. Update JWT metadata with agency_id and role
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        agency_id: agencyId,
        role: isFirstUser ? 'agency_admin' : 'agency_user',
      },
    })

    if (updateError) {
      console.error('Failed to update user metadata:', updateError)
    }

    return NextResponse.json({
      user: authData.user,
      session: authData.session
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 2. Create Signup Page
**File**: `apps/shell/app/(auth)/signup/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  full_name: z.string().min(1, 'Full name is required'),
  agency_name: z.string().min(1, 'Agency name is required'),
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to get started
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium">
              Full Name
            </label>
            <input
              {...register('full_name')}
              type="text"
              className="mt-1 block w-full rounded-md border px-3 py-2"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="agency_name" className="block text-sm font-medium">
              Agency Name
            </label>
            <input
              {...register('agency_name')}
              type="text"
              className="mt-1 block w-full rounded-md border px-3 py-2"
            />
            {errors.agency_name && (
              <p className="mt-1 text-sm text-red-600">{errors.agency_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full rounded-md border px-3 py-2"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full rounded-md border px-3 py-2"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

## Architecture Context
- Auth pages in apps/shell/app/(auth)/ route group (no layout)
- API routes handle server-side authentication logic
- First user becomes agency_admin and creates agency
- JWT metadata includes agency_id and role for RLS

## Prerequisites
- Task 1 completed (Supabase Auth integration)
- Story 1.2 completed (agencies and users tables exist)
- Database migrations applied

## Validation
- [ ] Signup page renders correctly
- [ ] Email validation works (rejects invalid emails)
- [ ] Password validation enforces complexity rules
- [ ] Signup creates record in auth.users
- [ ] Signup creates record in public.users
- [ ] First user gets agency_admin role
- [ ] JWT includes agency_id and role in metadata

## Next Steps
After completing this task, proceed to Task 3: Implement Login/Logout Flows.
