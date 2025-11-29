/**
 * Payments App Root Page
 * Redirects to the payment plans list
 *
 * Epic 4: Payments Domain
 * Story 4.3: Payment Plan List and Detail Views
 */

import { redirect } from 'next/navigation'

export default function PaymentsRootPage() {
  redirect('/payments/plans')
}
