/**
 * Payments Root Page
 * Redirects to the payment plans list
 */

import { redirect } from 'next/navigation'

export default function PaymentsPage() {
  redirect('/payments/plans')
}
