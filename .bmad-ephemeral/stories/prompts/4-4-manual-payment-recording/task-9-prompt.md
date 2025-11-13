# Story 4-4: Manual Payment Recording - Task 9

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

**Previous Tasks**:
- Task 1 (Record Payment API) - Completed
- Task 2 (Mark as Paid UI Component) - Completed
- Task 3 (TanStack Query Mutation) - Completed
- Task 4 (Payment Plan Detail Page Updates) - Completed
- Task 5 (Dashboard Widget Updates) - Completed
- Task 6 (Partial Payment Display) - Completed
- Task 7 (Audit Logging) - Completed
- Task 8 (Commission Recalculation) - Completed

## Task 9: Testing

### Description
Comprehensive testing of the manual payment recording feature to ensure all acceptance criteria are met.

### Implementation Checklist

#### API Integration Tests
- [ ] Create `__tests__/integration/api/installments/record-payment.test.ts`
- [ ] Test successful payment recording (AC 1)
- [ ] Test paid_date validation - cannot be future date (AC 1)
- [ ] Test paid_amount validation - positive, non-zero, max 2 decimals (AC 1)
- [ ] Test paid_amount boundary - allow up to 110% of installment amount
- [ ] Test partial payment recording (AC 2)
- [ ] Test payment notes storage and retrieval (AC 3)
- [ ] Test payment plan status auto-update when all installments paid (AC 4)
- [ ] Test commission recalculation after payment (AC 5)
- [ ] Test RLS enforcement - user cannot record payment for other agency (AC 7)
- [ ] Test audit logging - verify logs are created
- [ ] Test error cases: 404 (not found), 400 (validation), 403 (wrong agency)

#### Component Tests
- [ ] Create `apps/payments/__tests__/components/MarkAsPaidModal.test.tsx`
- [ ] Test modal renders with correct installment data
- [ ] Test form validation (client-side)
- [ ] Test form submission
- [ ] Test cancel button closes modal
- [ ] Test character counter for notes field
- [ ] Test partial payment warning display
- [ ] Test accessibility (ARIA labels, keyboard navigation)

#### Hook Tests
- [ ] Create `apps/payments/__tests__/hooks/useRecordPayment.test.ts`
- [ ] Test optimistic update (AC 6)
- [ ] Test optimistic update revert on error (AC 6)
- [ ] Test query invalidation on success
- [ ] Test error handling
- [ ] Test loading states

#### E2E Tests
- [ ] Create `__tests__/e2e/payment-recording.spec.ts`
- [ ] Test complete flow: navigate to plan detail → mark as paid → verify status update
- [ ] Test partial payment flow: record partial → verify display → complete payment
- [ ] Test dashboard updates after payment recording
- [ ] Test commission tracking updates
- [ ] Test multiple payments on same plan
- [ ] Test payment plan completion (all installments paid)

### Acceptance Criteria Coverage
All ACs must be verified by tests:
- **AC 1**: Mark Installment as Paid
- **AC 2**: Partial Payment Support
- **AC 3**: Payment Notes
- **AC 4**: Payment Plan Status Auto-Update
- **AC 5**: Dashboard and Reports Reflect Updates
- **AC 6**: Optimistic UI Updates
- **AC 7**: Data Isolation

### Testing Standards
Use Vitest for unit tests, React Testing Library for component tests, and Playwright for E2E tests. Follow existing test patterns in `__tests__/` directory.

### Test File Locations
- `__tests__/integration/api/installments/record-payment.test.ts` (API integration tests)
- `apps/payments/__tests__/components/MarkAsPaidModal.test.tsx` (Component tests)
- `apps/payments/__tests__/hooks/useRecordPayment.test.ts` (Hook tests)
- `__tests__/e2e/payment-recording.spec.ts` (E2E tests)

### Example Test Cases

**API Integration Test**:
```typescript
describe('POST /api/installments/[id]/record-payment', () => {
  it('should record payment successfully', async () => {
    const response = await request(app)
      .post(`/api/installments/${installmentId}/record-payment`)
      .send({
        paid_date: '2025-01-15',
        paid_amount: 1000,
        notes: 'Payment received via bank transfer'
      })
      .expect(200)

    expect(response.body.installment.status).toBe('paid')
    expect(response.body.installment.paid_amount).toBe(1000)
  })

  it('should reject future paid_date', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)

    await request(app)
      .post(`/api/installments/${installmentId}/record-payment`)
      .send({
        paid_date: futureDate.toISOString().split('T')[0],
        paid_amount: 1000
      })
      .expect(400)
  })

  it('should handle partial payments', async () => {
    const response = await request(app)
      .post(`/api/installments/${installmentId}/record-payment`)
      .send({
        paid_date: '2025-01-15',
        paid_amount: 500, // Installment amount is 1000
        notes: 'Partial payment'
      })
      .expect(200)

    expect(response.body.installment.status).toBe('partial')
    expect(response.body.installment.paid_amount).toBe(500)
  })

  it('should enforce RLS - reject other agency installment', async () => {
    await request(app)
      .post(`/api/installments/${otherAgencyInstallmentId}/record-payment`)
      .send({
        paid_date: '2025-01-15',
        paid_amount: 1000
      })
      .expect(403)
  })
})
```

**Component Test**:
```typescript
describe('MarkAsPaidModal', () => {
  it('should display partial payment warning', async () => {
    render(
      <MarkAsPaidModal
        installment={{ id: '1', amount: 1000, status: 'pending' }}
        isOpen={true}
        onClose={() => {}}
      />
    )

    const amountInput = screen.getByLabelText('Amount Paid')
    await userEvent.clear(amountInput)
    await userEvent.type(amountInput, '500')

    expect(screen.getByText(/partial payment/i)).toBeInTheDocument()
    expect(screen.getByText(/500.*remaining/i)).toBeInTheDocument()
  })
})
```

**E2E Test**:
```typescript
test('complete payment recording flow', async ({ page }) => {
  await page.goto('/payments/plans/123')

  // Click "Mark as Paid" button for first pending installment
  await page.click('[data-testid="mark-paid-button-1"]')

  // Fill in payment details
  await page.fill('[name="paid_amount"]', '1000')
  await page.fill('[name="notes"]', 'Payment received')

  // Submit
  await page.click('[data-testid="submit-payment"]')

  // Verify optimistic update
  await expect(page.locator('[data-testid="installment-1-status"]')).toHaveText('paid')

  // Verify payment plan progress updated
  await expect(page.locator('[data-testid="payment-progress"]')).toContainText('1 of 4 installments paid')
})
```

---

## Manifest Update Instructions

**Before starting Task 9**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 8:
   ```markdown
   ### Task 8: Commission Recalculation
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 8 implementation]
   ```
3. Update Task 9:
   ```markdown
   ### Task 9: Testing
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes:
   ```

---

## Implementation Notes from Previous Tasks

All feature implementation is complete (Tasks 1-8). This task ensures everything works correctly through comprehensive testing.

**Testing Priority**:
1. API integration tests (most critical - validate business logic)
2. E2E tests (validate complete user flows)
3. Hook tests (validate optimistic updates)
4. Component tests (validate UI behavior)

---

## Next Steps

1. Update the manifest as described above
2. Implement Task 9 following the checklist
3. Run all tests and ensure they pass
4. Fix any issues discovered during testing
5. When Task 9 is complete:
   - Update manifest: Set Task 9 status to "Completed" with completion date
   - Add implementation notes
   - If Task 10 (optional) will be implemented, move to `task-10-prompt.md`
   - Otherwise, mark the story as complete in the manifest

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
