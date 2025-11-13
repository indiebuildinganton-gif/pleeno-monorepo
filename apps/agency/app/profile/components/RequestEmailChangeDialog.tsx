/**
 * Request Email Change Dialog (Regular Users)
 *
 * Dialog for regular users who cannot change their own email:
 * - Informational message about admin approval requirement
 * - Form fields for requested email and optional reason
 * - For MVP: Shows toast message to contact admin
 * - Future: Will submit request to notification system
 *
 * Acceptance Criteria: AC6, AC7
 */

'use client'

import { useState } from 'react'
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
import { AlertCircle } from 'lucide-react'

interface RequestEmailChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestEmailChangeDialog({ open, onOpenChange }: RequestEmailChangeDialogProps) {
  const [requestedEmail, setRequestedEmail] = useState('')
  const [reason, setReason] = useState('')
  const { addToast } = useToast()

  const resetForm = () => {
    setRequestedEmail('')
    setReason('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // For MVP: Just show toast message to contact admin
    // Future: Create in-app notification or email to admins
    addToast({
      title: 'Email Change Request',
      description: 'Please contact your Agency Admin to change your email address. They will initiate the change and verification process for you.',
      variant: 'default',
      duration: 8000,
    })

    resetForm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Email Change</DialogTitle>
          <DialogDescription>
            Email changes require approval from an Agency Administrator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informational Alert */}
          <div className="flex gap-3 p-3 border border-yellow-200 bg-yellow-50 rounded-md">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Email changes must be approved by an Agency Admin</p>
              <p className="mt-1">
                Only Agency Admins can change email addresses to ensure company policy compliance.
                Please contact your admin with your request.
              </p>
            </div>
          </div>

          {/* Requested Email Field */}
          <div>
            <Label htmlFor="requestedEmail">Requested Email Address</Label>
            <Input
              id="requestedEmail"
              type="email"
              value={requestedEmail}
              onChange={(e) => setRequestedEmail(e.target.value)}
              placeholder="your.new.email@example.com"
              required
              autoComplete="email"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              The email address you would like to change to
            </p>
          </div>

          {/* Reason Field (Optional) */}
          <div>
            <Label htmlFor="reason">Reason for Change (Optional)</Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need to change your email?"
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              This information will help your admin process the request
            </p>
          </div>

          {/* MVP Note */}
          <div className="flex gap-3 p-3 border border-blue-200 bg-blue-50 rounded-md">
            <div className="text-sm text-blue-800">
              <p>
                <strong>MVP Note:</strong> For now, please contact your Agency Admin directly.
                A future update will allow you to submit requests through the app.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit">
              Acknowledge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
