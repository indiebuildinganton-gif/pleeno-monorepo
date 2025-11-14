/**
 * PDF Styles
 *
 * Story 7.3: PDF Export Functionality
 * Task 6: Add Summary Totals Section
 *
 * Centralized styles for PDF components with professional formatting
 */

import { StyleSheet } from '@react-pdf/renderer'

export const pdfStyles = StyleSheet.create({
  // Page layout
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },

  // Header styles
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #2196f3',
    paddingBottom: 15,
  },

  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },

  metadata: {
    fontSize: 9,
    color: '#888',
    marginTop: 5,
  },

  // Filters section
  filtersSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    border: '1px solid #e0e0e0',
  },

  filtersTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },

  filterRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  filterLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#555',
    width: 120,
  },

  filterValue: {
    fontSize: 9,
    color: '#333',
    flex: 1,
  },

  // Table styles
  table: {
    width: '100%',
    marginTop: 10,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1976d2',
    borderBottom: '2px solid #1565c0',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },

  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'left',
    flex: 1,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },

  tableRowEven: {
    backgroundColor: '#f9f9f9',
  },

  tableCell: {
    fontSize: 8,
    color: '#333',
    textAlign: 'left',
    flex: 1,
  },

  tableCellNumber: {
    textAlign: 'right',
  },

  // Summary styles (Task 6 specific)
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    border: '1px solid #ddd',
  },

  separator: {
    height: 2,
    backgroundColor: '#2196f3',
    marginBottom: 15,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },

  summaryGrid: {
    display: 'flex',
    flexDirection: 'column',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '1px solid #e0e0e0',
  },

  summaryRowLast: {
    borderBottom: 'none',
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#555',
  },

  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },

  // Color coding for summary values
  earnedAmount: {
    color: '#4caf50', // Green for earned commission
  },

  outstandingAmount: {
    color: '#ff5722', // Red/orange for outstanding commission
  },

  // Page footer
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#888',
    borderTop: '1px solid #e0e0e0',
    paddingTop: 8,
  },
})
