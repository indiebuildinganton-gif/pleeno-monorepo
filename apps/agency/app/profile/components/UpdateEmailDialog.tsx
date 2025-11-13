/**
 * Update Email Dialog (Admin Only)
 *
 * Dialog for admins to initiate email change:
 * - New email address field
 * - Sends verification email to new address
 * - Warning about verification requirement
 *
 * Acceptance Criteria: 8, 9
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EmailUpdateSchema, type EmailUpdate } from '@pleeno/validations'
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useToast,
} from '@pleeno/ui'

interface UpdateEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function UpdateEmailDialog({ open, onOpenChange, userId }: UpdateEmailDialogProps) {
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailUpdate>({
    resolver: zodResolver(EmailUpdateSchema),
  })

  const onSubmit = async (data: EmailUpdate) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/users/${userId}/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        addToast({
          title: 'Verification Email Sent',
          description: `A verification link has been sent to ${data.email}. Please check your inbox.`,
          variant: 'success',
          duration: 7000,
        })
        reset()
        onOpenChange(false)
      } else {
        addToast({
          title: 'Error',
          description: result.error?.message || 'Failed to send verification email',
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Error updating email:', error)
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address. You will receive a verification email to confirm the
            change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Warning Message */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-600 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Verification Required</p>
                <p className="mt-1">
                  You will receive a verification email at the new address. The email change will
                  only be completed after you click the verification link.
                </p>
              </div>
            </div>
          </div>

          {/* New Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email">
              New Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="new.email@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          {/* Instructions */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Next steps:</strong> Check your new email inbox and click the verification
              link. The link will expire in 1 hour.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
