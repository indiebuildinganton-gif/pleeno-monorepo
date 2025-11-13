import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { log, logInfo, logWarn, logError, logDebug, createLogger } from '../logger'

// Mock sentry module
vi.mock('../sentry', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

describe('Logger', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('log', () => {
    it('logs with correct level', () => {
      log('info', 'Test message')
      expect(consoleInfoSpy).toHaveBeenCalled()

      log('warn', 'Test warning')
      expect(consoleWarnSpy).toHaveBeenCalled()

      log('error', 'Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('includes context in log entry', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      log('info', 'Test message', {
        user_id: 'user123',
        agency_id: 'agency456',
      })

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0])
      expect(loggedData.context.user_id).toBe('user123')
      expect(loggedData.context.agency_id).toBe('agency456')

      process.env.NODE_ENV = originalEnv
    })

    it('includes error details', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Test error')
      log('error', 'Error occurred', undefined, error)

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(loggedData.error.name).toBe('Error')
      expect(loggedData.error.message).toBe('Test error')
      expect(loggedData.error.stack).toBeDefined()

      process.env.NODE_ENV = originalEnv
    })

    it('includes timestamp', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      log('info', 'Test message')

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0])
      expect(loggedData.timestamp).toBeDefined()
      expect(new Date(loggedData.timestamp).getTime()).toBeGreaterThan(0)

      process.env.NODE_ENV = originalEnv
    })

    it('formats as JSON in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      log('info', 'Test message')

      const output = consoleInfoSpy.mock.calls[0][0]
      expect(() => JSON.parse(output)).not.toThrow()

      process.env.NODE_ENV = originalEnv
    })

    it('formats as human-readable in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      log('info', 'Test message')

      const output = consoleInfoSpy.mock.calls[0][0]
      expect(output).toContain('INFO')
      expect(output).toContain('Test message')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Helper Functions', () => {
    it('logInfo calls log with info level', () => {
      logInfo('Info message')
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('logWarn calls log with warn level', () => {
      logWarn('Warning message')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('logError calls log with error level', () => {
      const error = new Error('Test error')
      logError('Error message', undefined, error)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('logDebug only logs in development', () => {
      const originalEnv = process.env.NODE_ENV

      process.env.NODE_ENV = 'development'
      logDebug('Debug message')
      expect(consoleDebugSpy).toHaveBeenCalled()

      consoleDebugSpy.mockClear()

      process.env.NODE_ENV = 'production'
      logDebug('Debug message')
      expect(consoleDebugSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('createLogger', () => {
    it('creates logger with base context', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const logger = createLogger({
        user_id: 'user123',
        request_id: 'req123',
      })

      logger.info('Test message')

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0])
      expect(loggedData.context.user_id).toBe('user123')
      expect(loggedData.context.request_id).toBe('req123')

      process.env.NODE_ENV = originalEnv
    })

    it('merges additional context', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const logger = createLogger({ user_id: 'user123' })

      logger.info('Test message', { action: 'test_action' })

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0])
      expect(loggedData.context.user_id).toBe('user123')
      expect(loggedData.context.action).toBe('test_action')

      process.env.NODE_ENV = originalEnv
    })
  })
})
