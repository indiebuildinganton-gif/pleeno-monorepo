/**
 * Profile Form Component
 *
 * Client component for managing user profile with:
 * - Editable full name field
 * - Read-only email, role, agency fields
 * - Change password dialog
 * - Email change request/update dialogs
 *
 * Uses React Hook Form for form state management
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProfileUpdateSchema, type ProfileUpdate } from '@pleeno/validations'
import { Button, Input, Label, Card, useToast, Checkbox } from '@pleeno/ui'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { UpdateEmailDialog } from './UpdateEmailDialog'
import { RequestEmailChangeDialog } from './RequestEmailChangeDialog'

interface ProfileFormProps {
  user: {
    id: string
    email: string
    full_name: string
    role: 'agency_admin' | 'agency_user'
    agency_name: string
    email_notifications_enabled: boolean
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [updateEmailOpen, setUpdateEmailOpen] = useState(false)
  const [requestEmailChangeOpen, setRequestEmailChangeOpen] = useState(false)
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<ProfileUpdate>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      full_name: user.full_name,
      email_notifications_enabled: user.email_notifications_enabled,
    },
  })

  const emailNotificationsEnabled = watch('email_notifications_enabled')

  const onSubmit = async (data: ProfileUpdate) => {
    setLoading(true)

    try {
      const response = await fetch('/api/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        addToast({
          title: 'Success',
          description: 'Profile updated successfully',
          variant: 'success',
        })
      } else {
        addToast({
          title: 'Error',
          description: result.error?.message || 'Failed to update profile',
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user.role === 'agency_admin'

  // Role display mapping
  const roleDisplay = {
    agency_admin: 'Agency Admin',
    agency_user: 'Agency User',
  }

  return (
    <>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Read-Only Section */}
          <div className="space-y-4 pb-6 border-b">
            <h2 className="text-lg font-semibold">Account Information</h2>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Input id="email" value={user.email} disabled className="flex-1" />
                {isAdmin ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUpdateEmailOpen(true)}
                  >
                    Update Email
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestEmailChangeOpen(true)}
                  >
                    Request Change
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? 'Click "Update Email" to change your email address'
                  : 'Contact your Agency Admin to change your email'}
              </p>
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={roleDisplay[user.role]} disabled />
            </div>

            {/* Agency (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="agency">Agency</Label>
              <Input id="agency" value={user.agency_name} disabled />
            </div>
          </div>

          {/* Editable Section */}
          <div className="space-y-4 pb-6 border-b">
            <h2 className="text-lg font-semibold">Personal Information</h2>

            {/* Full Name (Editable) */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Enter your full name"
                className={errors.full_name ? 'border-red-500' : ''}
              />
              {errors.full_name && (
                <p className="text-sm text-red-500">{errors.full_name.message}</p>
              )}
            </div>
          </div>

          {/* Notification Preferences Section */}
          <div className="space-y-4 pb-6 border-b">
            <h2 className="text-lg font-semibold">Notification Preferences</h2>

            <div className="flex items-start gap-3">
              <Checkbox
                id="email_notifications_enabled"
                checked={emailNotificationsEnabled}
                onCheckedChange={(checked) => setValue('email_notifications_enabled', checked, { shouldDirty: true })}
              />
              <div className="flex-1">
                <Label htmlFor="email_notifications_enabled" className="cursor-pointer">
                  Receive email notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Get notified when students have overdue payments, upcoming due dates, and payment
                  confirmations
                </p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Security</h2>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center gap-2">
                <Input type="password" value="••••••••••••" disabled className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setChangePasswordOpen(true)}
                >
                  Change Password
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click "Change Password" to update your password
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Button type="submit" disabled={loading || !isDirty}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Dialogs */}
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <UpdateEmailDialog
        open={updateEmailOpen}
        onOpenChange={setUpdateEmailOpen}
        userId={user.id}
      />
      <RequestEmailChangeDialog
        open={requestEmailChangeOpen}
        onOpenChange={setRequestEmailChangeOpen}
      />
    </>
  )
}
