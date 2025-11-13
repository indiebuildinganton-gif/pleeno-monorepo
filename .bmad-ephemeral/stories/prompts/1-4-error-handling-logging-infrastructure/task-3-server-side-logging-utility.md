# Task 3: Create Server-Side Logging Utility

## Story Context
**Story 1.4**: Error Handling & Logging Infrastructure
**As a** developer, **I want** standardized error handling and logging throughout the application, **so that** I can diagnose issues quickly and provide helpful error messages to users.

## Task Objective
Create a structured logging utility with log levels, context enrichment, and environment-aware formatting for server-side logging throughout the application.

## Acceptance Criteria Addressed
- AC 2: Errors are logged with sufficient context (user_id, agency_id, timestamp, stack trace)

## Subtasks
- [ ] Create packages/utils/src/logger.ts with structured logging
- [ ] Implement log levels (info, warn, error, debug)
- [ ] Add context enrichment (user_id, agency_id, request_id)
- [ ] Format logs as JSON for production
- [ ] Add human-readable formatting for development
- [ ] Create helper functions: logInfo(), logWarn(), logError(), logDebug()

## Prerequisites
- Task 1 completed (custom error classes and sanitization)

## Implementation Guide

### 1. Create Logger Utility
Create `packages/utils/src/logger.ts`:

```typescript
import { sanitizeError } from './errors'

// Log levels
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

// Log context interface
export interface LogContext {
  user_id?: string
  agency_id?: string
  request_id?: string
  action?: string
  [key: string]: any
}

// Log entry structure
interface LogEntry {
  level: LogLevel
  timestamp: string
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

/**
 * Core logging function with structured output
 */
export function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void {
  const timestamp = new Date().toISOString()

  // Build log entry
  const logEntry: LogEntry = {
    level,
    timestamp,
    message,
  }

  // Add sanitized context if provided
  if (context) {
    logEntry.context = sanitizeError(context)
  }

  // Add error details if provided
  if (error) {
    logEntry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  // Format output based on environment
  const output = formatLog(logEntry)

  // Output to appropriate console method
  switch (level) {
    case 'error':
      console.error(output)
      break
    case 'warn':
      console.warn(output)
      break
    case 'info':
      console.info(output)
      break
    case 'debug':
      console.debug(output)
      break
  }
}

/**
 * Format log entry based on environment
 */
function formatLog(entry: LogEntry): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDevelopment) {
    // Human-readable format for development
    return formatDevelopmentLog(entry)
  } else {
    // JSON format for production (machine-parseable)
    return JSON.stringify(entry)
  }
}

/**
 * Format log for development with colors and readability
 */
function formatDevelopmentLog(entry: LogEntry): string {
  const parts: string[] = []

  // Timestamp
  parts.push(`[${entry.timestamp}]`)

  // Level (uppercase)
  parts.push(`[${entry.level.toUpperCase()}]`)

  // Message
  parts.push(entry.message)

  // Context
  if (entry.context) {
    parts.push('\n  Context:', JSON.stringify(entry.context, null, 2))
  }

  // Error details
  if (entry.error) {
    parts.push('\n  Error:', entry.error.name, '-', entry.error.message)
    if (entry.error.stack) {
      parts.push('\n  Stack:', entry.error.stack)
    }
  }

  return parts.join(' ')
}

/**
 * Helper: Log info level message
 */
export function logInfo(message: string, context?: LogContext): void {
  log('info', message, context)
}

/**
 * Helper: Log warning level message
 */
export function logWarn(message: string, context?: LogContext): void {
  log('warn', message, context)
}

/**
 * Helper: Log error level message
 */
export function logError(message: string, context?: LogContext, error?: Error): void {
  log('error', message, context, error)
}

/**
 * Helper: Log debug level message
 */
export function logDebug(message: string, context?: LogContext): void {
  // Only log debug in development
  if (process.env.NODE_ENV === 'development') {
    log('debug', message, context)
  }
}

/**
 * Create a logger with pre-set context (useful for request handlers)
 */
export function createLogger(baseContext: LogContext) {
  return {
    info: (message: string, additionalContext?: LogContext) =>
      logInfo(message, { ...baseContext, ...additionalContext }),

    warn: (message: string, additionalContext?: LogContext) =>
      logWarn(message, { ...baseContext, ...additionalContext }),

    error: (message: string, error?: Error, additionalContext?: LogContext) =>
      logError(message, { ...baseContext, ...additionalContext }, error),

    debug: (message: string, additionalContext?: LogContext) =>
      logDebug(message, { ...baseContext, ...additionalContext }),
  }
}

/**
 * Extract request ID from headers or generate one
 */
export function getRequestId(headers: Headers): string {
  return headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
}
```

### 2. Export from Package Index
Update `packages/utils/src/index.ts`:

```typescript
export * from './errors'
export * from './api-error-handler'
export * from './logger'
```

### 3. Example Usage in API Route
Example usage (apps/shell/app/api/example/route.ts):

```typescript
import { NextRequest } from 'next/server'
import { logInfo, logError, createLogger, getRequestId } from '@pleeno/utils'

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  // Using helper functions
  logInfo('Fetching example data', {
    request_id: requestId,
    path: '/api/example',
  })

  try {
    // Your logic here
    const data = { message: 'Success' }
    return Response.json({ success: true, data })
  } catch (error) {
    logError('Failed to fetch example data', {
      request_id: requestId,
      path: '/api/example',
    }, error as Error)

    throw error
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  // Using context logger
  const logger = createLogger({
    request_id: requestId,
    path: '/api/example',
    action: 'create_example',
  })

  logger.info('Creating new example')

  try {
    const body = await request.json()
    logger.debug('Request body received', { body })

    // Your logic here
    const data = { id: 1, ...body }

    logger.info('Example created successfully', { example_id: data.id })
    return Response.json({ success: true, data }, { status: 201 })
  } catch (error) {
    logger.error('Failed to create example', error as Error)
    throw error
  }
}
```

### 4. Example Usage in Server Components
Example usage in Server Components:

```typescript
import { createServerClient } from '@pleeno/database/server'
import { logInfo, logError } from '@pleeno/utils'

export default async function DashboardPage() {
  const supabase = createServerClient()

  try {
    logInfo('Fetching dashboard data', {
      action: 'load_dashboard',
    })

    const { data: session } = await supabase.auth.getSession()

    if (!session) {
      logWarn('Unauthenticated access attempt to dashboard')
      redirect('/login')
    }

    // Your logic here
    return <div>Dashboard</div>
  } catch (error) {
    logError('Dashboard page error', {
      action: 'load_dashboard',
    }, error as Error)

    throw error
  }
}
```

## Architecture Context
- Structured logging with consistent format
- JSON logs in production for machine parsing
- Human-readable logs in development for debugging
- Context enrichment with user/agency/request IDs
- Automatic sensitive data filtering via sanitizeError()

## References
- [Architecture: Logging Pattern](docs/architecture.md#logging-pattern)
- [Story File](../../1-4-error-handling-logging-infrastructure.md)
- Context XML: `.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.context.xml`

## Validation
- [ ] log() function outputs structured logs
- [ ] Log levels work correctly (info, warn, error, debug)
- [ ] Production logs are JSON formatted
- [ ] Development logs are human-readable
- [ ] Context enrichment includes user_id, agency_id, request_id
- [ ] Error objects logged with name, message, stack
- [ ] Sensitive data filtered from context
- [ ] Helper functions (logInfo, logWarn, logError, logDebug) work
- [ ] createLogger() creates logger with pre-set context
- [ ] getRequestId() extracts or generates request ID
- [ ] Debug logs only appear in development

## Security Considerations
- Sensitive data automatically filtered via sanitizeError()
- Stack traces logged but never exposed to client
- Context includes audit trail (user_id, agency_id, timestamp)
- Logs stored securely with restricted access

## Next Steps
After completing this task, proceed to Task 4: Implement React Error Boundaries.
