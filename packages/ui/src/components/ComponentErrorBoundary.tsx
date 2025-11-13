'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  componentName?: string
}

export function ComponentErrorBoundary({ children, componentName }: Props) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            {componentName
              ? `Error loading ${componentName}`
              : 'Error loading component'}
          </p>
          <p className="mt-1 text-xs text-red-600">
            Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      }
      onError={(error) => {
        console.error(`Component Error (${componentName}):`, error.message)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
