/**
 * Payment Plan Test Fixtures and Helpers
 *
 * Reusable test data for payment plan wizard tests
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 13: Testing
 */

import { vi } from 'vitest'

export const createTestStudent = () => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  agency_id: 'agency-123',
  branch_id: 'branch-456',
  college_id: 'college-789',
  status: 'active' as const,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
})

export const createTestEnrollment = () => ({
  id: 'enrollment-123',
  student_id: '123e4567-e89b-12d3-a456-426614174000',
  college_id: 'college-789',
  branch_id: 'branch-456',
  course_name: 'Bachelor of Business',
  intake_date: '2025-02-01',
  status: 'enrolled' as const,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
})

export const createTestCollege = () => ({
  id: 'college-789',
  name: 'Brisbane Business School',
  default_commission_rate_percent: 15,
  country: 'Australia',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
})

export const createTestBranch = () => ({
  id: 'branch-456',
  college_id: 'college-789',
  name: 'Brisbane Campus',
  city: 'Brisbane',
  state: 'QLD',
  country: 'Australia',
  commission_rate_percent: 15,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
})

export const createTestPaymentPlanWizardData = (overrides = {}) => ({
  // Step 1 data
  student_id: '123e4567-e89b-12d3-a456-426614174000',
  course_name: 'Bachelor of Business',
  total_course_value: 10000,
  commission_rate: 0.15,
  course_start_date: '2025-02-01',
  course_end_date: '2025-12-31',

  // Step 2 data
  initial_payment_amount: 2000,
  initial_payment_due_date: '2025-02-01',
  initial_payment_paid: false,
  number_of_installments: 4,
  payment_frequency: 'quarterly' as const,
  materials_cost: 500,
  admin_fees: 200,
  other_fees: 100,
  first_college_due_date: '2025-03-15',
  student_lead_time_days: 7,
  gst_inclusive: true,

  ...overrides,
})

export const createTestInstallments = () => [
  {
    installment_number: 0,
    amount: 2000,
    student_due_date: '2025-02-01T00:00:00.000Z',
    college_due_date: '2025-02-08T00:00:00.000Z',
    is_initial_payment: true,
    generates_commission: true,
    status: 'draft' as const,
  },
  {
    installment_number: 1,
    amount: 2000,
    student_due_date: '2025-03-08T00:00:00.000Z',
    college_due_date: '2025-03-15T00:00:00.000Z',
    is_initial_payment: false,
    generates_commission: true,
    status: 'draft' as const,
  },
  {
    installment_number: 2,
    amount: 2000,
    student_due_date: '2025-06-08T00:00:00.000Z',
    college_due_date: '2025-06-15T00:00:00.000Z',
    is_initial_payment: false,
    generates_commission: true,
    status: 'draft' as const,
  },
  {
    installment_number: 3,
    amount: 2000,
    student_due_date: '2025-09-08T00:00:00.000Z',
    college_due_date: '2025-09-15T00:00:00.000Z',
    is_initial_payment: false,
    generates_commission: true,
    status: 'draft' as const,
  },
  {
    installment_number: 4,
    amount: 1200,
    student_due_date: '2025-12-08T00:00:00.000Z',
    college_due_date: '2025-12-15T00:00:00.000Z',
    is_initial_payment: false,
    generates_commission: true,
    status: 'draft' as const,
  },
]

export const createTestPaymentPlan = (overrides = {}) => ({
  id: 'plan-123',
  agency_id: 'agency-123',
  student_id: '123e4567-e89b-12d3-a456-426614174000',
  course_name: 'Bachelor of Business',
  total_amount: 10000,
  commission_rate: 0.15,
  commission_rate_percent: 15,
  expected_commission: 1350,
  commissionable_value: 9000,
  course_start_date: '2025-02-01',
  course_end_date: '2025-12-31',
  initial_payment_amount: 2000,
  initial_payment_due_date: '2025-02-01',
  initial_payment_paid: false,
  number_of_installments: 4,
  payment_frequency: 'quarterly' as const,
  materials_cost: 500,
  admin_fees: 200,
  other_fees: 100,
  first_college_due_date: '2025-03-15',
  student_lead_time_days: 7,
  gst_inclusive: true,
  status: 'active' as const,
  currency: 'AUD',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

export const createTestUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'admin@agency.com',
  app_metadata: {
    role: 'agency_admin',
    agency_id: 'agency-123',
  },
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-15T12:00:00Z',
  role: 'authenticated',
  updated_at: '2024-01-15T12:00:00Z',
  ...overrides,
})

/**
 * Helper to calculate expected commission values
 */
export const calculateExpectedValues = (data: {
  total_course_value: number
  materials_cost?: number
  admin_fees?: number
  other_fees?: number
  commission_rate: number
  gst_inclusive?: boolean
}) => {
  const {
    total_course_value,
    materials_cost = 0,
    admin_fees = 0,
    other_fees = 0,
    commission_rate,
    gst_inclusive = true
  } = data

  const commissionable_value = total_course_value - materials_cost - admin_fees - other_fees

  let expected_commission: number
  if (gst_inclusive) {
    expected_commission = commissionable_value * commission_rate
  } else {
    const base = commissionable_value / 1.1
    expected_commission = base * commission_rate
  }

  return {
    commissionable_value: Math.round(commissionable_value * 100) / 100,
    expected_commission: Math.round(expected_commission * 100) / 100,
  }
}

/**
 * Helper to create mock Supabase client for tests
 */
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockOrder = vi.fn()
  const mockRange = vi.fn()

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })

  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    range: mockRange,
  })

  mockInsert.mockReturnValue({
    select: mockSelect,
  })

  mockUpdate.mockReturnValue({
    eq: mockEq,
  })

  mockDelete.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    select: mockSelect,
  })

  mockSingle.mockResolvedValue({
    data: null,
    error: null,
  })

  mockOrder.mockReturnValue({
    range: mockRange,
  })

  mockRange.mockResolvedValue({
    data: [],
    error: null,
    count: 0,
  })

  return {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: createTestUser() },
        error: null,
      }),
    },
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockEq,
    mockSingle,
    mockOrder,
    mockRange,
  }
}

/**
 * Helper to wait for async state updates in React components
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * Helper to create form data for wizard steps
 */
export const createWizardFormData = () => {
  const step1Data = {
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    course_name: 'Bachelor of Business',
    total_course_value: 10000,
    commission_rate: 0.15,
    course_start_date: '2025-02-01',
    course_end_date: '2025-12-31',
  }

  const step2Data = {
    initial_payment_amount: 2000,
    initial_payment_due_date: '2025-02-01',
    initial_payment_paid: false,
    number_of_installments: 4,
    payment_frequency: 'quarterly' as const,
    materials_cost: 500,
    admin_fees: 200,
    other_fees: 100,
    first_college_due_date: '2025-03-15',
    student_lead_time_days: 7,
    gst_inclusive: true,
  }

  return {
    step1: step1Data,
    step2: step2Data,
    complete: { ...step1Data, ...step2Data },
  }
}
