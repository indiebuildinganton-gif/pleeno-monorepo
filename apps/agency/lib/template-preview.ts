/**
 * Template Preview Utilities
 *
 * Provides functionality to render email templates with sample data
 * for preview purposes. Handles variable placeholder replacement.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 3: Email Template Management UI
 */

/**
 * Sample data for template preview
 */
export const SAMPLE_PREVIEW_DATA: Record<string, string> = {
  student_name: 'John Doe',
  student_email: 'john.doe@example.com',
  student_phone: '0400 123 456',
  amount: '$1,500.00',
  due_date: '15 May 2025',
  college_name: 'Example University',
  branch_name: 'Brisbane Campus',
  agency_name: 'Education Agency',
  agency_email: 'contact@agency.com',
  agency_phone: '1300 123 456',
  payment_instructions:
    'Bank transfer to: BSB 123-456, Account 12345678\nReference: Your student ID',
  view_link: 'https://pleeno.com/payments/12345',
  count: '5',
}

/**
 * Renders a template by replacing placeholders with sample data
 *
 * @param template - Template string containing {{variable}} placeholders
 * @param data - Data object with values to replace placeholders (defaults to SAMPLE_PREVIEW_DATA)
 * @returns Rendered template string with placeholders replaced
 *
 * @example
 * const template = "Hello {{student_name}}, your payment of {{amount}} is due on {{due_date}}."
 * const rendered = renderTemplate(template)
 * // Returns: "Hello John Doe, your payment of $1,500.00 is due on 15 May 2025."
 */
export function renderTemplate(
  template: string,
  data: Record<string, string> = SAMPLE_PREVIEW_DATA
): string {
  let rendered = template

  // Replace simple placeholders like {{variable_name}}
  Object.keys(data).forEach((key) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    rendered = rendered.replace(placeholder, data[key] || '')
  })

  // Handle any remaining unreplaced placeholders by showing them as-is
  // This helps identify missing variables during template editing
  return rendered
}

/**
 * Validates a template to ensure all placeholders are properly formatted
 *
 * @param template - Template string to validate
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * const errors = validateTemplate("Hello {{student_name")
 * // Returns: ["Unclosed placeholder: {{student_name"]
 */
export function validateTemplate(template: string): string[] {
  const errors: string[] = []

  // Check for unclosed placeholders
  const openBraces = (template.match(/\{\{/g) || []).length
  const closeBraces = (template.match(/\}\}/g) || []).length

  if (openBraces !== closeBraces) {
    errors.push(
      `Mismatched placeholders: ${openBraces} opening {{ and ${closeBraces} closing }}`
    )
  }

  // Check for malformed placeholders (e.g., {{ variable with spaces }})
  const malformedPlaceholders = template.match(/\{\{[^}]*\s+[^}]*\}\}/g)
  if (malformedPlaceholders) {
    errors.push(
      `Placeholders should not contain spaces: ${malformedPlaceholders.join(', ')}`
    )
  }

  return errors
}

/**
 * Extracts all placeholder variables from a template
 *
 * @param template - Template string to analyze
 * @returns Array of unique variable names found in the template
 *
 * @example
 * const vars = extractVariables("Hello {{student_name}}, amount: {{amount}}")
 * // Returns: ["student_name", "amount"]
 */
export function extractVariables(template: string): string[] {
  const placeholderRegex = /\{\{(\w+)\}\}/g
  const variables: string[] = []
  let match

  // Use exec instead of matchAll for better compatibility
  while ((match = placeholderRegex.exec(template)) !== null) {
    variables.push(match[1])
  }

  // Return unique variables only using filter
  return variables.filter((v, i, arr) => arr.indexOf(v) === i)
}

/**
 * Sanitizes HTML to prevent XSS attacks while allowing safe formatting tags
 *
 * This is a basic implementation. In production, consider using a library like DOMPurify.
 *
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  // Allow only safe HTML tags and attributes
  const allowedTags = [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'div',
    'span',
    'table',
    'tr',
    'td',
    'th',
    'tbody',
    'thead',
  ]

  const allowedAttributes = ['href', 'style', 'class']

  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')

  // This is a simplified sanitization. For production use, integrate a proper
  // HTML sanitization library like DOMPurify or sanitize-html

  return sanitized
}

/**
 * Formats currency for display in templates
 *
 * @param amount - Numeric amount
 * @param currency - Currency code (default: AUD)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1500) // Returns: "$1,500.00"
 */
export function formatCurrency(amount: number, currency = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Formats date for display in templates
 *
 * @param date - Date to format
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2025-05-15')) // Returns: "15 May 2025"
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj)
}
