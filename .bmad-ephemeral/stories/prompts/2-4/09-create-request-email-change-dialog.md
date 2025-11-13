# Story 2-4: User Profile Management
## Task 9: Create request email change dialog (regular user)

**User Story Context:**
- As an Agency User or Admin
- I want to manage my own profile information
- So that my account information is accurate and I can change my password

**Previous Tasks:** Tasks 1-8 completed ✅

---

## Task Details

### Task Description
Create a dialog component for regular (non-admin) users that explains they cannot change their email directly and must contact an admin.

### Subtasks Checklist
- [ ] Create `apps/agency/app/profile/components/RequestEmailChangeDialog.tsx`
- [ ] Display informational message: "Email changes must be approved by an Agency Admin"
- [ ] Form field: Requested Email Address (email input)
- [ ] Form field: Reason for change (textarea, optional)
- [ ] "Cancel" and "Submit Request" buttons
- [ ] On submit: Create notification for admins (future: notification system)
- [ ] For MVP: Show toast: "Please contact your Agency Admin to change your email"
- [ ] Close dialog

### Relevant Acceptance Criteria
- **AC6:** Regular users must request email changes from Agency Admin
- **AC7:** Only Agency Admins can update user emails

---

## Context

### Key Constraints
- **UI Patterns:** Client Components for interactive forms
- **Future Enhancement:** In-app notification system for admin requests (not in MVP)

---

## 📋 MANIFEST UPDATE

Before starting implementation:
1. **Open:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`
2. **Update Task 8:** Status → "Completed", add Completed date
3. **Update Task 9:** Status → "In Progress", add Started date

---

## Implementation

```typescript
// apps/agency/app/profile/components/RequestEmailChangeDialog.tsx
'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle } from 'lucide-react'

interface RequestEmailChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestEmailChangeDialog({ open, onOpenChange }: RequestEmailChangeDialogProps) {
  const [requestedEmail, setRequestedEmail] = useState('')
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  const resetForm = () => {
    setRequestedEmail('')
    setReason('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // For MVP: Just show toast message to contact admin
    // Future: Create in-app notification or email to admins
    toast({
      title: 'Email Change Request',
      description: 'Please contact your Agency Admin to change your email address. They will initiate the change and verification process for you.',
      duration: 8000
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only Agency Admins can change email addresses to ensure company policy compliance.
              Please contact your admin with your request.
            </AlertDescription>
          </Alert>

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
            />
            <p className="text-sm text-muted-foreground mt-1">
              The email address you would like to change to
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Change (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need to change your email?"
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              This information will help your admin process the request
            </p>
          </div>

          <Alert variant="default">
            <AlertDescription>
              <strong>MVP Note:</strong> For now, please contact your Agency Admin directly.
              A future update will allow you to submit requests through the app.
            </AlertDescription>
          </Alert>

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
```

---

## Testing

1. **Access as regular user:** Non-admins should see "Request Change" button
2. **Open dialog:** Click "Request Change" next to email
3. **View informational message:** Clear explanation of admin approval
4. **Fill form:**
   - Enter requested email
   - Add optional reason
5. **Submit:**
   - Verify toast message appears
   - Message directs user to contact admin
6. **Verify admin can't see this dialog:** Admins use UpdateEmailDialog instead

---

## Future Enhancement

**When notification system is implemented:**
```typescript
// Future: Create notification for admins
const notifyAdmins = async () => {
  await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'email_change_request',
      data: {
        requested_email: requestedEmail,
        reason: reason,
        user_id: currentUserId
      }
    })
  })
}
```

---

## Dependencies

**UI Components:**
- Shadcn UI: Dialog, Button, Input, Label, Textarea, Alert
- Lucide icons: AlertCircle

**Future:**
- Notification system API (not in Story 2.4)

---

## Next Steps

After completing Task 9:
1. **Update the manifest:** Mark Task 9 as "Completed"
2. **Test from profile:** Verify correct dialog shows based on role
3. **Move to Task 10:** Open `10-create-email-verification-page.md`

---

## Reference Documents
- Story context: [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](.bmad-ephemeral/stories/2-4-user-profile-management.context.xml)
