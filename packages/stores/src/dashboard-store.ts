/**
 * Dashboard Store - State management for dashboard UI
 *
 * This store manages:
 * - Commission filter state (period, college, branch)
 * - Cash flow view selection (daily, weekly, monthly)
 * - Filter persistence across page navigations
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Story 6.2: Cash Flow Projection Chart
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Commission filter configuration
 */
export interface CommissionFilters {
  /** Time period for commission data: all time, year, quarter, or month */
  period: 'all' | 'year' | 'quarter' | 'month'
  /** Optional college ID filter */
  college_id: string | null
  /** Optional branch ID filter */
  branch_id: string | null
}

/**
 * Cash flow view grouping type
 */
export type CashFlowView = 'daily' | 'weekly' | 'monthly'

/**
 * Dashboard store state and actions
 */
interface DashboardStore {
  /** Current commission filter state */
  commissionFilters: CommissionFilters
  /** Update one or more filter values */
  setCommissionFilters: (filters: Partial<CommissionFilters>) => void
  /** Reset all filters to default values */
  clearCommissionFilters: () => void
  /** Cash flow chart view selection */
  cashFlowView: CashFlowView
  /** Update cash flow view */
  setCashFlowView: (view: CashFlowView) => void
}

/**
 * Default filter state
 */
const defaultFilters: CommissionFilters = {
  period: 'all',
  college_id: null,
  branch_id: null,
}

/**
 * Dashboard store with persistent commission filters and cash flow view
 *
 * Usage:
 * ```typescript
 * const { commissionFilters, setCommissionFilters, clearCommissionFilters } = useDashboardStore()
 *
 * // Update a single filter
 * setCommissionFilters({ period: 'year' })
 *
 * // Update multiple filters
 * setCommissionFilters({ college_id: 'abc-123', branch_id: null })
 *
 * // Reset all filters
 * clearCommissionFilters()
 *
 * // Cash flow view
 * const { cashFlowView, setCashFlowView } = useDashboardStore()
 * setCashFlowView('weekly')
 * ```
 *
 * Persistence:
 * - Filter state is saved to localStorage under key "dashboard-store"
 * - State persists across page navigations and browser refreshes
 */
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      commissionFilters: defaultFilters,

      setCommissionFilters: (filters: Partial<CommissionFilters>) =>
        set((state) => ({
          commissionFilters: { ...state.commissionFilters, ...filters },
        })),

      clearCommissionFilters: () => set({ commissionFilters: defaultFilters }),

      cashFlowView: 'weekly',

      setCashFlowView: (view: CashFlowView) => set({ cashFlowView: view }),
    }),
    {
      name: 'dashboard-store',
    }
  )
)
