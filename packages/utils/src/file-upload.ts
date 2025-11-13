/**
 * File Upload Utilities for Supabase Storage
 *
 * Provides utilities for uploading, downloading, and deleting files
 * from Supabase Storage with validation and security checks.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry - Document Management
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { ValidationError } from './errors'

/**
 * Supported MIME types for document uploads
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Document type enum matching database constraint
 */
export type DocumentType = 'offer_letter' | 'passport' | 'visa' | 'other'

/**
 * File upload result
 */
export interface FileUploadResult {
  url: string
  filename: string
  path: string
  size: number
}

/**
 * Validates file type and size
 *
 * @param file - File to validate
 * @throws ValidationError if file is invalid
 */
export function validateFile(file: File): void {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError(
      `Invalid file type. Only PDF and images (JPEG, PNG) are allowed. Received: ${file.type}`
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size must be less than 10MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    )
  }

  // Validate file has a name
  if (!file.name || file.name.trim() === '') {
    throw new ValidationError('File must have a valid name')
  }
}

/**
 * Generates a unique filename with timestamp and random string
 *
 * @param originalFilename - Original filename from upload
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const ext = originalFilename.split('.').pop()
  const baseName = originalFilename.replace(`.${ext}`, '').replace(/[^a-zA-Z0-9-_]/g, '_')
  return `${timestamp}-${randomString}-${baseName}.${ext}`
}

/**
 * Uploads a document to Supabase Storage
 *
 * Storage path pattern: student-documents/{student_id}/{unique_filename}
 *
 * @param supabase - Supabase client instance
 * @param studentId - Student ID
 * @param file - File to upload
 * @param bucket - Storage bucket name (default: 'student-documents')
 * @returns Upload result with public URL and metadata
 * @throws ValidationError if file is invalid
 * @throws Error if upload fails
 */
export async function uploadDocument(
  supabase: SupabaseClient,
  studentId: string,
  file: File,
  bucket: string = 'student-documents'
): Promise<FileUploadResult> {
  // Validate file
  validateFile(file)

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(file.name)
  const path = `${studentId}/${uniqueFilename}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw new Error(`Failed to upload file: ${uploadError.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return {
    url: publicUrl,
    filename: file.name, // Store original filename
    path,
    size: file.size,
  }
}

/**
 * Downloads a document from Supabase Storage
 *
 * @param supabase - Supabase client instance
 * @param filePath - Full path to file in storage
 * @param bucket - Storage bucket name (default: 'student-documents')
 * @returns File blob
 * @throws Error if download fails
 */
export async function downloadDocument(
  supabase: SupabaseClient,
  filePath: string,
  bucket: string = 'student-documents'
): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(filePath)

  if (error) {
    console.error('Storage download error:', error)
    throw new Error(`Failed to download file: ${error.message}`)
  }

  if (!data) {
    throw new Error('File not found')
  }

  return data
}

/**
 * Deletes a document from Supabase Storage
 *
 * @param supabase - Supabase client instance
 * @param filePath - Full path to file in storage
 * @param bucket - Storage bucket name (default: 'student-documents')
 * @throws Error if deletion fails
 */
export async function deleteDocument(
  supabase: SupabaseClient,
  filePath: string,
  bucket: string = 'student-documents'
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) {
    console.error('Storage delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Gets the public URL for a document without downloading it
 *
 * @param supabase - Supabase client instance
 * @param filePath - Full path to file in storage
 * @param bucket - Storage bucket name (default: 'student-documents')
 * @returns Public URL
 */
export function getDocumentUrl(
  supabase: SupabaseClient,
  filePath: string,
  bucket: string = 'student-documents'
): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return publicUrl
}
