/**
 * Enrollment Status Menu Component
 *
 * Provides a dropdown menu for changing enrollment status with confirmation dialog.
 * Supports status transitions: active, completed, cancelled
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 9: Enrollment Status Management UI
 */

'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { MoreVertical, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'

export interface EnrollmentStatusMenuProps {
  currentStatus: EnrollmentStatus
  enrollmentId: string
  onStatusChange: (enrollmentId: string, newStatus: EnrollmentStatus) => void
  disabled?: boolean
}

const statusConfig = {
  active: {
    label: 'Mark as Active',
    icon: RotateCcw,
    description: 'This will reactivate the enrollment.',
  },
  completed: {
    label: 'Mark as Completed',
    icon: CheckCircle,
    description: 'This will mark the enrollment as completed.',
  },
  cancelled: {
    label: 'Mark as Cancelled',
    icon: XCircle,
    description: 'This will cancel the enrollment.',
  },
}

/**
 * EnrollmentStatusMenu - Dropdown menu for changing enrollment status
 *
 * Features:
 * - Dropdown menu with status options
 * - Confirmation dialog before status change
 * - Only shows valid status transitions
 * - Disabled state support
 * - Icon indicators for each status
 *
 * @param currentStatus - Current enrollment status
 * @param enrollmentId - ID of the enrollment to update
 * @param onStatusChange - Callback when status is confirmed
 * @param disabled - Whether the menu is disabled
 */
export function EnrollmentStatusMenu({
  currentStatus,
  enrollmentId,
  onStatusChange,
  disabled = false,
}: EnrollmentStatusMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<EnrollmentStatus | null>(null)

  // Debug logging
  console.log('EnrollmentStatusMenu render - confirmDialogOpen:', confirmDialogOpen, 'selectedStatus:', selectedStatus)

  const handleStatusSelect = (status: EnrollmentStatus) => {
    console.log('handleStatusSelect called with status:', status)
    setDropdownOpen(false) // Close dropdown first
    setSelectedStatus(status)
    setConfirmDialogOpen(true)
    console.log('Dialog should open now')
  }

  const handleConfirm = () => {
    console.log('handleConfirm called - selectedStatus:', selectedStatus, 'enrollmentId:', enrollmentId)
    if (selectedStatus) {
      console.log('Calling onStatusChange with:', enrollmentId, selectedStatus)
      onStatusChange(enrollmentId, selectedStatus)
    } else {
      console.warn('No selectedStatus - not calling onStatusChange')
    }
    setConfirmDialogOpen(false)
    setSelectedStatus(null)
  }

  const handleCancel = () => {
    console.log('handleCancel called')
    setConfirmDialogOpen(false)
    setSelectedStatus(null)
  }

  // Get available status options (exclude current status)
  const availableStatuses = (Object.keys(statusConfig) as EnrollmentStatus[]).filter(
    (status) => status !== currentStatus
  )

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled} className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableStatuses.map((status) => {
            const config = statusConfig[status]
            const Icon = config.icon
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusSelect(status)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {config.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      {confirmDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmDialogOpen(false)
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              minWidth: '400px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: 'black' }}>
              Confirm Status Change
            </h2>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
              {selectedStatus && statusConfig[selectedStatus].description}
              <br />
              <strong style={{ color: 'black' }}>Are you sure you want to proceed?</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: 'black',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
