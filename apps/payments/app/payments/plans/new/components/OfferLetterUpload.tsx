'use client'

import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { Button, Label } from '@pleeno/ui'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'

/**
 * OfferLetterUpload Component Props
 */
export interface OfferLetterUploadProps {
  /**
   * Callback when a file is selected
   */
  onFileSelect: (file: File | null) => void
  /**
   * Currently selected file
   */
  value?: File | null
  /**
   * Error message to display
   */
  error?: string
  /**
   * Whether the upload is disabled
   */
  disabled?: boolean
}

/**
 * OfferLetterUpload Component
 *
 * File upload component for offer letters with:
 * - Drag and drop support
 * - Click to browse file selector
 * - Client-side validation (file type and size)
 * - Preview thumbnail for images
 * - File name display for PDFs
 * - Remove file button
 *
 * Validation Rules:
 * - Allowed file types: PDF, JPEG, PNG
 * - Maximum file size: 10MB
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 5: Payment Plan Creation Integration
 *
 * @param onFileSelect - Callback when file is selected/removed
 * @param value - Currently selected file
 * @param error - Validation error message
 * @param disabled - Whether the upload is disabled
 */
export function OfferLetterUpload({
  onFileSelect,
  value,
  error,
  disabled = false,
}: OfferLetterUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Maximum file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024
  // Allowed file types
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
  const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

  /**
   * Validates the selected file
   * Checks file type and size
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF, JPEG, or PNG file.'
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB. Please upload a smaller file.'
    }

    return null
  }

  /**
   * Handles file selection
   */
  const handleFileChange = (file: File | null) => {
    if (!file) {
      onFileSelect(null)
      setPreviewUrl(null)
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      alert(validationError)
      return
    }

    onFileSelect(file)

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  /**
   * Handles file input change event
   */
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
  }

  /**
   * Handles drag over event
   */
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  /**
   * Handles drag leave event
   */
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  /**
   * Handles drop event
   */
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0] || null
    handleFileChange(file)
  }

  /**
   * Opens file browser
   */
  const openFileBrowser = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  /**
   * Removes the selected file
   */
  const removeFile = () => {
    handleFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Gets file icon based on type
   */
  const getFileIcon = () => {
    if (!value) return null
    return value.type === 'application/pdf' ? (
      <FileText className="h-8 w-8 text-red-500" />
    ) : (
      <ImageIcon className="h-8 w-8 text-blue-500" />
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="offer_letter">Offer Letter (Optional)</Label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        id="offer_letter"
        className="hidden"
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={onInputChange}
        disabled={disabled}
      />

      {/* Upload area */}
      {!value ? (
        <div
          className={`
            relative rounded-lg border-2 border-dashed p-6 transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary'}
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={openFileBrowser}
        >
          <div className="flex flex-col items-center space-y-3 text-center">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {isDragging ? 'Drop file here' : 'Drop file here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPEG, or PNG (max 10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        // File preview
        <div className="rounded-lg border border-input bg-background p-4">
          <div className="flex items-center space-x-4">
            {/* File icon or image preview */}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                {getFileIcon()}
              </div>
            )}

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              disabled={disabled}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Upload the student's official offer letter (optional). You can add it later if needed.
      </p>
    </div>
  )
}
