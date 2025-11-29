'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
  useToast,
} from '@pleeno/ui'
import { RefreshCw, Trash2 } from 'lucide-react'

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
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data: invitations } = useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: async () => {
      const response = await fetch('/api/invitations?status=pending')
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch invitations')
      }
      return result.data as Invitation[]
    },
    initialData: initialInvitations,
    staleTime: 30000,
  })

  const resendMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to resend invitation')
      }
      return result.data
    },
    onSuccess: (data, invitationId) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] })
      const invitation = invitations?.find((inv) => inv.id === invitationId)
      addToast({
        title: 'Invitation resent',
        description: `Invitation resent to ${invitation?.email}`,
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      addToast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete invitation')
      }
      return result
    },
    onSuccess: (data, invitationId) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] })
      const invitation = invitations?.find((inv) => inv.id === invitationId)
      addToast({
        title: 'Invitation deleted',
        description: `Invitation for ${invitation?.email} has been deleted`,
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      addToast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      })
    },
  })

  const getExpiresIn = (expiresAt: string) => {
    return formatDistanceToNow(new Date(expiresAt), { addSuffix: true })
  }

  if (!invitations || invitations.length === 0) {
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
                <Badge
                  variant={invitation.role === 'agency_admin' ? 'default' : 'secondary'}
                >
                  {invitation.role === 'agency_admin' ? 'Admin' : 'User'}
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
              <TableCell className="text-muted-foreground">
                {getExpiresIn(invitation.expires_at)}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resendMutation.mutate(invitation.id)}
                  disabled={resendMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Resend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteMutation.mutate(invitation.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
