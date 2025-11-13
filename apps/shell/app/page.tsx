/**
 * Root Page - Authentication-based Redirect
 *
 * This page serves as the entry point for the application.
 * It checks the user's authentication status and redirects accordingly:
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /login
 *
 * This ensures users always land on the appropriate page based on their auth state.
 */

import { redirect } from 'next/navigation'
import { createServerClient } from '@pleeno/database/server'

export default async function RootPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
