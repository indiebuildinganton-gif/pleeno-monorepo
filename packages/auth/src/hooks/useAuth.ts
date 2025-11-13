/**
 * useAuth Hook - Client-side authentication hook
 *
 * Provides authentication state and methods for React components.
 * Features:
 * - Current user and session state
 * - Loading state for auth initialization
 * - Sign in, sign up, and sign out methods
 * - Real-time auth state change listening
 * - Automatic session refresh
 *
 * @module packages/auth/src/hooks/useAuth
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@pleeno/database/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

/**
 * Authentication hook return type
 */
export interface UseAuthReturn {
  /** Currently authenticated user, or null if not authenticated */
  user: User | null
  /** Current session, or null if not authenticated */
  session: Session | null
  /** True while initial auth state is being loaded */
  loading: boolean
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>
  /** Sign up with email, password, and full name */
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: User | null; session: Session | null }>
  /** Sign out the current user */
  signOut: () => Promise<void>
}

/**
 * Hook for managing authentication state and operations
 *
 * Usage:
 * ```tsx
 * const { user, loading, signIn, signOut } = useAuth()
 *
 * if (loading) return <div>Loading...</div>
 * if (!user) return <div>Not authenticated</div>
 *
 * return <div>Welcome, {user.email}</div>
 * ```
 *
 * @returns Authentication state and methods
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [supabase])

  /**
   * Sign in with email and password
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns User and session data
   * @throws Error if authentication fails
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  /**
   * Sign up a new user with email, password, and full name
   *
   * @param email - User's email address
   * @param password - User's password
   * @param fullName - User's full name
   * @returns User and session data
   * @throws Error if registration fails
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
    return data
  }

  /**
   * Sign out the current user
   *
   * Clears the session and redirects to login page
   *
   * @throws Error if sign out fails
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/login')
    router.refresh()
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
