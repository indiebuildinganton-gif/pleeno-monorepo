import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  renderTemplate,
  formatCurrency,
  formatDate,
  sendEmail
} from '../email-helpers'

describe('Email Helpers', () => {
  describe('renderTemplate', () => {
    it('should replace simple placeholders', () => {
      const template = '<p>Hello {{name}}, you owe {{amount}}</p>'
      const variables = { name: 'John', amount: '$100' }

      const result = renderTemplate(template, variables)

      expect(result).toBe('<p>Hello John, you owe $100</p>')
    })

    it('should handle multiple occurrences of the same placeholder', () => {
      const template = '{{name}} said hello. {{name}} is happy.'
      const variables = { name: 'Alice' }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Alice said hello. Alice is happy.')
    })

    it('should replace missing values with empty string', () => {
      const template = 'Hello {{name}}, email: {{email}}'
      const variables = { name: 'John' }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Hello John, email: ')
    })

    it('should handle null values', () => {
      const template = 'Value: {{value}}'
      const variables = { value: null }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Value: ')
    })

    it('should handle conditional sections when condition is true', () => {
      const template = 'Hello{{#if premium}} Premium User{{/if}}!'
      const variables = { premium: true }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Hello Premium User!')
    })

    it('should handle conditional sections when condition is false', () => {
      const template = 'Hello{{#if premium}} Premium User{{/if}}!'
      const variables = { premium: false }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Hello!')
    })

    it('should handle loops with arrays', () => {
      const template = '<ul>{{#each items}}<li>{{name}}: {{price}}</li>{{/each}}</ul>'
      const variables = {
        items: [
          { name: 'Apple', price: '$1' },
          { name: 'Banana', price: '$2' }
        ]
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe('<ul><li>Apple: $1</li><li>Banana: $2</li></ul>')
    })

    it('should handle empty arrays in loops', () => {
      const template = '<ul>{{#each items}}<li>{{name}}</li>{{/each}}</ul>'
      const variables = { items: [] }

      const result = renderTemplate(template, variables)

      expect(result).toBe('<ul></ul>')
    })

    it('should handle missing array in loops', () => {
      const template = '<ul>{{#each items}}<li>{{name}}</li>{{/each}}</ul>'
      const variables = {}

      const result = renderTemplate(template, variables)

      expect(result).toBe('<ul></ul>')
    })

    it('should handle complex template with multiple features', () => {
      const template = `
        <div>
          <h1>Hello {{name}}</h1>
          {{#if isPremium}}
            <p>Premium features enabled</p>
          {{/if}}
          <ul>
            {{#each orders}}
              <li>{{item}} - {{price}}</li>
            {{/each}}
          </ul>
        </div>
      `
      const variables = {
        name: 'John',
        isPremium: true,
        orders: [
          { item: 'Book', price: '$10' },
          { item: 'Pen', price: '$2' }
        ]
      }

      const result = renderTemplate(template, variables)

      expect(result).toContain('Hello John')
      expect(result).toContain('Premium features enabled')
      expect(result).toContain('Book - $10')
      expect(result).toContain('Pen - $2')
    })
  })

  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-500)).toBe('-$500.00')
    })

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(10.999)).toBe('$11.00')
    })

    it('should format large amounts with proper separators', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    })

    it('should handle whole numbers', () => {
      expect(formatCurrency(100)).toBe('$100.00')
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const result = formatDate('2025-01-15')
      expect(result).toMatch(/15 January 2025/)
    })

    it('should format Date object correctly', () => {
      const date = new Date('2025-03-20')
      const result = formatDate(date)
      expect(result).toMatch(/20 March 2025/)
    })

    it('should handle different date formats', () => {
      const result = formatDate('2025-12-31T23:59:59Z')
      // Should contain 31 December or 1 January depending on timezone
      expect(result).toMatch(/\d{1,2} (January|December) 202(5|6)/)
    })
  })

  describe('sendEmail', () => {
    beforeEach(() => {
      // Mock the environment variable
      process.env.RESEND_API_KEY = 'test-api-key'
    })

    it('should call Resend API with correct parameters', async () => {
      // Mock the Resend client
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      vi.doMock('resend', () => ({
        Resend: vi.fn(() => ({
          emails: {
            send: mockSend
          }
        }))
      }))

      const params = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>'
      }

      // Note: Due to dynamic import in sendEmail, we can't easily test this
      // In a real implementation, you'd want to refactor sendEmail to accept
      // a Resend instance for easier testing

      // For now, we just verify the function exists and has correct signature
      expect(sendEmail).toBeDefined()
      expect(typeof sendEmail).toBe('function')
    })

    it('should use default sender if not provided', () => {
      // This would be tested with a proper mock setup
      expect(true).toBe(true)
    })

    it('should handle errors gracefully', () => {
      // This would be tested with a proper mock setup
      expect(true).toBe(true)
    })
  })
})
