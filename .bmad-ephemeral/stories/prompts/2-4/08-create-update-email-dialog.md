# Story 2-4: User Profile Management
## Task 8: Create update email dialog (admin only)

**User Story Context:**
- As an Agency User or Admin
- I want to manage my own profile information
- So that my account information is accurate and I can change my password

**Previous Tasks:** Tasks 1-7 completed ✅

---

## Task Details

### Task Description
Create a dialog component that allows agency admins to initiate email changes with verification workflow.

### Subtasks Checklist
- [ ] Create `apps/agency/app/profile/components/UpdateEmailDialog.tsx`
- [ ] Form field: New Email Address (email input)
- [ ] Warning message: "You will receive a verification email at the new address"
- [ ] "Cancel" and "Send Verification Email" buttons
- [ ] On submit: call PATCH `/api/users/{id}/email` with new email
- [ ] Show success toast: "Verification email sent to [new email]"
- [ ] Close dialog on success
- [ ] Display instructions: "Check your email and click the verification link"

### Relevant Acceptance Criteria
- **AC8:** Admin can update their own email address
- **AC9:** Email changes require administrator verification via email link

---

## Context

### Key Constraints
- **UI Patterns:** Client Components for interactive forms; Confirmation dialogs for sensitive actions
- **Authentication & Authorization:** Admin-only feature

---

## 📋 MANIFEST UPDATE

Before starting implementation:
1. **Open:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`
2. **Update Task 7:** Status → "Completed", add Completed date
3. **Update Task 8:** Status → "In Progress", add Started date

---

## Implementation

```typescript
// apps/agency/app/profile/components/UpdateEmailDialog.tsx
'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Mail } from 'lucide-react'

interface UpdateEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function UpdateEmailDialog({ open, onOpenChange, userId }: UpdateEmailDialogProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { toast } = useToast()

  const updateEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      const response = await fetch(`/api/users/${userId}/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to send verification email')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Verification Email Sent',
        description: `We've sent a verification link to ${email}. Please check your inbox.`,
        duration: 8000
      })
      resetForm()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      setError(error.message)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const resetForm = () => {
    setEmail('')
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    updateEmailMutation.mutate(email)
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address. You'll need to verify it before the change takes effect.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              A verification link will be sent to your new email address.
              You must click the link within 1 hour to complete the change.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="email">New Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.new.email@example.com"
              required
              autoComplete="email"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateEmailMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEmailMutation.isPending}
            >
              {updateEmailMutation.isPending ? 'Sending...' : 'Send Verification Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Testing

1. **Access as admin:** Only admins should see "Update Email" button
2. **Open dialog:** Click "Update Email" from profile
3. **Test validation:**
   - Try invalid email format
   - Try already-used email (if available)
4. **Test success:**
   - Enter valid new email
   - Verify success toast
   - Check email inbox for verification link
5. **Test email verification:**
   - Click link from email
   - Should redirect to profile with success message

---

## Dependencies

**UI Components:**
- Shadcn UI: Dialog, Button, Input, Label, Alert
- Lucide icons: Mail
- TanStack Query for mutation

**API Endpoints:**
- PATCH `/api/users/{id}/email` (Task 4)

**Email:**
- Verification email template (Task 11)

---

## Next Steps

After completing Task 8:
1. **Update the manifest:** Mark Task 8 as "Completed"
2. **Test full email change flow:** Dialog → email → verification (Task 5)
3. **Move to Task 9:** Open `09-create-request-email-change-dialog.md`

---

## Reference Documents
- Story context: [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](.bmad-ephemeral/stories/2-4-user-profile-management.context.xml)
