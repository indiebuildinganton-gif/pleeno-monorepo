import { z } from 'zod'

/**
 * Zod schema for creating a new college note
 */
export const NoteCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note content must be less than 2000 characters')
    .trim(),
})

export type NoteCreate = z.infer<typeof NoteCreateSchema>

/**
 * Zod schema for updating a note
 */
export const NoteUpdateSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content cannot be empty')
    .max(2000, 'Note content must be less than 2000 characters')
    .trim()
    .optional(),
})

export type NoteUpdate = z.infer<typeof NoteUpdateSchema>

/**
 * Note response type (matches database schema)
 */
export const NoteSchema = z.object({
  id: z.string().uuid(),
  college_id: z.string().uuid(),
  user_id: z.string().uuid(),
  agency_id: z.string().uuid(),
  content: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Note = z.infer<typeof NoteSchema>
