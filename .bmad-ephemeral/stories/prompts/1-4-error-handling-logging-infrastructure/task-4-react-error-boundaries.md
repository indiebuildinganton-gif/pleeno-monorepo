# Task 4: Implement React Error Boundaries

## Story Context
**Story 1.4**: Error Handling & Logging Infrastructure
**As a** developer, **I want** standardized error handling and logging throughout the application, **so that** I can diagnose issues quickly and provide helpful error messages to users.

## Task Objective
Create React Error Boundary components to catch rendering errors gracefully, display user-friendly fallback UI, and log errors to monitoring services.

## Acceptance Criteria Addressed
- AC 4: Client-side error boundaries catch React errors gracefully

## Subtasks
- [ ] Create packages/ui/src/components/ErrorBoundary.tsx
- [ ] Implement error state and fallback UI
- [ ] Add error logging to boundary component
- [ ] Create user-friendly error messages
- [ ] Add "Report Error" and "Retry" buttons
- [ ] Wrap zone layouts with ErrorBoundary

## Prerequisites
- Task 3 completed (logging utility available)
- packages/ui package exists

## Implementation Guide

### 1. Create Error Boundary Component
Create `packages/ui/src/components/ErrorBoundary.tsx`:

```typescript
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console
    console.error('React Error Boundary caught error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Store error info in state
    this.setState({
      hasError: true,
      error,
      errorInfo,
    })

    // Send to monitoring service (will be implemented in Task 5)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReport = () => {
    // TODO: Implement error reporting (could open support dialog, email, etc.)
    alert('Error reported to support team. Thank you!')
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-center">
              <svg
                className="h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Something went wrong
            </h2>

            <p className="mb-6 text-center text-gray-600">
              We've been notified and are working on it. Please try again.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 rounded bg-red-50 p-4">
                <p className="mb-2 font-mono text-sm text-red-800">
                  <strong>Error:</strong> {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-semibold text-red-700">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 overflow-auto text-xs text-red-600">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
              <button
                onClick={this.handleReport}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Report Error
              </button>
            </div>

            <div className="mt-4 text-center">
              <a
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Return to home page
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 2. Create Page-Level Error Boundary
Create `packages/ui/src/components/PageErrorBoundary.tsx` for page-specific errors:

```typescript
'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function PageErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Additional page-level error handling
        console.error('Page Error Boundary:', {
          error: error.message,
          componentStack: errorInfo.componentStack,
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### 3. Create Component-Level Error Boundary
Create `packages/ui/src/components/ComponentErrorBoundary.tsx` for smaller components:

```typescript
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
```

### 4. Export from Package Index
Update `packages/ui/src/index.ts`:

```typescript
export * from './components/ErrorBoundary'
export * from './components/PageErrorBoundary'
export * from './components/ComponentErrorBoundary'
```

### 5. Wrap Zone Layouts with Error Boundaries
Update zone layout files to include error boundaries:

**Example: apps/shell/app/(app)/layout.tsx**
```typescript
import { PageErrorBoundary } from '@pleeno/ui'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <div className="min-h-screen">
        {/* Your layout content */}
        {children}
      </div>
    </PageErrorBoundary>
  )
}
```

**Example: apps/shell/app/(public)/layout.tsx**
```typescript
import { PageErrorBoundary } from '@pleeno/ui'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <div className="min-h-screen">
        {/* Your layout content */}
        {children}
      </div>
    </PageErrorBoundary>
  )
}
```

### 6. Usage in Components
Example of using component-level error boundary:

```typescript
import { ComponentErrorBoundary } from '@pleeno/ui'

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <ComponentErrorBoundary componentName="User Stats">
        <UserStatsWidget />
      </ComponentErrorBoundary>

      <ComponentErrorBoundary componentName="Recent Activity">
        <RecentActivityWidget />
      </ComponentErrorBoundary>
    </div>
  )
}
```

## Architecture Context
- React Error Boundaries catch client-side rendering errors
- Graceful fallback UI prevents white screen of death
- Errors logged to console and monitoring service
- Different boundary levels (page, component) for granular error handling
- User-friendly error messages with recovery options

## References
- [Architecture: Error Handling Pattern](docs/architecture.md#error-handling)
- [React Error Boundaries Docs](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Story File](../../1-4-error-handling-logging-infrastructure.md)
- Context XML: `.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.context.xml`

## Validation
- [ ] ErrorBoundary component catches rendering errors
- [ ] Fallback UI displays user-friendly error message
- [ ] "Try again" button resets error state
- [ ] "Report Error" button triggers reporting (placeholder for now)
- [ ] Error logged to console with stack trace
- [ ] Development mode shows detailed error information
- [ ] Production mode shows generic error message
- [ ] PageErrorBoundary wraps page layouts
- [ ] ComponentErrorBoundary shows inline error UI
- [ ] Zone layouts wrapped with PageErrorBoundary
- [ ] No TypeScript errors

## Testing Ideas
Create test file `packages/ui/src/components/__tests__/ErrorBoundary.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

const ThrowError = () => {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders fallback UI when error occurs', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation()

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()

    spy.mockRestore()
  })
})
```

## Next Steps
After completing this task, proceed to Task 5: Integrate Error Monitoring Service.
