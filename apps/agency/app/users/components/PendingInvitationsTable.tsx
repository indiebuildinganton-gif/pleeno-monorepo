'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
} from '@pleeno/ui'

interface Task {
  id: string
  task_name: string
  task_code: string
  description: string
}

interface Invitation {
  id: string
  email: string
  role: 'agency_admin' | 'agency_user'
  expires_at: string
  created_at: string
  invited_by: {
    full_name: string | null
  } | null
  assigned_tasks?: Task[]
}

interface PendingInvitationsTableProps {
  initialInvitations: Invitation[]
  currentUserId: string
}

export function PendingInvitationsTable({
  initialInvitations,
  currentUserId,
}: PendingInvitationsTableProps) {
  const [invitations, setInvitations] = useState(initialInvitations)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const formatRole = (role: string) => {
    return role === 'agency_admin' ? 'Admin' : 'User'
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = date.getTime() - now.getTime()
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays < 0) {
      return 'Expired'
    } else if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'In 1 day'
    } else if (diffInDays < 7) {
      return `In ${diffInDays} days`
    } else {
      return `In ${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    return role === 'agency_admin' ? 'blue' : 'gray'
  }

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId)

    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to resend invitation')
      }

      const data = await response.json()

      // Update the invitation in the list with new expiration
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId
            ? { ...inv, expires_at: data.data.expires_at }
            : inv
        )
      )

      alert('Invitation resent successfully!')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'An error occurred while resending the invitation'
      )
    } finally {
      setResendingId(null)
    }
  }

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return
    }

    setDeletingId(invitationId)

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke invitation')
      }

      // Remove the invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'An error occurred while revoking the invitation'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Assigned Tasks</TableHead>
            <TableHead>Expires In</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell className="font-medium">{invitation.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(invitation.role)}>
                  {formatRole(invitation.role)}
                </Badge>
              </TableCell>
              <TableCell>
                {invitation.invited_by?.full_name || 'Unknown'}
              </TableCell>
              <TableCell>
                {invitation.assigned_tasks && invitation.assigned_tasks.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {invitation.assigned_tasks.map((task) => (
                      <Badge key={task.id} variant="outline" className="text-xs">
                        {task.task_name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No tasks</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelativeTime(invitation.expires_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResend(invitation.id)}
                    disabled={resendingId === invitation.id}
                  >
                    {resendingId === invitation.id ? 'Resending...' : 'Resend'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(invitation.id)}
                    disabled={deletingId === invitation.id}
                  >
                    {deletingId === invitation.id ? 'Canceling...' : 'Cancel'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
