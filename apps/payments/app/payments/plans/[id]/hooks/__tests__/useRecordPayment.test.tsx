/**
 * useRecordPayment Hook Tests
 *
 * Tests for the TanStack Query mutation hook for recording payments
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 9: Testing - Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRecordPayment } from '../useRecordPayment'
import type { ReactNode } from 'react'

// Mock fetch
global.fetch = vi.fn()

// Mock toast
const mockAddToast = vi.fn()
vi.mock('@pleeno/ui', async () => {
  const actual = await vi.importActual('@pleeno/ui')
  return {
    ...actual,
    useToast: () => ({
      addToast: mockAddToast,
    }),
  }
})

describe('useRecordPayment', () => {
  let queryClient: QueryClient

  // Create a wrapper with QueryClientProvider
  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Successful Payment Recording', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          installment: {
            id: 'installment-123',
            payment_plan_id: 'plan-123',
            installment_number: 1,
            amount: 1000,
            paid_date: '2025-01-15',
            paid_amount: 1000,
            status: 'paid',
            payment_notes: 'Payment received',
          },
          payment_plan: {
            id: 'plan-123',
            status: 'active',
            earned_commission: 150,
          },
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
        notes: 'Payment received',
      })

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

      expect(fetch).toHaveBeenCalledWith(
        '/api/installments/installment-123/record-payment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paid_date: '2025-01-15',
            paid_amount: 1000,
            notes: 'Payment received',
          }),
        }
      )
    })

    it('should show success toast on successful payment', async () => {
      const mockResponse = {
        success: true,
        data: {
          installment: {
            id: 'installment-123',
            payment_plan_id: 'plan-123',
            installment_number: 1,
            amount: 1000,
            paid_date: '2025-01-15',
            paid_amount: 1000,
            status: 'paid',
            payment_notes: 'Payment received',
          },
          payment_plan: {
            id: 'plan-123',
            status: 'active',
            earned_commission: 150,
          },
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
        notes: 'Payment received',
      })

      await waitFor(() => expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Payment recorded successfully',
          description: 'Installment #1 has been marked as paid.',
          variant: 'success',
        })
      ))
    })

    it('should invalidate relevant queries on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          installment: {
            id: 'installment-123',
            payment_plan_id: 'plan-123',
            installment_number: 1,
            amount: 1000,
            paid_date: '2025-01-15',
            paid_amount: 1000,
            status: 'paid',
            payment_notes: null,
          },
          payment_plan: {
            id: 'plan-123',
            status: 'active',
            earned_commission: 150,
          },
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Verify all queries are invalidated
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['payment-plans', 'plan-123'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['payment-plans'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'payment-status'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['payment-status-summary'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['overdue-payments'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['commission-breakdown'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['cash-flow-projection'] })
    })
  })

  describe('Optimistic Updates', () => {
    it('should optimistically update installment status to paid', async () => {
      const mockPaymentPlan = {
        data: {
          id: 'plan-123',
          total_amount: 10000,
          expected_commission: 1500,
          status: 'active',
          earned_commission: 0,
          installments: [
            {
              id: 'installment-123',
              amount: 1000,
              status: 'pending',
              paid_date: null,
              paid_amount: null,
              payment_notes: null,
            },
            {
              id: 'installment-124',
              amount: 1000,
              status: 'pending',
              paid_date: null,
              paid_amount: null,
              payment_notes: null,
            },
          ],
        },
      }

      // Set initial query data
      queryClient.setQueryData(['payment-plans', 'plan-123'], mockPaymentPlan)

      // Mock a delayed response
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    data: {
                      installment: {
                        id: 'installment-123',
                        payment_plan_id: 'plan-123',
                        installment_number: 1,
                        amount: 1000,
                        paid_date: '2025-01-15',
                        paid_amount: 1000,
                        status: 'paid',
                        payment_notes: 'Test',
                      },
                      payment_plan: {
                        id: 'plan-123',
                        status: 'active',
                        earned_commission: 150,
                      },
                    },
                  }),
                } as Response),
              100
            )
          )
      )

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
        notes: 'Test',
      })

      // Check optimistic update (before API response)
      await waitFor(() => {
        const data: any = queryClient.getQueryData(['payment-plans', 'plan-123'])
        const installment = data?.data?.installments?.find((i: any) => i.id === 'installment-123')
        expect(installment?.status).toBe('paid')
        expect(installment?.paid_amount).toBe(1000)
        expect(installment?.paid_date).toBe('2025-01-15')
      })
    })

    it('should optimistically update installment status to partial for partial payments', async () => {
      const mockPaymentPlan = {
        data: {
          id: 'plan-123',
          total_amount: 10000,
          expected_commission: 1500,
          status: 'active',
          earned_commission: 0,
          installments: [
            {
              id: 'installment-123',
              amount: 1000,
              status: 'pending',
              paid_date: null,
              paid_amount: null,
              payment_notes: null,
            },
          ],
        },
      }

      queryClient.setQueryData(['payment-plans', 'plan-123'], mockPaymentPlan)

      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    data: {
                      installment: {
                        id: 'installment-123',
                        payment_plan_id: 'plan-123',
                        installment_number: 1,
                        amount: 1000,
                        paid_date: '2025-01-15',
                        paid_amount: 500,
                        status: 'partial',
                        payment_notes: null,
                      },
                      payment_plan: {
                        id: 'plan-123',
                        status: 'active',
                        earned_commission: 75,
                      },
                    },
                  }),
                } as Response),
              100
            )
          )
      )

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 500, // Partial payment
      })

      // Check optimistic update
      await waitFor(() => {
        const data: any = queryClient.getQueryData(['payment-plans', 'plan-123'])
        const installment = data?.data?.installments?.find((i: any) => i.id === 'installment-123')
        expect(installment?.status).toBe('partial')
        expect(installment?.paid_amount).toBe(500)
      })
    })

    it('should optimistically update earned_commission', async () => {
      const mockPaymentPlan = {
        data: {
          id: 'plan-123',
          total_amount: 10000,
          expected_commission: 1500,
          status: 'active',
          earned_commission: 0,
          installments: [
            {
              id: 'installment-123',
              amount: 1000,
              status: 'pending',
              paid_date: null,
              paid_amount: null,
              payment_notes: null,
            },
          ],
        },
      }

      queryClient.setQueryData(['payment-plans', 'plan-123'], mockPaymentPlan)

      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    data: {
                      installment: {
                        id: 'installment-123',
                        payment_plan_id: 'plan-123',
                        installment_number: 1,
                        amount: 1000,
                        paid_date: '2025-01-15',
                        paid_amount: 1000,
                        status: 'paid',
                        payment_notes: null,
                      },
                      payment_plan: {
                        id: 'plan-123',
                        status: 'active',
                        earned_commission: 150,
                      },
                    },
                  }),
                } as Response),
              100
            )
          )
      )

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
      })

      // Check optimistic update - earned_commission should be (1000 / 10000) * 1500 = 150
      await waitFor(() => {
        const data: any = queryClient.getQueryData(['payment-plans', 'plan-123'])
        expect(data?.data?.earned_commission).toBe(150)
      })
    })

    it('should include partial payments in earned_commission calculation', async () => {
      const mockPaymentPlan = {
        data: {
          id: 'plan-123',
          total_amount: 10000,
          expected_commission: 1500,
          status: 'active',
          earned_commission: 75,
          installments: [
            {
              id: 'installment-123',
              amount: 1000,
              status: 'partial',
              paid_date: '2025-01-10',
              paid_amount: 500,
              payment_notes: null,
            },
            {
              id: 'installment-124',
              amount: 1000,
              status: 'pending',
              paid_date: null,
              paid_amount: null,
              payment_notes: null,
            },
          ],
        },
      }

      queryClient.setQueryData(['payment-plans', 'plan-123'], mockPaymentPlan)

      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    data: {
                      installment: {
                        id: 'installment-124',
                        payment_plan_id: 'plan-123',
                        installment_number: 2,
                        amount: 1000,
                        paid_date: '2025-01-15',
                        paid_amount: 600,
                        status: 'partial',
                        payment_notes: null,
                      },
                      payment_plan: {
                        id: 'plan-123',
                        status: 'active',
                        earned_commission: 165,
                      },
                    },
                  }),
                } as Response),
              100
            )
          )
      )

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-124',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 600,
      })

      // Total paid: 500 + 600 = 1100
      // Earned commission: (1100 / 10000) * 1500 = 165
      await waitFor(() => {
        const data: any = queryClient.getQueryData(['payment-plans', 'plan-123'])
        expect(data?.data?.earned_commission).toBe(165)
      })
    })

    it('should update payment plan status to completed when all installments paid', async () => {
      const mockPaymentPlan = {
        data: {
          id: 'plan-123',
          total_amount: 2000,
          expected_commission: 300,
          status: 'active',
          earned_commission: 150,
          installments: [
            {
              id: 'installment-123',
              amount: 1000,
              status: 'paid',
              paid_date: '2025-01-10',
              paid_amount: 1000,
              payment_notes: null,
            },
            {
              id: 'installment-124',
              amount: 1000,
              status: 'pending',
              paid_date: null,
              paid_amount: null,
              payment_notes: null,
            },
          ],
        },
      }

      queryClient.setQueryData(['payment-plans', 'plan-123'], mockPaymentPlan)

      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    data: {
                      installment: {
                        id: 'installment-124',
                        payment_plan_id: 'plan-123',
                        installment_number: 2,
                        amount: 1000,
                        paid_date: '2025-01-15',
                        paid_amount: 1000,
                        status: 'paid',
                        payment_notes: null,
                      },
                      payment_plan: {
                        id: 'plan-123',
                        status: 'completed',
                        earned_commission: 300,
                      },
                    },
                  }),
                } as Response),
              100
            )
          )
      )

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-124',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
      })

      // Check that payment plan status is updated to completed
      await waitFor(() => {
        const data: any = queryClient.getQueryData(['payment-plans', 'plan-123'])
        expect(data?.data?.status).toBe('completed')
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error toast on API failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Payment amount exceeds installment amount',
          },
        }),
      } as Response)

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1500,
      })

      await waitFor(() =>
        expect(mockAddToast).toHaveBeenCalledWith({
          title: 'Failed to record payment',
          description: 'Payment amount exceeds installment amount',
          variant: 'error',
        })
      )
    })

    it('should revert optimistic update on error', async () => {
      const mockPaymentPlan = {
        data: {
          id: 'plan-123',
          total_amount: 10000,
          expected_commission: 1500,
          status: 'active',
          earned_commission: 0,
          installments: [
            {
              id: 'installment-123',
              amount: 1000,
              status: 'pending',
              paid_date: null,
              paid_amount: null,
              payment_notes: null,
            },
          ],
        },
      }

      queryClient.setQueryData(['payment-plans', 'plan-123'], mockPaymentPlan)

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Validation error',
          },
        }),
      } as Response)

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      // Verify cache was reverted to original state
      const data: any = queryClient.getQueryData(['payment-plans', 'plan-123'])
      const installment = data?.data?.installments?.find((i: any) => i.id === 'installment-123')
      expect(installment?.status).toBe('pending')
      expect(installment?.paid_amount).toBeNull()
      expect(data?.data?.earned_commission).toBe(0)
    })

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
      })

      await waitFor(() =>
        expect(mockAddToast).toHaveBeenCalledWith({
          title: 'Failed to record payment',
          description: 'Network error',
          variant: 'error',
        })
      )
    })
  })

  describe('Loading States', () => {
    it('should set isPending to true while mutation is in progress', async () => {
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    data: {
                      installment: {
                        id: 'installment-123',
                        payment_plan_id: 'plan-123',
                        installment_number: 1,
                        amount: 1000,
                        paid_date: '2025-01-15',
                        paid_amount: 1000,
                        status: 'paid',
                        payment_notes: null,
                      },
                      payment_plan: {
                        id: 'plan-123',
                        status: 'active',
                        earned_commission: 150,
                      },
                    },
                  }),
                } as Response),
              100
            )
          )
      )

      const { result } = renderHook(() => useRecordPayment(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(false)

      result.current.mutate({
        installmentId: 'installment-123',
        paymentPlanId: 'plan-123',
        paid_date: '2025-01-15',
        paid_amount: 1000,
      })

      await waitFor(() => expect(result.current.isPending).toBe(true))
      await waitFor(() => expect(result.current.isPending).toBe(false))
    })
  })
})
