'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  Checkbox,
} from '@pleeno/ui'

interface MasterTask {
  id: string
  task_name: string
  task_code: string
  description: string | null
}

export function InviteUserModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'agency_admin' | 'agency_user'>('agency_user')
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [masterTasks, setMasterTasks] = useState<MasterTask[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load master tasks when modal opens
  useEffect(() => {
    if (open && masterTasks.length === 0) {
      loadMasterTasks()
    }
  }, [open, masterTasks.length])

  const loadMasterTasks = async () => {
    setIsLoadingTasks(true)
    try {
      const response = await fetch('/api/master-tasks')
      if (!response.ok) {
        throw new Error('Failed to load tasks')
      }
      const data = await response.json()
      setMasterTasks(data.data || [])
    } catch (err) {
      console.error('Failed to load master tasks:', err)
      setError('Failed to load task list')
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
          task_ids: selectedTaskIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send invitation')
      }

      setSuccess(true)
      setEmail('')
      setRole('agency_user')
      setSelectedTaskIds([])

      // Close modal after 1.5 seconds
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        // Refresh the page to show the new invitation
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite User</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new team member to your agency.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'agency_admin' | 'agency_user')
                }
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="agency_user">User</option>
                <option value="agency_admin">Admin</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Task Assignments (Optional)</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Select the tasks this user will be responsible for:
              </div>
              {isLoadingTasks ? (
                <div className="text-sm text-muted-foreground py-4">
                  Loading tasks...
                </div>
              ) : masterTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  No tasks available
                </div>
              ) : (
                <div className="space-y-3 border rounded-md p-4 max-h-60 overflow-y-auto">
                  {masterTasks.map((task) => (
                    <div key={task.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={() => handleTaskToggle(task.id)}
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`task-${task.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {task.task_name}
                        </Label>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedTaskIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                Invitation sent to {email}!
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
