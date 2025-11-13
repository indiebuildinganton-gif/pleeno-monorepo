/**
 * Change Password Dialog
 *
 * Dialog for changing user password with:
 * - Current password field (for verification)
 * - New password field with strength indicator
 * - Confirm password field
 * - Password requirement validation
 *
 * Acceptance Criteria: 2, 3, 4
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PasswordChangeSchema, type PasswordChange } from '@pleeno/validations'
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
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PasswordChange>({
    resolver: zodResolver(PasswordChangeSchema),
  })

  const newPassword = watch('new_password', '')

  const onSubmit = async (data: PasswordChange) => {
    setLoading(true)

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        addToast({
          title: 'Success',
          description: 'Password changed successfully',
          variant: 'success',
        })
        reset()
        onOpenChange(false)
      } else {
        addToast({
          title: 'Error',
          description: result.error?.message || 'Failed to change password',
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
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
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new password that meets the security
            requirements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password">
              Current Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="current_password"
              type="password"
              {...register('current_password')}
              placeholder="Enter your current password"
              className={errors.current_password ? 'border-red-500' : ''}
            />
            {errors.current_password && (
              <p className="text-sm text-red-500">{errors.current_password.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password">
              New Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new_password"
              type="password"
              {...register('new_password')}
              placeholder="Enter your new password"
              className={errors.new_password ? 'border-red-500' : ''}
            />
            {errors.new_password && (
              <p className="text-sm text-red-500">{errors.new_password.message}</p>
            )}

            {/* Password Strength Indicator */}
            {newPassword && <PasswordStrengthIndicator password={newPassword} />}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password">
              Confirm New Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirm_password"
              type="password"
              {...register('confirm_password')}
              placeholder="Confirm your new password"
              className={errors.confirm_password ? 'border-red-500' : ''}
            />
            {errors.confirm_password && (
              <p className="text-sm text-red-500">{errors.confirm_password.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
