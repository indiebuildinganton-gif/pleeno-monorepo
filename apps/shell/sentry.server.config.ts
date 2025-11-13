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
