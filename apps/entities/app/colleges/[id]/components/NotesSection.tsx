'use client'

/**
 * Notes Section Component
 *
 * Displays college notes with textarea input and character counter.
 * Allows users to post new notes (max 2000 characters).
 * Supports editing and deleting notes (creator or admin only).
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 18: Create Notes Section Component
 *
 * Features:
 * - Real-time character counter
 * - Success toast notifications
 * - Relative timestamps ("2 days ago")
 * - Edit/delete functionality for creator or admin
 * - Post button disabled when empty or exceeds 2000 chars
 */

import { useEffect, useState } from 'react'
import { Button, useToast } from '@pleeno/ui'
import { getApiUrl } from '@/hooks/useApiUrl'
import { Pencil, Trash2 } from 'lucide-react'
import { getRelativeTime } from '@pleeno/utils'
import { createClient } from '@pleeno/database/client'

interface Note {
  id: string
  content: string
  created_at: string
  user_id: string
  user: {
    id: string
    full_name: string
    email: string
  }
}

interface NotesSectionProps {
  collegeId: string
}

const MAX_NOTE_LENGTH = 2000

export function NotesSection({ collegeId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [noteContent, setNoteContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetchCurrentUser()
    fetchNotes()
  }, [collegeId])

  async function fetchCurrentUser() {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.error('Failed to fetch current user:', error)
        return
      }

      setCurrentUserId(user.id)
      setIsAdmin(user.app_metadata?.role === 'agency_admin')
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  async function fetchNotes() {
    try {
      const response = await fetch(getApiUrl(`/api/colleges/${collegeId}/notes`))
      if (response.ok) {
        const result = await response.json()
        setNotes(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePostNote() {
    if (!noteContent.trim() || isPosting) return

    setIsPosting(true)
    try {
      const response = await fetch(getApiUrl(`/api/colleges/${collegeId}/notes`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: noteContent }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to post note')
      }

      // Clear the textarea and refresh notes
      setNoteContent('')
      await fetchNotes()

      // Show success toast
      addToast({
        title: 'Success',
        description: 'Note posted successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Failed to post note:', error)
      addToast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to post note. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPosting(false)
    }
  }

  async function handleEditNote(noteId: string) {
    if (!editContent.trim()) return

    try {
      const response = await fetch(getApiUrl(`/api/colleges/${collegeId}/notes/${noteId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update note')
      }

      // Clear editing state and refresh notes
      setEditingNoteId(null)
      setEditContent('')
      await fetchNotes()

      // Show success toast
      addToast({
        title: 'Success',
        description: 'Note updated successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Failed to update note:', error)
      addToast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(getApiUrl(`/api/colleges/${collegeId}/notes/${noteId}`), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete note')
      }

      // Refresh notes
      await fetchNotes()

      // Show success toast
      addToast({
        title: 'Success',
        description: 'Note deleted successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Failed to delete note:', error)
      addToast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to delete note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  function startEditing(note: Note) {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  function cancelEditing() {
    setEditingNoteId(null)
    setEditContent('')
  }

  function canEditOrDelete(note: Note): boolean {
    return currentUserId === note.user_id || isAdmin
  }


  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Notes</h2>

      {/* Note Input */}
      <div className="mb-6">
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value.slice(0, MAX_NOTE_LENGTH))}
          placeholder="Add a note about this college..."
          className="w-full px-3 py-2 border rounded-md bg-background min-h-24 resize-y"
          maxLength={MAX_NOTE_LENGTH}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-muted-foreground">
            {noteContent.length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}
          </span>
          <Button
            onClick={handlePostNote}
            disabled={!noteContent.trim() || isPosting}
            size="sm"
          >
            {isPosting ? 'Posting...' : 'Post Note'}
          </Button>
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border-b pb-3 last:border-b-0">
              {editingNoteId === note.id ? (
                // Edit mode
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value.slice(0, MAX_NOTE_LENGTH))}
                    className="w-full px-3 py-2 border rounded-md bg-background min-h-20 resize-y"
                    maxLength={MAX_NOTE_LENGTH}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {editContent.length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditNote(note.id)}
                        disabled={!editContent.trim() || editContent.length > MAX_NOTE_LENGTH}
                        size="sm"
                        variant="default"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="text-sm whitespace-pre-wrap">{note.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-muted-foreground">
                      {note.user.full_name} • {getRelativeTime(note.created_at)}
                    </div>
                    {canEditOrDelete(note) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(note)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit note"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
