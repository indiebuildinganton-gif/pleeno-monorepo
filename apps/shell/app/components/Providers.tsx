/**
 * Client-side Providers
 *
 * Wraps the app with necessary providers for React Query and other client-side libraries.
 * Must be a client component to use React hooks and state.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 3
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance per component instance (not shared across requests)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default settings for queries
            staleTime: 60 * 1000, // Data considered fresh for 60 seconds
            refetchOnWindowFocus: false, // Don't auto-refetch when window regains focus
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
