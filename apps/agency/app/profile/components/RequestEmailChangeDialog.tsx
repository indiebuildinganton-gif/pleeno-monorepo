/**
 * Request Email Change Dialog (Regular Users)
 *
 * Dialog for regular users who cannot change their own email:
 * - Informational message about admin approval requirement
 * - Instructions to contact Agency Admin
 * - For MVP: Simple notification, no actual request submission
 *
 * Acceptance Criteria: 6, 7
 */

'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useToast,
} from '@pleeno/ui'

interface RequestEmailChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestEmailChangeDialog({ open, onOpenChange }: RequestEmailChangeDialogProps) {
  const { addToast } = useToast()

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleRequestChange = () => {
    addToast({
      title: 'Contact Your Agency Admin',
      description:
        'Please contact your Agency Admin to request an email address change. Email changes require administrator approval for security reasons.',
      variant: 'default',
      duration: 7000,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Change Request</DialogTitle>
          <DialogDescription>
            Email changes must be approved by an Agency Admin for security reasons.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informational Message */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Why is admin approval required?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ensures email changes comply with company policies</li>
                  <li>Prevents unauthorized account modifications</li>
                  <li>Maintains audit trail for security</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <p className="text-sm font-medium">How to request an email change:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Contact your Agency Admin directly</li>
              <li>Provide your current email and the new email address</li>
              <li>Explain the reason for the change</li>
              <li>Your admin will process the request and send you a verification email</li>
            </ol>
          </div>

          {/* Contact Info (placeholder) */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              <span className="font-medium">Need help?</span> If you&apos;re unsure who your Agency
              Admin is, please contact your organization&apos;s IT support.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleRequestChange}>
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
