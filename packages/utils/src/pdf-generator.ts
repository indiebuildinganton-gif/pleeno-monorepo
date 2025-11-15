/**
 * PDF Generator Utilities
 *
 * Shared utilities for PDF generation across the application.
 * Provides consistent PDF generation patterns for reports and exports.
 *
 * @module pdf-generator
 */

import { renderToStream } from '@react-pdf/renderer'
import { ReactElement } from 'react'

/**
 * Generate PDF from React component
 *
 * Renders a React component to a PDF stream using @react-pdf/renderer.
 * The stream can be returned directly in a Next.js API response.
 *
 * @param component - React component to render as PDF (must be a @react-pdf/renderer Document)
 * @returns ReadableStream of PDF data
 *
 * @example
 * ```typescript
 * import { generatePDF } from '@pleeno/utils/pdf-generator'
 * import { MyPDFDocument } from './MyPDFDocument'
 *
 * const pdfStream = await generatePDF(<MyPDFDocument data={data} />)
 *
 * return new NextResponse(pdfStream as any, {
 *   status: 200,
 *   headers: {
 *     'Content-Type': 'application/pdf',
 *     'Content-Disposition': 'attachment; filename="document.pdf"',
 *   },
 * })
 * ```
 *
 * @throws Error if PDF generation fails
 */
export async function generatePDF(component: ReactElement): Promise<ReadableStream> {
  try {
    const stream = await renderToStream(component)
    return stream as ReadableStream
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('Failed to generate PDF')
  }
}

/**
 * Fetch agency logo from Supabase storage or URL
 *
 * Converts logo to data URL for embedding in PDF documents.
 * Handles multiple input formats:
 * - Data URLs (returned as-is)
 * - HTTP/HTTPS URLs (fetched and converted)
 * - Supabase storage paths (fetched and converted)
 *
 * @param logoUrl - URL or path to agency logo
 * @returns Data URL for logo image, or null if unavailable
 *
 * @example
 * ```typescript
 * const logoDataUrl = await fetchAgencyLogo(agency.logo_url)
 *
 * // Use in PDF component
 * {logoDataUrl && <Image src={logoDataUrl} style={styles.logo} />}
 * ```
 *
 * @remarks
 * - Returns null if logoUrl is null/undefined
 * - Logs warnings for fetch failures but doesn't throw
 * - Converts fetched images to base64 data URLs
 */
export async function fetchAgencyLogo(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null

  try {
    // If already a data URL or full URL, return as-is
    if (logoUrl.startsWith('data:') || logoUrl.startsWith('http')) {
      return logoUrl
    }

    // Otherwise, fetch from Supabase storage
    // This example assumes logoUrl is a Supabase storage path
    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.warn('Failed to fetch agency logo:', response.statusText)
      return null
    }

    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error fetching agency logo:', error)
    return null
  }
}

/**
 * Sanitize filename for safe file downloads
 *
 * Removes special characters and normalizes spaces for filesystem safety.
 * Useful for generating filenames from user-provided data (e.g., student names).
 *
 * @param name - Original filename or string
 * @returns Sanitized filename (lowercase, alphanumeric + hyphens + underscores)
 *
 * @example
 * ```typescript
 * sanitizeFilename('John Doe (Student)')
 * // Returns: "john_doe_student"
 *
 * sanitizeFilename('María José García')
 * // Returns: "mara_jos_garca"
 * ```
 *
 * @remarks
 * - Removes all special characters except alphanumeric, spaces, and hyphens
 * - Replaces spaces with underscores
 * - Converts to lowercase
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
}

/**
 * Generate timestamp-based filename for exports
 *
 * Creates consistent filenames with ISO date suffix for exported documents.
 * Automatically sanitizes suffix to ensure filesystem safety.
 *
 * @param prefix - Filename prefix (e.g., "payment_statement", "commission_report")
 * @param suffix - Optional additional suffix (e.g., student name, college name)
 * @returns Formatted filename with timestamp: `{prefix}_{suffix}_{YYYY-MM-DD}.pdf`
 *
 * @example
 * ```typescript
 * generateTimestampedFilename('payment_statement', 'John Doe')
 * // Returns: "payment_statement_john_doe_2025-11-15.pdf"
 *
 * generateTimestampedFilename('commission_report')
 * // Returns: "commission_report_2025-11-15.pdf"
 *
 * generateTimestampedFilename('invoice', 'María José García')
 * // Returns: "invoice_mara_jos_garca_2025-11-15.pdf"
 * ```
 *
 * @remarks
 * - Timestamp format: YYYY-MM-DD (ISO 8601 date)
 * - Suffix is automatically sanitized using sanitizeFilename()
 * - Extension is always `.pdf`
 */
export function generateTimestampedFilename(
  prefix: string,
  suffix?: string
): string {
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const sanitizedSuffix = suffix ? `_${sanitizeFilename(suffix)}` : ''
  return `${prefix}${sanitizedSuffix}_${timestamp}.pdf`
}
