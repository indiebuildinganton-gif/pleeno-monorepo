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

interface Invitation {
  id: string
  email: string
  role: 'agency_admin' | 'agency_user'
  expires_at: string
  created_at: string
  invited_by: {
    full_name: string | null
  } | null
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

  const formatRole = (role: string) => {
    return role === 'agency_admin' ? 'Admin' : 'User'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const getRoleBadgeVariant = (role: string) => {
    return role === 'agency_admin' ? 'blue' : 'gray'
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
            <TableHead>Expires</TableHead>
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
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(invitation.expires_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(invitation.id)}
                  disabled={deletingId === invitation.id}
                >
                  {deletingId === invitation.id ? 'Revoking...' : 'Revoke'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
