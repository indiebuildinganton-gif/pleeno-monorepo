import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleApiError, createSuccessResponse } from '../api-error-handler'
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../errors'

// Mock Next.js server
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body: unknown, init?: { status?: number }) => {
        return {
          status: init?.status || 200,
          json: async () => body,
        }
      }),
    },
  }
})

describe('API Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('returns 400 for ValidationError', async () => {
      const error = new ValidationError('Invalid input', { field: 'email' })
      const response = await handleApiError(error)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.message).toBe('Invalid input')
      expect(body.error.details).toEqual({ field: 'email' })
    })

    it('returns 404 for NotFoundError', async () => {
      const error = new NotFoundError('Resource not found')
      const response = await handleApiError(error)

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('returns 401 for UnauthorizedError', async () => {
      const error = new UnauthorizedError()
      const response = await handleApiError(error)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for ForbiddenError', async () => {
      const error = new ForbiddenError()
      const response = await handleApiError(error)

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('FORBIDDEN')
    })

    it('returns 500 for unknown errors in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Unexpected error')
      const response = await handleApiError(error)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('SERVER_ERROR')
      expect(body.error.message).toBe('An unexpected error occurred')

      process.env.NODE_ENV = originalEnv
    })

    it('returns error details for unknown errors in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Unexpected error')
      const response = await handleApiError(error)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('SERVER_ERROR')
      expect(body.error.message).toContain('Unexpected error')

      process.env.NODE_ENV = originalEnv
    })

    it('sanitizes sensitive data in error details', async () => {
      const error = new ValidationError('Invalid input', {
        email: 'test@example.com',
        password: 'secret123',
      })
      const response = await handleApiError(error)

      const body = await response.json()
      expect(body.error.details.email).toBe('test@example.com')
      expect(body.error.details.password).toBe('[REDACTED]')
    })

    it('includes context in logs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()
      const error = new ValidationError('Invalid input')

      await handleApiError(error, {
        user_id: 'user123',
        agency_id: 'agency456',
        path: '/api/test',
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('createSuccessResponse', () => {
    it('returns success response with data', async () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual(data)
    })

    it('accepts custom status code', async () => {
      const data = { id: 1 }
      const response = createSuccessResponse(data, 201)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual(data)
    })
  })
})
