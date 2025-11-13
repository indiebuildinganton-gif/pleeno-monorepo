# Sentry Integration Setup Guide

This document explains how to set up and use Sentry error monitoring in the Pleeno application.

## Overview

Sentry has been integrated into the application to provide:

- Real-time error tracking and monitoring
- Performance monitoring
- Session replay for debugging
- User context tracking
- Source maps for production debugging
- Breadcrumb tracking for audit trails

## Quick Start

### 1. Create a Sentry Account

1. Sign up at [https://sentry.io/signup/](https://sentry.io/signup/)
2. Create a new project and select "Next.js" as the platform
3. Copy your DSN (Data Source Name)

### 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Required: Your Sentry DSN
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id

# Required for source maps upload (production builds)
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

To create an auth token:

1. Go to [https://sentry.io/settings/account/api/auth-tokens/](https://sentry.io/settings/account/api/auth-tokens/)
2. Click "Create New Token"
3. Give it a name (e.g., "Pleeno Source Maps")
4. Select scopes: `project:releases` and `project:write`
5. Copy the token and add it to your `.env.local`

### 3. Test the Integration

1. Start the development server: `npm run dev`
2. Navigate to [http://localhost:3000/test-sentry](http://localhost:3000/test-sentry)
3. Click the test buttons to trigger various Sentry events
4. Check your Sentry dashboard to verify events are being captured

**Note**: Sentry is disabled in development mode by default. To test in development:

- Events will still be captured but you'll see them in the console
- To enable Sentry in development, modify the configuration files and remove the `enabled: process.env.NODE_ENV === 'production'` check

## Configuration Files

### Client-Side Configuration

**File**: `apps/shell/sentry.client.config.ts`

Handles browser-side error tracking with:

- Session replay integration
- Sensitive data filtering (headers, cookies, query params)
- Performance monitoring

### Server-Side Configuration

**File**: `apps/shell/sentry.server.config.ts`

Handles server-side error tracking with:

- Environment variable filtering
- Performance monitoring

### Edge Runtime Configuration

**File**: `apps/shell/sentry.edge.config.ts`

Handles edge runtime error tracking for middleware and edge functions.

### Next.js Configuration

**File**: `apps/shell/next.config.ts`

Wraps Next.js config with Sentry's `withSentryConfig` to:

- Upload source maps during production builds
- Enable error tracking

## Usage

### Automatic Error Capture

Errors are automatically captured in these scenarios:

- Unhandled exceptions in React components (via ErrorBoundary)
- API route errors (via error handler)
- All errors logged with `logError()` from `@pleeno/utils`

### Manual Error Capture

```typescript
import { captureException, captureMessage } from '@pleeno/utils'

// Capture an exception
try {
  // Some code that might throw
} catch (error) {
  captureException(error as Error, {
    context: 'additional-context',
    userId: user.id,
  })
}

// Capture a message
captureMessage('Something important happened', 'info', {
  action: 'user-action',
})
```

### Setting User Context

```typescript
import { setSentryUser, clearSentryUser } from '@pleeno/utils'

// On login
setSentryUser({
  id: user.id,
  email: user.email,
  agency_id: user.agency_id,
  role: user.role,
})

// On logout
clearSentryUser()
```

### Adding Breadcrumbs

```typescript
import { addSentryBreadcrumb } from '@pleeno/utils'

addSentryBreadcrumb('User clicked payment button', 'user-action', 'info', { paymentAmount: 100 })
```

### Using with Logger

The logger automatically sends errors to Sentry:

```typescript
import { logError, logWarn } from '@pleeno/utils'

// This will log to console AND send to Sentry
logError('Payment failed', { userId: '123', amount: 100 }, error)

// Warnings are sent to Sentry in production only
logWarn('Unusual activity detected', { userId: '123' })
```

## Error Boundary Integration

All React components are wrapped with ErrorBoundary which:

1. Catches unhandled React errors
2. Displays a user-friendly error UI
3. Automatically sends errors to Sentry with component stack traces

To use in your components:

```tsx
import { ErrorBoundary } from '@pleeno/ui'

;<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Source Maps

Source maps are automatically uploaded to Sentry during production builds when:

1. `SENTRY_AUTH_TOKEN` is configured
2. `SENTRY_ORG` and `SENTRY_PROJECT` are set
3. You run `npm run build`

This allows you to see readable stack traces in production errors.

## Security & Privacy

The integration includes several security measures:

### Filtered Data

- Authorization headers
- Cookie headers
- Sensitive query parameters
- Environment variables

### Configuration

Review `beforeSend` hooks in the Sentry config files to adjust what data is sent.

## Performance Monitoring

Performance monitoring is enabled with:

- 100% sample rate in development
- 10% sample rate in production

To adjust, modify `tracesSampleRate` in the Sentry config files.

## Session Replay

Session replay is configured with:

- 100% of error sessions recorded
- 10% of normal sessions recorded
- All text and media masked for privacy

Adjust in `sentry.client.config.ts` if needed.

## Troubleshooting

### Events Not Appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify you're running in production mode or have enabled Sentry in development
3. Check browser console for any Sentry initialization errors
4. Verify your Sentry project is active and not paused

### Source Maps Not Uploading

1. Verify `SENTRY_AUTH_TOKEN` has correct permissions
2. Check that `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry project
3. Look for upload errors during build: `npm run build`

### Too Many Events

Adjust sample rates in the config files:

- `tracesSampleRate`: Controls performance monitoring
- `replaysSessionSampleRate`: Controls normal session replay
- `replaysOnErrorSampleRate`: Controls error session replay

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io/)
- [Sentry API Documentation](https://docs.sentry.io/api/)

## Support

For issues with the Sentry integration, check:

1. This documentation
2. The test page at `/test-sentry`
3. Sentry's official documentation
4. Open an issue in the project repository
