'use client'

import { ToastProvider } from '@pleeno/ui'
import { QueryProvider } from './QueryProvider'

/**
 * Combined Providers Component
 *
 * Wraps the app with all necessary providers:
 * - QueryProvider: TanStack Query for data fetching and caching
 * - ToastProvider: Toast notifications
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>{children}</ToastProvider>
    </QueryProvider>
  )
}
