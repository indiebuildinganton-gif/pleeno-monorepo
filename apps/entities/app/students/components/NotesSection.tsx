'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiUrl } from '@/hooks/useApiUrl'
import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@pleeno/ui/components/ui/button'
import { Textarea } from '@pleeno/ui/components/ui/textarea'
import { Label } from '@pleeno/ui/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@pleeno/ui/components/ui/dialog'
import { getRelativeTime } from '@pleeno/utils'

/**
 * Note interface
 */
interface Note {
  id: string
  student_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    email: string
  }
}

/**
 * NotesSection Component
 *
 * Main notes component for student detail page:
 * - Text area for adding notes (max 2,000 characters)
 * - Character counter (e.g., "0 / 2,000")
 * - "Post Note" button
 * - List of existing notes with relative timestamps
 * - Edit/delete icons for each note
 * - Edit modal for updating notes
 * - Delete confirmation modal
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 11: Notes Section UI
 *
 * Features:
 * - Live character counter
 * - Max 2,000 character validation
 * - Visual warning at 1,800+ characters
 * - User attribution on notes
 * - Relative timestamps ("4 days ago")
 * - Edit/delete only for note owner
 * - Delete requires confirmation
 *
 * Acceptance Criteria (AC 4):
 * - Text area with max 2,000 chars ✓
 * - Character counter ✓
 * - Post Note button ✓
 * - Notes list with timestamps ✓
 * - Edit/delete icons ✓
 */
export function NotesSection({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient()
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)

  // Character limits
  const MAX_CHARS = 2000
  const WARNING_THRESHOLD = 1800

  // Fetch notes
  const {
    data: notes,
    isLoading,
    error,
  } = useQuery<Note[]>({
    queryKey: ['student-notes', studentId],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/students/${studentId}/notes`))
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }
      const result = await response.json()
      return result.data || []
    },
  })

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(getApiUrl(`/api/students/${studentId}/notes`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create note')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] })
      setNewNoteContent('')
    },
  })

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const response = await fetch(getApiUrl(`/api/students/${studentId}/notes/${noteId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update note')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] })
      setEditingNote(null)
      setEditNoteContent('')
    },
  })

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(getApiUrl(`/api/students/${studentId}/notes/${noteId}`), {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to delete note')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] })
      setDeletingNote(null)
    },
  })

  /**
   * Handle post note
   */
  const handlePostNote = () => {
    if (newNoteContent.trim() && newNoteContent.length <= MAX_CHARS) {
      createNoteMutation.mutate(newNoteContent.trim())
    }
  }

  /**
   * Handle edit note click
   */
  const handleEditClick = (note: Note) => {
    setEditingNote(note)
    setEditNoteContent(note.content)
  }

  /**
   * Handle save edit
   */
  const handleSaveEdit = () => {
    if (editingNote && editNoteContent.trim() && editNoteContent.length <= MAX_CHARS) {
      updateNoteMutation.mutate({
        noteId: editingNote.id,
        content: editNoteContent.trim(),
      })
    }
  }

  /**
   * Handle delete note
   */
  const handleDeleteNote = () => {
    if (deletingNote) {
      deleteNoteMutation.mutate(deletingNote.id)
    }
  }

  /**
   * Get character counter color based on count
   */
  const getCharCountColor = (count: number) => {
    if (count > MAX_CHARS) return 'text-destructive font-semibold'
    if (count >= WARNING_THRESHOLD) return 'text-orange-600 font-medium'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      {/* Add Note Section */}
      <div className="space-y-3">
        <Label htmlFor="new-note" className="text-base font-semibold">
          Add Note
        </Label>
        <Textarea
          id="new-note"
          placeholder="Enter your note here..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          className="min-h-[120px] resize-none"
          maxLength={MAX_CHARS}
        />
        <div className="flex items-center justify-between">
          <span className={`text-sm ${getCharCountColor(newNoteContent.length)}`}>
            {newNoteContent.length} / {MAX_CHARS}
          </span>
          <Button
            onClick={handlePostNote}
            disabled={
              !newNoteContent.trim() ||
              newNoteContent.length > MAX_CHARS ||
              createNoteMutation.isPending
            }
          >
            {createNoteMutation.isPending ? 'Posting...' : 'Post Note'}
          </Button>
        </div>
        {createNoteMutation.isError && (
          <p className="text-sm text-destructive">
            {createNoteMutation.error?.message || 'Failed to post note'}
          </p>
        )}
      </div>

      {/* Previous Notes Section */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Previous Notes</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">Failed to load notes. Please try again.</p>
          </div>
        ) : !notes || notes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground">No notes yet. Add your first note above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  {/* Note content */}
                  <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>

                  {/* Note metadata and actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      {note.user?.full_name && (
                        <span className="font-medium">{note.user.full_name}</span>
                      )}
                      {note.user?.full_name && ' · '}
                      <span>{getRelativeTime(note.created_at)}</span>
                      {note.updated_at !== note.created_at && (
                        <span className="ml-1">(edited)</span>
                      )}
                    </div>

                    {/* Edit/Delete actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(note)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="Edit note"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        onClick={() => setDeletingNote(note)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update your note content. Maximum {MAX_CHARS} characters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Textarea
              value={editNoteContent}
              onChange={(e) => setEditNoteContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={MAX_CHARS}
            />
            <div className="flex items-center justify-end">
              <span className={`text-sm ${getCharCountColor(editNoteContent.length)}`}>
                {editNoteContent.length} / {MAX_CHARS}
              </span>
            </div>
            {updateNoteMutation.isError && (
              <p className="text-sm text-destructive">
                {updateNoteMutation.error?.message || 'Failed to update note'}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingNote(null)}
              disabled={updateNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={
                !editNoteContent.trim() ||
                editNoteContent.length > MAX_CHARS ||
                updateNoteMutation.isPending
              }
            >
              {updateNoteMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingNote} onOpenChange={(open) => !open && setDeletingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletingNote && (
            <div className="py-4">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {deletingNote.content}
                </p>
              </div>
            </div>
          )}

          {deleteNoteMutation.isError && (
            <p className="text-sm text-destructive">
              {deleteNoteMutation.error?.message || 'Failed to delete note'}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingNote(null)}
              disabled={deleteNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteNote}
              disabled={deleteNoteMutation.isPending}
            >
              {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
