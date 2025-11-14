/**
 * Student Payment Statement PDF Component
 *
 * Story 7.5: Student Payment History Report
 * Task 4: Create Professional PDF Template
 *
 * This component renders a professional payment statement PDF for students using @react-pdf/renderer.
 * It includes:
 * - Agency header with logo
 * - Student details
 * - Payment history grouped by payment plan
 * - Summary totals (paid, outstanding, percentage)
 * - Professional formatting and branding
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

// ============================================================
// TypeScript Interfaces
// ============================================================

interface Student {
  id: string
  full_name: string
  passport_number: string
  email: string
}

interface Installment {
  installment_id: string
  installment_number: number
  amount: number
  due_date: string
  paid_at: string | null
  paid_amount: number | null
  status: string
}

interface PaymentPlan {
  payment_plan_id: string
  college_name: string
  branch_name: string
  program_name: string
  plan_total_amount: number
  plan_start_date: string
  installments: Installment[]
}

interface Summary {
  total_paid: number
  total_outstanding: number
  percentage_paid: number
}

interface Agency {
  name: string
  logo_url?: string
  contact_email: string
  contact_phone: string
}

interface StudentPaymentStatementPDFProps {
  student: Student
  paymentHistory: PaymentPlan[]
  summary: Summary
  filters: {
    date_from: string
    date_to: string
  }
  agency: Agency
}

// ============================================================
// PDF Styles
// ============================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  agencyInfo: {
    textAlign: 'right',
    fontSize: 9,
  },
  agencyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 4,
  },
  studentInfoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    flex: 1,
    color: '#1e293b',
  },
  paymentPlanCard: {
    marginBottom: 20,
    border: '1 solid #e2e8f0',
    borderRadius: 4,
    padding: 12,
  },
  paymentPlanHeader: {
    backgroundColor: '#dbeafe',
    padding: 8,
    marginBottom: 10,
    borderRadius: 3,
  },
  paymentPlanTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  paymentPlanDetails: {
    fontSize: 9,
    color: '#475569',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderBottom: '1 solid #cbd5e1',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '0.5 solid #e2e8f0',
    fontSize: 9,
  },
  col1: {
    width: '10%',
  },
  col2: {
    width: '20%',
  },
  col3: {
    width: '20%',
  },
  col4: {
    width: '20%',
  },
  col5: {
    width: '30%',
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    border: '2 solid #2563eb',
    borderRadius: 6,
    padding: 15,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '0.5 solid #cbd5e1',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  summaryPaid: {
    color: '#16a34a',
  },
  summaryOutstanding: {
    color: '#dc2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  pageNumber: {
    marginTop: 5,
  },
  statusBadge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
})

// ============================================================
// Helper Functions
// ============================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getStatusStyle = (status: string): any => {
  switch (status.toLowerCase()) {
    case 'paid':
      return styles.statusPaid
    case 'pending':
      return styles.statusPending
    case 'overdue':
      return styles.statusOverdue
    default:
      return styles.statusPending
  }
}

// ============================================================
// PDF Component
// ============================================================

export const StudentPaymentStatementPDF: React.FC<
  StudentPaymentStatementPDFProps
> = ({ student, paymentHistory, summary, filters, agency }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {agency.logo_url ? (
              <Image src={agency.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.agencyName}>{agency.name}</Text>
            )}
            <View style={styles.agencyInfo}>
              <Text style={{ fontWeight: 'bold' }}>{agency.name}</Text>
              <Text>{agency.contact_email}</Text>
              <Text>{agency.contact_phone}</Text>
            </View>
          </View>
          <Text style={styles.title}>Payment Statement</Text>
          <Text style={styles.subtitle}>
            Period: {formatDate(filters.date_from)} - {formatDate(filters.date_to)}
          </Text>
        </View>

        {/* Student Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <View style={styles.studentInfoRow}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{student.full_name}</Text>
          </View>
          <View style={styles.studentInfoRow}>
            <Text style={styles.label}>Passport Number:</Text>
            <Text style={styles.value}>{student.passport_number}</Text>
          </View>
          <View style={styles.studentInfoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{student.email}</Text>
          </View>
          <View style={styles.studentInfoRow}>
            <Text style={styles.label}>Statement Date:</Text>
            <Text style={styles.value}>{formatDate(new Date().toISOString())}</Text>
          </View>
        </View>

        {/* Payment History by Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {paymentHistory.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>
              No payment history found for the selected period.
            </Text>
          ) : (
            paymentHistory.map((plan) => (
              <View key={plan.payment_plan_id} style={styles.paymentPlanCard}>
                <View style={styles.paymentPlanHeader}>
                  <Text style={styles.paymentPlanTitle}>
                    {plan.college_name} - {plan.branch_name}
                  </Text>
                  <Text style={styles.paymentPlanDetails}>
                    Program: {plan.program_name}
                  </Text>
                  <Text style={styles.paymentPlanDetails}>
                    Total Amount: {formatCurrency(plan.plan_total_amount)} | Start Date:{' '}
                    {formatDate(plan.plan_start_date)}
                  </Text>
                </View>

                {/* Installments Table */}
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.col1}>#</Text>
                    <Text style={styles.col2}>Due Date</Text>
                    <Text style={styles.col3}>Amount</Text>
                    <Text style={styles.col4}>Paid</Text>
                    <Text style={styles.col5}>Status</Text>
                  </View>
                  {plan.installments.map((inst) => (
                    <View key={inst.installment_id} style={styles.tableRow}>
                      <Text style={styles.col1}>{inst.installment_number}</Text>
                      <Text style={styles.col2}>{formatDate(inst.due_date)}</Text>
                      <Text style={styles.col3}>{formatCurrency(inst.amount)}</Text>
                      <Text style={styles.col4}>
                        {inst.paid_amount ? formatCurrency(inst.paid_amount) : '-'}
                      </Text>
                      <Text style={[styles.col5, getStatusStyle(inst.status)]}>
                        {inst.status.toUpperCase()}
                        {inst.paid_at && ` (${formatDate(inst.paid_at)})`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={[styles.summaryValue, styles.summaryPaid]}>
              {formatCurrency(summary.total_paid)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Outstanding:</Text>
            <Text style={[styles.summaryValue, styles.summaryOutstanding]}>
              {formatCurrency(summary.total_outstanding)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Progress:</Text>
            <Text style={styles.summaryValue}>
              {summary.percentage_paid.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is an official payment statement from {agency.name}
          </Text>
          <Text>For inquiries, contact: {agency.contact_email}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} of ${totalPages}`
          )} fixed />
        </View>
      </Page>
    </Document>
  )
}
