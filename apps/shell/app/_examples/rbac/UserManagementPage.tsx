/**
 * User Management Page - Admin-only component example
 *
 * This is an example component demonstrating client-side RBAC implementation.
 * Shows how to restrict entire pages to specific roles.
 *
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.3: Authentication & Authorization Framework
 * Task 4: Implement Role-Based Access Control
 *
 * ⚠️ SECURITY NOTE:
 * Client-side role checks are for UI rendering ONLY.
 * The actual API endpoint (/api/agency/users) enforces authorization with requireRole().
 */

'use client'

import { useAuth } from '@pleeno/auth'
import { isAgencyAdmin } from '@pleeno/auth'

/**
 * User Management Page Component
 *
 * Features:
 * - Admin-only access with graceful error message
 * - Loading state during auth initialization
 * - Example of page-level role restriction
 *
 * Usage:
 * ```tsx
 * import UserManagementPage from './_examples/rbac/UserManagementPage'
 *
 * export default function Page() {
 *   return <UserManagementPage />
 * }
 * ```
 */
export default function UserManagementPage() {
  const { user, loading } = useAuth()

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show to agency admins (client-side check for UI only)
  if (!isAgencyAdmin(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 text-center text-6xl">🔒</div>
          <h1 className="mb-2 text-center text-2xl font-bold text-red-600">
            Access Denied
          </h1>
          <p className="mb-4 text-center text-gray-600">
            You don't have permission to view this page.
          </p>
          <p className="text-center text-sm text-gray-500">
            This page is only accessible to Agency Administrators.
          </p>
          <div className="mt-6 text-center">
            <a
              href="/dashboard"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Admin view - show user management interface
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage users and permissions for your agency
          </p>
        </div>

        {/* Admin-only actions */}
        <div className="mb-6 flex space-x-4">
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => alert('Add user functionality would go here')}
          >
            Add User
          </button>
          <button
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            onClick={() => alert('Invite user functionality would go here')}
          >
            Invite User
          </button>
        </div>

        {/* User list */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Agency Users</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600">
              This is a placeholder for the user list component.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              In a real implementation, this would fetch and display users from
              the /api/agency/users endpoint.
            </p>

            {/* Example user table structure */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500" colSpan={5}>
                      No users loaded (example component)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
