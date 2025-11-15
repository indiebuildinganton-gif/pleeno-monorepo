/**
 * Shared PDF Styles
 *
 * Common style definitions for PDF reports using @react-pdf/renderer.
 * Provides consistent styling patterns across all PDF exports.
 *
 * @module pdf-styles
 */

import { StyleSheet } from '@react-pdf/renderer'

/**
 * Common color palette for PDF reports
 * Ensures consistent branding across all PDF documents
 */
export const PDFColors = {
  // Primary colors
  primary: '#2563eb', // Blue
  primaryDark: '#1e40af', // Dark blue
  primaryLight: '#dbeafe', // Light blue

  // Text colors
  textPrimary: '#1e293b', // Dark slate
  textSecondary: '#475569', // Medium slate
  textMuted: '#64748b', // Light slate

  // Background colors
  bgWhite: '#ffffff',
  bgLight: '#f8fafc',
  bgGray: '#f1f5f9',

  // Status colors
  success: '#16a34a', // Green
  successLight: '#dcfce7',
  successDark: '#166534',

  warning: '#eab308', // Yellow
  warningLight: '#fef3c7',
  warningDark: '#92400e',

  danger: '#dc2626', // Red
  dangerLight: '#fee2e2',
  dangerDark: '#991b1b',

  // Border colors
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
} as const

/**
 * Shared PDF styles for consistent report formatting
 *
 * Usage:
 * ```typescript
 * import { pdfStyles } from '@pleeno/utils/pdf-styles'
 *
 * const styles = StyleSheet.create({
 *   ...pdfStyles,
 *   // Add custom styles
 *   customStyle: {
 *     fontSize: 12,
 *   },
 * })
 * ```
 */
export const pdfStyles = {
  /**
   * Standard page layout
   */
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: PDFColors.bgWhite,
    color: PDFColors.textPrimary,
  },

  /**
   * Page header with border
   */
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20,
    borderBottom: `2pt solid ${PDFColors.primary}`,
    paddingBottom: 15,
  },

  /**
   * Header row (flexible layout)
   */
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },

  /**
   * Logo image in header
   */
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain' as const,
  },

  /**
   * Agency information in header
   */
  agencyInfo: {
    textAlign: 'right' as const,
    fontSize: 9,
    color: PDFColors.textSecondary,
  },

  /**
   * Agency name
   */
  agencyName: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: PDFColors.primary,
    marginBottom: 4,
  },

  /**
   * Document title
   */
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginTop: 15,
    marginBottom: 10,
    color: PDFColors.textPrimary,
  },

  /**
   * Document subtitle
   */
  subtitle: {
    fontSize: 10,
    textAlign: 'center' as const,
    marginBottom: 20,
    color: PDFColors.textMuted,
  },

  /**
   * Content section
   */
  section: {
    marginBottom: 20,
  },

  /**
   * Section title
   */
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    marginBottom: 10,
    color: PDFColors.textPrimary,
    backgroundColor: PDFColors.bgGray,
    padding: 8,
    borderRadius: 4,
  },

  /**
   * Table container
   */
  table: {
    marginTop: 10,
  },

  /**
   * Table header row
   */
  tableHeader: {
    flexDirection: 'row' as const,
    backgroundColor: PDFColors.bgGray,
    padding: 6,
    borderBottom: `1pt solid ${PDFColors.borderDark}`,
    fontWeight: 'bold' as const,
    fontSize: 9,
  },

  /**
   * Table data row
   */
  tableRow: {
    flexDirection: 'row' as const,
    padding: 6,
    borderBottom: `0.5pt solid ${PDFColors.border}`,
    fontSize: 9,
  },

  /**
   * Page footer
   */
  footer: {
    position: 'absolute' as const,
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center' as const,
    fontSize: 8,
    color: PDFColors.textMuted,
    borderTop: `1pt solid ${PDFColors.border}`,
    paddingTop: 10,
  },

  /**
   * Page number text
   */
  pageNumber: {
    marginTop: 5,
  },

  /**
   * Summary card
   */
  summaryCard: {
    backgroundColor: PDFColors.bgLight,
    border: `2pt solid ${PDFColors.primary}`,
    borderRadius: 6,
    padding: 15,
    marginTop: 20,
  },

  /**
   * Summary title
   */
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: PDFColors.textPrimary,
    marginBottom: 12,
    textAlign: 'center' as const,
  },

  /**
   * Summary row
   */
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: `0.5pt solid ${PDFColors.borderDark}`,
  },

  /**
   * Summary label
   */
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: PDFColors.textSecondary,
  },

  /**
   * Summary value
   */
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: PDFColors.textPrimary,
  },

  /**
   * Status badge base style
   */
  statusBadge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },

  /**
   * Success/Paid status
   */
  statusSuccess: {
    backgroundColor: PDFColors.successLight,
    color: PDFColors.successDark,
  },

  /**
   * Warning/Pending status
   */
  statusWarning: {
    backgroundColor: PDFColors.warningLight,
    color: PDFColors.warningDark,
  },

  /**
   * Danger/Overdue status
   */
  statusDanger: {
    backgroundColor: PDFColors.dangerLight,
    color: PDFColors.dangerDark,
  },
} as const

/**
 * Create a StyleSheet from shared PDF styles
 *
 * @example
 * ```typescript
 * import { createPDFStyleSheet, PDFColors } from '@pleeno/utils/pdf-styles'
 *
 * const styles = createPDFStyleSheet({
 *   customHeading: {
 *     fontSize: 16,
 *     color: PDFColors.primary,
 *   },
 * })
 * ```
 */
export function createPDFStyleSheet<T extends Record<string, any>>(
  customStyles?: T
): ReturnType<typeof StyleSheet.create<typeof pdfStyles & T>> {
  return StyleSheet.create({
    ...pdfStyles,
    ...customStyles,
  }) as any
}
