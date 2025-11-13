/**
 * Sentry utilities for error tracking and monitoring
 * These functions safely check if Sentry is available before using it
 */

/**
 * Set user context for Sentry error reports
 */
export function setSentryUser(user: {
  id: string
  email?: string
  agency_id?: string
  role?: string
}) {
  // Dynamically import and use Sentry if available
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.email,
        })

        // Add custom tags
        Sentry.setTag('agency_id', user.agency_id)
        Sentry.setTag('role', user.role)
      })
      .catch(() => {
        // Sentry not available, silently skip
      })
  }
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.setUser(null)
      })
      .catch(() => {
        // Sentry not available, silently skip
      })
  }
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
) {
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.addBreadcrumb({
          message,
          category,
          level,
          data,
          timestamp: Date.now() / 1000,
        })
      })
      .catch(() => {
        // Sentry not available, silently skip
      })
  }
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  // Try to use Sentry if available
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureException(error, {
          extra: context,
        })
      })
      .catch(() => {
        // Sentry not available, silently skip
      })
  } else {
    // Server-side - use dynamic import
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureException(error, {
          extra: context,
        })
      })
      .catch(() => {
        // Sentry not available, silently skip
      })
  }
}

/**
 * Capture message for non-error events
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureMessage(message, {
          level,
          extra: context,
        })
      })
      .catch(() => {
        // Sentry not available, silently skip
      })
  } else {
    // Server-side - use dynamic import
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureMessage(message, {
          level,
          extra: context,
        })
      })
      .catch(() => {
        // Sentry not available, silently skip
      })
  }
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs')
      .then((Sentry) => {
        return Sentry.startTransaction({
          name,
          op,
        })
      })
      .catch(() => {
        // Sentry not available, return null
        return null
      })
  }
  return null
}
