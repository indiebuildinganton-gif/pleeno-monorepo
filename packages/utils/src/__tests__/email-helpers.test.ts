import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { sendPaymentReminderEmail } from '../email-helpers'

// Mock the Resend module
vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn(),
      },
    })),
  }
})

// Mock the email template
vi.mock('../../../../emails/payment-reminder', () => ({
  default: vi.fn(() => 'mocked-email-component'),
}))

describe('Email Helpers - sendPaymentReminderEmail', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-api-key',
      RESEND_FROM_EMAIL: 'test@example.com',
    }

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('successful email sending', () => {
    it('sends payment reminder email with all required fields', async () => {
      // Mock Resend to return success
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-id-123' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'John Doe',
        amount: 1500.0,
        dueDate: 'January 15, 2025',
        paymentInstructions: 'Please transfer to account: 123-456-789',
        agencyName: 'Education Agency Inc',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('email-id-123')
      expect(result.error).toBeUndefined()
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('sends email with optional agency contact information', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-id-456' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Jane Smith',
        amount: 2000.0,
        dueDate: 'February 1, 2025',
        paymentInstructions: 'Pay via credit card online',
        agencyName: 'Global Education',
        agencyContactEmail: 'support@agency.com',
        agencyContactPhone: '+61 7 1234 5678',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('email-id-456')
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'student@example.com',
          subject: expect.stringContaining('$2000.00'),
          subject: expect.stringContaining('February 1, 2025'),
        })
      )
    })

    it('formats currency correctly in subject line', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-id-789' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1234.56,
        dueDate: 'March 10, 2025',
        paymentInstructions: 'Instructions here',
        agencyName: 'Test Agency',
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Payment Reminder: $1234.56 due on March 10, 2025',
        })
      )
    })

    it('uses default from email when RESEND_FROM_EMAIL not set', async () => {
      delete process.env.RESEND_FROM_EMAIL

      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-id-default' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1000.0,
        dueDate: 'April 1, 2025',
        paymentInstructions: 'Pay online',
        agencyName: 'Test Agency',
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Pleeno <noreply@pleeno.com>',
        })
      )
    })
  })

  describe('error handling', () => {
    it('returns error when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1500.0,
        dueDate: 'January 15, 2025',
        paymentInstructions: 'Payment instructions',
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('RESEND_API_KEY')
      expect(result.messageId).toBeUndefined()
    })

    it('handles Resend API error response', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid recipient email address' },
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'invalid-email',
        studentName: 'Test Student',
        amount: 1500.0,
        dueDate: 'January 15, 2025',
        paymentInstructions: 'Payment instructions',
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid recipient email address')
      expect(result.messageId).toBeUndefined()
    })

    it('handles missing message ID in successful response', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: {}, // No id field
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1500.0,
        dueDate: 'January 15, 2025',
        paymentInstructions: 'Payment instructions',
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('no ID returned')
      expect(result.messageId).toBeUndefined()
    })

    it('handles network errors gracefully', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('Network error: ECONNREFUSED'))

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1500.0,
        dueDate: 'January 15, 2025',
        paymentInstructions: 'Payment instructions',
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
      expect(result.messageId).toBeUndefined()
    })

    it('handles timeout errors', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('Request timeout'))

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1500.0,
        dueDate: 'January 15, 2025',
        paymentInstructions: 'Payment instructions',
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    })

    it('handles non-Error exceptions', async () => {
      const mockSend = vi.fn().mockRejectedValue('String error')

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1500.0,
        dueDate: 'January 15, 2025',
        paymentInstructions: 'Payment instructions',
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('handles very large payment amounts', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-large-amount' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Wealthy Student',
        amount: 999999.99,
        dueDate: 'December 31, 2025',
        paymentInstructions: 'Wire transfer',
        agencyName: 'Premium Agency',
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('$999999.99'),
        })
      )
    })

    it('handles decimal amounts correctly', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-decimal' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 100.5,
        dueDate: 'June 1, 2025',
        paymentInstructions: 'Pay online',
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('$100.50'),
        })
      )
    })

    it('handles long payment instructions', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-long-instructions' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const longInstructions = 'A'.repeat(1000) // 1000 character instruction

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1000.0,
        dueDate: 'July 1, 2025',
        paymentInstructions: longInstructions,
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(true)
    })

    it('handles special characters in student name', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-special-chars' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: "O'Neill-José María",
        amount: 1500.0,
        dueDate: 'August 1, 2025',
        paymentInstructions: 'Pay online',
        agencyName: 'Test Agency',
      })

      expect(result.success).toBe(true)
    })

    it('handles unicode characters in agency name', async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-unicode' },
        error: null,
      })

      const { Resend } = await import('resend')
      ;(Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const result = await sendPaymentReminderEmail({
        to: 'student@example.com',
        studentName: 'Test Student',
        amount: 1500.0,
        dueDate: 'September 1, 2025',
        paymentInstructions: 'Pay online',
        agencyName: '教育机构 Education 株式会社',
      })

      expect(result.success).toBe(true)
    })
  })
})
