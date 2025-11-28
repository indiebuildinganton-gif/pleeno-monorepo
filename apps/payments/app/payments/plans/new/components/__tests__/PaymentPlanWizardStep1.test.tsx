/**
 * PaymentPlanWizardStep1 Component Tests
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 13: Testing - Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentPlanWizardStep1 } from '../PaymentPlanWizardStep1'

// Mock hooks
vi.mock('@/hooks/useStudents', () => ({
  useStudents: vi.fn(() => ({
    data: {
      data: [
        {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        {
          id: 'student-2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
      ],
      total: 2,
    },
    isLoading: false,
    error: null,
  })),
}))

// Mock child components
vi.mock('../StudentSelect', () => ({
  StudentSelect: ({
    value,
    onChange,
    error,
  }: {
    value: string
    onChange: (id: string) => void
    error?: string
  }) => (
    <div>
      <label htmlFor="student-select">Student</label>
      <select
        id="student-select"
        data-testid="student-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select student</option>
        <option value="student-1">John Doe</option>
        <option value="student-2">Jane Smith</option>
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}))

vi.mock('../CollegeBranchSelect', () => ({
  CollegeBranchSelect: ({
    branchId,
    onBranchChange,
    error,
  }: {
    branchId: string
    onBranchChange: (branchId: string, commissionRate: number) => void
    error?: string
  }) => (
    <div>
      <label htmlFor="branch-select">Branch</label>
      <select
        id="branch-select"
        data-testid="branch-select"
        value={branchId}
        onChange={(e) => onBranchChange(e.target.value, 15)} // Mock 15% commission
      >
        <option value="">Select branch</option>
        <option value="branch-1">Brisbane Campus</option>
        <option value="branch-2">Sydney Campus</option>
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}))

describe('PaymentPlanWizardStep1', () => {
  const mockOnNext = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('renders all required form fields', () => {
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      expect(screen.getByTestId('student-select')).toBeInTheDocument()
      expect(screen.getByTestId('branch-select')).toBeInTheDocument()
      expect(screen.getByLabelText(/Course Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Total Course Value/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Commission Rate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Course Start Date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Course End Date/i)).toBeInTheDocument()
    })

    it('renders step title and description', () => {
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      expect(screen.getByText('Step 1: General Information')).toBeInTheDocument()
      expect(screen.getByText(/Select the student and provide course details/i)).toBeInTheDocument()
    })

    it('renders navigation buttons', () => {
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Next: Configure Installments/i })).toBeInTheDocument()
    })

    it('disables Next button initially when form is invalid', () => {
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const nextButton = screen.getByRole('button', { name: /Next: Configure Installments/i })
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('shows error when student is not selected', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      // Fill all fields except student
      await user.type(screen.getByLabelText(/Course Name/i), 'Bachelor of Business')
      await user.type(screen.getByLabelText(/Total Course Value/i), '10000')
      await user.type(screen.getByLabelText(/Commission Rate/i), '0.15')

      const nextButton = screen.getByRole('button', { name: /Next: Configure Installments/i })
      expect(nextButton).toBeDisabled()
    })

    it('shows error when commission rate is less than 0', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const commissionInput = screen.getByLabelText(/Commission Rate/i)
      await user.clear(commissionInput)
      await user.type(commissionInput, '-0.1')

      await waitFor(() => {
        expect(screen.getByText(/Must be between 0 and 1/i)).toBeInTheDocument()
      })
    })

    it('shows error when commission rate is greater than 1', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext=  {mockOnNext} onCancel={mockOnCancel} />)

      const commissionInput = screen.getByLabelText(/Commission Rate/i)
      await user.clear(commissionInput)
      await user.type(commissionInput, '1.5')

      await waitFor(() => {
        expect(screen.getByText(/Must be between 0 and 1/i)).toBeInTheDocument()
      })
    })

    it('shows error when end date is before start date', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const startDateInput = screen.getByLabelText(/Course Start Date/i)
      const endDateInput = screen.getByLabelText(/Course End Date/i)

      await user.clear(startDateInput)
      await user.type(startDateInput, '2025-12-31')

      await user.clear(endDateInput)
      await user.type(endDateInput, '2025-01-01')

      await waitFor(() => {
        expect(screen.getByText(/End date must be after start date/i)).toBeInTheDocument()
      })
    })

    it('shows error when course name is empty', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const courseNameInput = screen.getByLabelText(/Course Name/i)
      await user.click(courseNameInput)
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/Course name is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when total course value is not positive', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const valueInput = screen.getByLabelText(/Total Course Value/i)
      await user.clear(valueInput)
      await user.type(valueInput, '0')

      await waitFor(() => {
        expect(screen.getByText(/Must be a positive amount/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Interactions', () => {
    it('auto-populates commission rate when branch is selected', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const branchSelect = screen.getByTestId('branch-select')
      await user.selectOptions(branchSelect, 'branch-1')

      // Wait for commission rate to be populated (0.15 = 15%)
      await waitFor(() => {
        const commissionInput = screen.getByLabelText(/Commission Rate/i) as HTMLInputElement
        expect(commissionInput.value).toBe('0.15')
      })
    })

    it('displays commission percentage when rate is entered', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const commissionInput = screen.getByLabelText(/Commission Rate/i)
      await user.clear(commissionInput)
      await user.type(commissionInput, '0.15')

      await waitFor(() => {
        expect(screen.getByText(/Currently: 15.0%/i)).toBeInTheDocument()
      })
    })

    it('updates percentage display when commission rate changes', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const commissionInput = screen.getByLabelText(/Commission Rate/i)
      await user.clear(commissionInput)
      await user.type(commissionInput, '0.2')

      await waitFor(() => {
        expect(screen.getByText(/Currently: 20.0%/i)).toBeInTheDocument()
      })

      await user.clear(commissionInput)
      await user.type(commissionInput, '0.1')

      await waitFor(() => {
        expect(screen.getByText(/Currently: 10.0%/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls onNext with form data when valid form is submitted', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      // Fill all required fields
      await user.selectOptions(screen.getByTestId('student-select'), 'student-1')
      await user.selectOptions(screen.getByTestId('branch-select'), 'branch-1')
      await user.type(screen.getByLabelText(/Course Name/i), 'Bachelor of Business')
      await user.clear(screen.getByLabelText(/Total Course Value/i))
      await user.type(screen.getByLabelText(/Total Course Value/i), '10000')

      // Commission rate should be auto-filled from branch selection (0.15)
      const startDateInput = screen.getByLabelText(/Course Start Date/i)
      await user.clear(startDateInput)
      await user.type(startDateInput, '2025-02-01')

      const endDateInput = screen.getByLabelText(/Course End Date/i)
      await user.clear(endDateInput)
      await user.type(endDateInput, '2025-12-31')

      // Wait for form to become valid
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next: Configure Installments/i })
        expect(nextButton).not.toBeDisabled()
      })

      const nextButton = screen.getByRole('button', { name: /Next: Configure Installments/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalledWith({
          student_id: 'student-1',
          branch_id: 'branch-1',
          course_name: 'Bachelor of Business',
          total_course_value: 10000,
          commission_rate: 0.15,
          course_start_date: '2025-02-01',
          course_end_date: '2025-12-31',
        })
      })
    })

    it('does not call onNext when form is invalid', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      // Try to submit with empty form
      const nextButton = screen.getByRole('button', { name: /Next: Configure Installments/i })
      expect(nextButton).toBeDisabled()

      // onNext should not be called
      expect(mockOnNext).not.toHaveBeenCalled()
    })

    it('calls onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Initial Data', () => {
    it('pre-fills form with initial data when provided', () => {
      const initialData = {
        student_id: 'student-1',
        branch_id: 'branch-1',
        course_name: 'Bachelor of Business',
        total_course_value: 10000,
        commission_rate: 0.15,
        course_start_date: '2025-02-01',
        course_end_date: '2025-12-31',
      }

      render(
        <PaymentPlanWizardStep1
          initialData={initialData}
          onNext={mockOnNext}
          onCancel={mockOnCancel}
        />
      )

      expect((screen.getByTestId('student-select') as HTMLSelectElement).value).toBe('student-1')
      expect((screen.getByTestId('branch-select') as HTMLSelectElement).value).toBe('branch-1')
      expect((screen.getByLabelText(/Course Name/i) as HTMLInputElement).value).toBe(
        'Bachelor of Business'
      )
      expect((screen.getByLabelText(/Total Course Value/i) as HTMLInputElement).value).toBe('10000')
      expect((screen.getByLabelText(/Commission Rate/i) as HTMLInputElement).value).toBe('0.15')
      expect((screen.getByLabelText(/Course Start Date/i) as HTMLInputElement).value).toBe(
        '2025-02-01'
      )
      expect((screen.getByLabelText(/Course End Date/i) as HTMLInputElement).value).toBe(
        '2025-12-31'
      )
    })

    it('enables Next button when initial data is valid', async () => {
      const validData = {
        student_id: 'student-1',
        branch_id: 'branch-1',
        course_name: 'Bachelor of Business',
        total_course_value: 10000,
        commission_rate: 0.15,
        course_start_date: '2025-02-01',
        course_end_date: '2025-12-31',
      }

      render(
        <PaymentPlanWizardStep1 initialData={validData} onNext={mockOnNext} onCancel={mockOnCancel} />
      )

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next: Configure Installments/i })
        expect(nextButton).not.toBeDisabled()
      })
    })
  })

  describe('Helper Text', () => {
    it('displays commission rate helper text', () => {
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      expect(
        screen.getByText(/Enter as decimal: 0.1 = 10%, 0.15 = 15%, 0.3 = 30%/i)
      ).toBeInTheDocument()
    })

    it('shows current percentage in commission helper text when rate is entered', async () => {
      const user = userEvent.setup()
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      const commissionInput = screen.getByLabelText(/Commission Rate/i)
      await user.clear(commissionInput)
      await user.type(commissionInput, '0.15')

      await waitFor(() => {
        expect(screen.getByText(/Currently: 15.0%/i)).toBeInTheDocument()
      })
    })
  })

  describe('Section Headers', () => {
    it('renders Student & College section header', () => {
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      expect(screen.getByText('Student & College')).toBeInTheDocument()
    })

    it('renders Course Details section header', () => {
      render(<PaymentPlanWizardStep1 onNext={mockOnNext} onCancel={mockOnCancel} />)

      expect(screen.getByText('Course Details')).toBeInTheDocument()
    })
  })
})
