'use client'

/**
 * Notes Section Component
 *
 * Displays college notes with textarea input and character counter.
 * Allows users to post new notes (max 2000 characters).
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 13: College Detail Page Layout
 */

import { useEffect, useState } from 'react'
import { Button } from '@pleeno/ui'

interface Note {
  id: string
  content: string
  created_at: string
  user: {
    full_name: string
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

  useEffect(() => {
    fetchNotes()
  }, [collegeId])

  async function fetchNotes() {
    try {
      const response = await fetch(`/api/colleges/${collegeId}/notes`)
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
      const response = await fetch(`/api/colleges/${collegeId}/notes`, {
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
    } catch (error) {
      console.error('Failed to post note:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to post note. Please try again.'
      )
    } finally {
      setIsPosting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
            {noteContent.length}/{MAX_NOTE_LENGTH}
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
              <div className="text-sm whitespace-pre-wrap">{note.content}</div>
              <div className="text-xs text-muted-foreground mt-2">
                {note.user.full_name} • {formatDate(note.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
