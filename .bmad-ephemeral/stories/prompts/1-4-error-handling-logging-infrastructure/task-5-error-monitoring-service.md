# Task 5: Integrate Error Monitoring Service

## Story Context
**Story 1.4**: Error Handling & Logging Infrastructure
**As a** developer, **I want** standardized error handling and logging throughout the application, **so that** I can diagnose issues quickly and provide helpful error messages to users.

## Task Objective
Integrate Sentry error monitoring service for real-time error tracking, user context attachment, source map configuration, and alerting for critical issues.

## Acceptance Criteria Addressed
- AC 5: Logging integrates with monitoring service (e.g., Sentry, LogRocket)

## Subtasks
- [ ] Choose monitoring service: Sentry or LogRocket
- [ ] Install and configure SDK in root layout
- [ ] Set up error tracking initialization
- [ ] Configure source maps for production builds
- [ ] Add user context to error reports (agency_id, user_id)
- [ ] Set up error alerting for critical issues
- [ ] Test error reporting end-to-end

## Prerequisites
- Task 1-4 completed (error handling infrastructure in place)
- Sentry account created (free tier available)

## Implementation Guide

### 1. Install Sentry SDK
```bash
# From project root
pnpm add @sentry/nextjs
```

### 2. Initialize Sentry Configuration
Run Sentry wizard:
```bash
npx @sentry/wizard@latest -i nextjs
```

This will create:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Update `next.config.js`

### 3. Configure Client-Side Sentry
Update `apps/shell/sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Disable in development
  enabled: process.env.NODE_ENV === 'production',

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }

    // Sanitize breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data?.url) {
          // Remove query parameters that might contain sensitive data
          breadcrumb.data.url = breadcrumb.data.url.split('?')[0]
        }
        return breadcrumb
      })
    }

    return event
  },
})
```

### 4. Configure Server-Side Sentry
Update `apps/shell/sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Disable in development
  enabled: process.env.NODE_ENV === 'production',

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive environment variables
    if (event.contexts?.runtime?.name === 'node') {
      // Don't send full environment
      delete event.contexts.runtime
    }

    return event
  },
})
```

### 5. Configure Edge Runtime Sentry
Update `apps/shell/sentry.edge.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === 'production',
})
```

### 6. Add Environment Variables
Update `.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Sentry Auth Token (for source maps upload)
SENTRY_AUTH_TOKEN=your-auth-token
```

### 7. Create Sentry Utilities
Create `packages/utils/src/sentry.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

/**
 * Set user context for Sentry error reports
 */
export function setSentryUser(user: {
  id: string
  email?: string
  agency_id?: string
  role?: string
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
  })

  // Add custom tags
  Sentry.setTag('agency_id', user.agency_id)
  Sentry.setTag('role', user.role)
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture message for non-error events
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  })
}
```

### 8. Update Logger to Use Sentry
Update `packages/utils/src/logger.ts`:

```typescript
import { captureException, captureMessage } from './sentry'

// In logError function, add:
export function logError(message: string, context?: LogContext, error?: Error): void {
  log('error', message, context, error)

  // Send to Sentry if available
  if (error) {
    captureException(error, context)
  } else {
    captureMessage(message, 'error', context)
  }
}

// In logWarn function, add:
export function logWarn(message: string, context?: LogContext): void {
  log('warn', message, context)

  // Send warnings to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    captureMessage(message, 'warning', context)
  }
}
```

### 9. Update Error Boundary
Update `packages/ui/src/components/ErrorBoundary.tsx`:

```typescript
import * as Sentry from '@sentry/nextjs'

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // ... existing logging code ...

  // Send to Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  })
}
```

### 10. Set User Context on Login
Update login logic to set Sentry user context:

```typescript
// In your auth callback/middleware after successful login
import { setSentryUser } from '@pleeno/utils'

// After user is authenticated
const user = await supabase.auth.getUser()
if (user.data.user) {
  setSentryUser({
    id: user.data.user.id,
    email: user.data.user.email,
    agency_id: user.data.user.user_metadata?.agency_id,
    role: user.data.user.user_metadata?.role,
  })
}
```

### 11. Clear Context on Logout
Update logout logic:

```typescript
import { clearSentryUser } from '@pleeno/utils'

// During logout
await supabase.auth.signOut()
clearSentryUser()
```

### 12. Configure Next.js for Source Maps
Update `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs')

const moduleExports = {
  // ... your existing config ...
}

const sentryWebpackPluginOptions = {
  // Upload source maps during production build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
}

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions)
```

### 13. Test Error Reporting
Create a test page `apps/shell/app/test-sentry/page.tsx`:

```typescript
'use client'

import { captureException, captureMessage } from '@pleeno/utils'

export default function TestSentryPage() {
  const throwError = () => {
    throw new Error('Test Sentry Error')
  }

  const captureTestError = () => {
    try {
      throw new Error('Manually captured error')
    } catch (error) {
      captureException(error as Error, {
        testContext: 'manual capture',
      })
    }
  }

  const captureTestMessage = () => {
    captureMessage('Test Sentry Message', 'info', {
      testContext: 'message capture',
    })
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Test Sentry Integration</h1>
      <div className="space-y-4">
        <button
          onClick={throwError}
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Throw Unhandled Error
        </button>
        <button
          onClick={captureTestError}
          className="rounded bg-orange-600 px-4 py-2 text-white"
        >
          Capture Exception Manually
        </button>
        <button
          onClick={captureTestMessage}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Capture Message
        </button>
      </div>
    </div>
  )
}
```

## Architecture Context
- Sentry provides real-time error tracking and monitoring
- Source maps enable readable stack traces in production
- User context helps identify which users are affected
- Breadcrumbs provide audit trail of user actions
- Sensitive data filtered before sending to Sentry

## References
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Story File](../../1-4-error-handling-logging-infrastructure.md)
- Context XML: `.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.context.xml`

## Validation
- [ ] Sentry SDK installed and configured
- [ ] Client, server, and edge runtimes initialized
- [ ] Environment variables set correctly
- [ ] Source maps uploaded to Sentry
- [ ] User context attached to error reports
- [ ] Sensitive data filtered from reports
- [ ] Test errors appear in Sentry dashboard
- [ ] Breadcrumbs tracked correctly
- [ ] Performance monitoring enabled
- [ ] Session replay configured

## Security Considerations
- Filter authorization headers and cookies
- Redact sensitive query parameters
- Don't send environment variables to Sentry
- Sanitize user data before attaching to reports
- Use `beforeSend` hook to filter sensitive data

## Next Steps
After completing this task, proceed to Task 6: Apply Error Handling to Existing API Routes.
