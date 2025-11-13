/**
 * ReportResultsTable Demo Component
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 4: Create Report Results Table Component
 *
 * Demo component to visually test the table with various contract expiration scenarios
 */

'use client'

import { useState } from 'react'
import { ReportResultsTable } from '../ReportResultsTable'
import type {
  PaymentPlanReportRow,
  PaginationMetadata,
  ReportSummary,
} from '../../types/payment-plans-report'

// Mock data with various expiration scenarios
const generateMockData = (page: number, pageSize: number): PaymentPlanReportRow[] => {
  const allData: PaymentPlanReportRow[] = [
    // Expired contract (RED highlighting)
    {
      id: '1',
      reference_number: 'PP-001',
      student_id: 's1',
      student_name: 'Bob Wilson (EXPIRED)',
      college_id: 'c1',
      college_name: 'State University',
      branch_id: 'b1',
      branch_name: 'Main Campus',
      program_name: 'Engineering',
      plan_amount: 60000,
      currency: 'USD',
      commission_rate_percent: 12,
      expected_commission: 7200,
      total_paid: 30000,
      total_remaining: 30000,
      earned_commission: 3600,
      status: 'active',
      contract_expiration_date: '2025-10-01',
      days_until_contract_expiration: -43,
      contract_status: 'expired',
      start_date: '2024-01-01',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-10-01T00:00:00Z',
    },
    // Expires in 3 days (ORANGE highlighting)
    {
      id: '2',
      reference_number: 'PP-002',
      student_id: 's2',
      student_name: 'Jane Smith (3 days)',
      college_id: 'c2',
      college_name: 'Tech College',
      branch_id: null,
      branch_name: null,
      program_name: 'Computer Science',
      plan_amount: 45000,
      currency: 'USD',
      commission_rate_percent: 10,
      expected_commission: 4500,
      total_paid: 22500,
      total_remaining: 22500,
      earned_commission: 2250,
      status: 'active',
      contract_expiration_date: '2025-11-16',
      days_until_contract_expiration: 3,
      contract_status: 'expiring_soon',
      start_date: '2024-02-01',
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-09-01T00:00:00Z',
    },
    // Expires in 6 days (ORANGE highlighting)
    {
      id: '3',
      reference_number: 'PP-003',
      student_id: 's3',
      student_name: 'Mike Johnson (6 days)',
      college_id: 'c1',
      college_name: 'State University',
      branch_id: 'b2',
      branch_name: 'East Campus',
      program_name: 'Business',
      plan_amount: 40000,
      currency: 'USD',
      commission_rate_percent: 8,
      expected_commission: 3200,
      total_paid: 40000,
      total_remaining: 0,
      earned_commission: 3200,
      status: 'completed',
      contract_expiration_date: '2025-11-19',
      days_until_contract_expiration: 6,
      contract_status: 'expiring_soon',
      start_date: '2023-11-01',
      created_at: '2023-11-01T00:00:00Z',
      updated_at: '2024-08-01T00:00:00Z',
    },
    // Expires in 15 days (YELLOW highlighting)
    {
      id: '4',
      reference_number: 'PP-004',
      student_id: 's4',
      student_name: 'Sarah Davis (15 days)',
      college_id: 'c3',
      college_name: 'Community College',
      branch_id: 'b3',
      branch_name: 'West Campus',
      program_name: 'Nursing',
      plan_amount: 55000,
      currency: 'USD',
      commission_rate_percent: 11,
      expected_commission: 6050,
      total_paid: 45000,
      total_remaining: 10000,
      earned_commission: 4950,
      status: 'active',
      contract_expiration_date: '2025-11-28',
      days_until_contract_expiration: 15,
      contract_status: 'expiring_soon',
      start_date: '2024-03-01',
      created_at: '2024-03-01T00:00:00Z',
      updated_at: '2024-10-01T00:00:00Z',
    },
    // Expires in 25 days (YELLOW highlighting)
    {
      id: '5',
      reference_number: 'PP-005',
      student_id: 's5',
      student_name: 'Tom Anderson (25 days)',
      college_id: 'c2',
      college_name: 'Tech College',
      branch_id: null,
      branch_name: null,
      program_name: 'Data Science',
      plan_amount: 70000,
      currency: 'USD',
      commission_rate_percent: 15,
      expected_commission: 10500,
      total_paid: 50000,
      total_remaining: 20000,
      earned_commission: 7500,
      status: 'active',
      contract_expiration_date: '2025-12-08',
      days_until_contract_expiration: 25,
      contract_status: 'expiring_soon',
      start_date: '2024-04-01',
      created_at: '2024-04-01T00:00:00Z',
      updated_at: '2024-11-01T00:00:00Z',
    },
    // Active - 60 days (NO highlighting)
    {
      id: '6',
      reference_number: 'PP-006',
      student_id: 's6',
      student_name: 'Emily Brown (Active)',
      college_id: 'c1',
      college_name: 'State University',
      branch_id: 'b1',
      branch_name: 'Main Campus',
      program_name: 'Medicine',
      plan_amount: 90000,
      currency: 'USD',
      commission_rate_percent: 18,
      expected_commission: 16200,
      total_paid: 60000,
      total_remaining: 30000,
      earned_commission: 10800,
      status: 'active',
      contract_expiration_date: '2026-01-12',
      days_until_contract_expiration: 60,
      contract_status: 'active',
      start_date: '2024-05-01',
      created_at: '2024-05-01T00:00:00Z',
      updated_at: '2024-11-01T00:00:00Z',
    },
    // Cancelled with no expiration
    {
      id: '7',
      reference_number: 'PP-007',
      student_id: 's7',
      student_name: 'David Lee (Cancelled)',
      college_id: 'c3',
      college_name: 'Community College',
      branch_id: 'b2',
      branch_name: 'East Campus',
      program_name: 'Arts',
      plan_amount: 35000,
      currency: 'USD',
      commission_rate_percent: 7,
      expected_commission: 2450,
      total_paid: 5000,
      total_remaining: 30000,
      earned_commission: 350,
      status: 'cancelled',
      contract_expiration_date: null,
      days_until_contract_expiration: null,
      contract_status: null,
      start_date: '2024-06-01',
      created_at: '2024-06-01T00:00:00Z',
      updated_at: '2024-07-01T00:00:00Z',
    },
  ]

  const start = (page - 1) * pageSize
  const end = start + pageSize
  return allData.slice(start, end)
}

export function ReportResultsTableDemo() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  const data = generateMockData(page, pageSize)

  const pagination: PaginationMetadata = {
    page,
    page_size: pageSize,
    total_count: 7,
    total_pages: Math.ceil(7 / pageSize),
  }

  const summary: ReportSummary = {
    total_plan_amount: 395000,
    total_paid_amount: 252500,
    total_commission: 32650,
  }

  const handlePageChange = (newPage: number) => {
    setIsLoading(true)
    setPage(newPage)
    // Simulate network delay
    setTimeout(() => setIsLoading(false), 500)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setIsLoading(true)
    setPageSize(newPageSize)
    setPage(1) // Reset to first page
    setTimeout(() => setIsLoading(false), 500)
  }

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    console.log('Sort:', column, direction)
    // In a real app, this would trigger a server request
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payment Plans Report - Demo</h1>
        <p className="text-muted-foreground">
          Story 7.1 - Task 4: ReportResultsTable Component Testing
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:bg-blue-950">
        <h2 className="font-semibold mb-2">Contract Expiration Highlighting Legend:</h2>
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-l-4 border-l-red-500"></div>
            <span><strong>Red:</strong> Contract expired (negative days)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border-l-4 border-l-orange-500"></div>
            <span><strong>Orange:</strong> Expires within 7 days (critical)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border-l-4 border-l-yellow-500"></div>
            <span><strong>Yellow:</strong> Expires within 30 days (warning)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border"></div>
            <span><strong>No highlight:</strong> Active (30+ days remaining)</span>
          </li>
        </ul>
      </div>

      <ReportResultsTable
        data={data}
        pagination={pagination}
        summary={summary}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        isLoading={isLoading}
      />

      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:bg-green-950">
        <h2 className="font-semibold mb-2">Test Coverage:</h2>
        <ul className="space-y-1 text-sm list-disc list-inside">
          <li>✅ TanStack Table with sortable columns (click column headers)</li>
          <li>✅ Server-side pagination with page size selector</li>
          <li>✅ Contract expiration badges (red/orange/yellow/outline)</li>
          <li>✅ Row highlighting based on expiration urgency</li>
          <li>✅ Summary totals footer (sticky, bold)</li>
          <li>✅ Currency formatting with formatCurrency()</li>
          <li>✅ Date formatting with date-fns format()</li>
          <li>✅ Status badges (Active/Completed/Cancelled)</li>
          <li>✅ Loading state (skeleton rows)</li>
          <li>✅ Empty state message</li>
        </ul>
      </div>
    </div>
  )
}
