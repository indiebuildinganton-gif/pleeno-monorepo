import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  sanitizeError,
  createSafeErrorMessage,
} from '../errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('creates error with code and message', () => {
      const error = new AppError('SERVER_ERROR', 'Something went wrong')
      expect(error.code).toBe('SERVER_ERROR')
      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('AppError')
    })

    it('includes optional details', () => {
      const error = new AppError('VALIDATION_ERROR', 'Invalid input', {
        field: 'email',
      })
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('ValidationError', () => {
    it('creates validation error with correct code', () => {
      const error = new ValidationError('Invalid email')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Invalid email')
      expect(error.name).toBe('ValidationError')
    })
  })

  describe('NotFoundError', () => {
    it('creates not found error with correct code', () => {
      const error = new NotFoundError('Resource not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('Resource not found')
      expect(error.name).toBe('NotFoundError')
    })
  })

  describe('UnauthorizedError', () => {
    it('creates unauthorized error with correct code', () => {
      const error = new UnauthorizedError()
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.message).toBe('Authentication required')
      expect(error.name).toBe('UnauthorizedError')
    })

    it('accepts custom message', () => {
      const error = new UnauthorizedError('Invalid token')
      expect(error.message).toBe('Invalid token')
    })
  })

  describe('ForbiddenError', () => {
    it('creates forbidden error with correct code', () => {
      const error = new ForbiddenError()
      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('Access denied')
      expect(error.name).toBe('ForbiddenError')
    })
  })
})

describe('Error Sanitization', () => {
  it('redacts sensitive field names', () => {
    const data = {
      username: 'john',
      password: 'secret123',
      token: 'abc123',
      apiKey: 'key123',
    }

    const sanitized = sanitizeError(data)

    expect(sanitized.username).toBe('john')
    expect(sanitized.password).toBe('[REDACTED]')
    expect(sanitized.token).toBe('[REDACTED]')
    expect(sanitized.apiKey).toBe('[REDACTED]')
  })

  it('handles nested objects', () => {
    const data = {
      user: {
        name: 'John',
        password: 'secret',
      },
    }

    const sanitized = sanitizeError(data)

    expect(sanitized.user.name).toBe('John')
    expect(sanitized.user.password).toBe('[REDACTED]')
  })

  it('handles arrays', () => {
    const data = [
      { name: 'John', password: 'secret1' },
      { name: 'Jane', password: 'secret2' },
    ]

    const sanitized = sanitizeError(data)

    expect(sanitized[0].name).toBe('John')
    expect(sanitized[0].password).toBe('[REDACTED]')
    expect(sanitized[1].name).toBe('Jane')
    expect(sanitized[1].password).toBe('[REDACTED]')
  })
})

describe('createSafeErrorMessage', () => {
  it('returns AppError message', () => {
    const error = new ValidationError('Invalid input')
    const message = createSafeErrorMessage(error)
    expect(message).toBe('Invalid input')
  })

  it('returns generic message for unknown errors', () => {
    const error = new Error('Unexpected error')
    const message = createSafeErrorMessage(error)
    expect(message).toBe('An unexpected error occurred')
  })
})
