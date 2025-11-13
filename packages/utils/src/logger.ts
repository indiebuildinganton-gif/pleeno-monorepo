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
