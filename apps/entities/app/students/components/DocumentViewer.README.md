# DocumentViewer Component

## Overview

The `DocumentViewer` component provides comprehensive document management capabilities for student profiles, allowing users to upload, view, download, and delete documents with a modern, user-friendly interface.

**Location:** `apps/entities/app/students/components/DocumentViewer.tsx`

**Story:** Epic 3: Entities Domain → Story 3.2: Student Registry → Task 14: Document Viewer Component

## Features

### ✅ Acceptance Criteria (AC 7: Document Management)

- [x] **Document List Display** - Shows all uploaded documents with file icons, names, types, and metadata
- [x] **File Upload** - Drag & drop or click-to-browse file upload with real-time validation
- [x] **File Validation** - Validates file type (PDF, JPEG, PNG) and size (max 10MB)
- [x] **PDF Preview** - Opens PDFs in a modal with fullscreen/maximize support
- [x] **Image Preview** - Opens images in a modal with fullscreen/maximize support
- [x] **Maximize/Fullscreen** - Toggle fullscreen mode for document preview
- [x] **Download** - Download individual documents to local device
- [x] **Delete with Confirmation** - Delete documents with inline confirmation dialog
- [x] **Progress Indicators** - Shows upload progress with percentage display

## Usage

### Basic Usage

```tsx
import { DocumentViewer } from '@/students/components/DocumentViewer'

export default function StudentDetailPage() {
  return (
    <div>
      {/* Other student information */}

      <DocumentViewer studentId="student-uuid-here" />
    </div>
  )
}
```

### With Initial Documents

```tsx
import { DocumentViewer } from '@/students/components/DocumentViewer'

export default function StudentDetailPage() {
  const initialDocuments = [
    {
      id: "doc-1",
      student_id: "student-1",
      document_type: "passport",
      file_name: "passport.pdf",
      file_path: "student-1/12345-abcdef-passport.pdf",
      file_size: 1024000,
      url: "https://example.com/...",
      uploaded_by: "user-1",
      uploaded_at: "2024-01-15T10:30:00Z"
    }
  ]

  return (
    <DocumentViewer
      studentId="student-uuid-here"
      initialDocuments={initialDocuments}
    />
  )
}
```

## Component Props

### `DocumentViewerProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `studentId` | `string` | Yes | - | The UUID of the student for document operations |
| `initialDocuments` | `Document[]` | No | `[]` | Pre-loaded documents to display initially |

### `Document` Interface

```typescript
interface Document {
  id: string                    // Document UUID
  student_id: string           // Student UUID
  document_type: DocumentType  // 'offer_letter' | 'passport' | 'visa' | 'other'
  file_name: string            // Original filename
  file_path: string            // Storage path
  file_size: number            // Size in bytes
  url: string                  // Public URL for access
  uploaded_by: string          // User UUID who uploaded
  uploaded_at: string          // ISO timestamp
  uploader?: {                 // Optional uploader info
    full_name: string
    email: string
  }
}
```

## Document Types

The component supports four document types:

1. **Offer Letter** (`offer_letter`) - College admission offer letters
2. **Passport** (`passport`) - Student passport scans
3. **Visa** (`visa`) - Visa documents and stamps
4. **Other** (`other`) - Any other supporting documents

## File Validation Rules

### Supported File Types
- PDF: `application/pdf`
- JPEG: `image/jpeg`, `image/jpg`
- PNG: `image/png`

### Size Limits
- **Maximum:** 10 MB per file
- Files exceeding this limit will be rejected with an error message

### Validation Errors
- **Invalid Type:** "Only PDF and image files (JPEG, PNG) are allowed"
- **Too Large:** "File size must be less than 10MB. Your file is X.XX MB"

## API Integration

The component integrates with the following API endpoints:

### Upload Document
```
POST /api/students/{studentId}/documents
Content-Type: multipart/form-data

Body:
  - file: File (PDF or image, max 10MB)
  - document_type: 'offer_letter' | 'passport' | 'visa' | 'other'

Response: {
  success: true,
  data: Document
}
```

### List Documents
```
GET /api/students/{studentId}/documents

Response: {
  success: true,
  data: Document[]
}
```

### Delete Document
```
DELETE /api/students/{studentId}/documents/{documentId}

Response: {
  success: true
}
```

## User Interactions

### Uploading Documents

1. **Drag & Drop**
   - Drag a file over the upload zone
   - Zone highlights in blue
   - Drop to select file
   - Select document type from dropdown
   - Click "Upload Document"

2. **Click to Browse**
   - Click "Select File" button
   - Choose file from file picker
   - File appears in upload zone
   - Select document type
   - Click "Upload Document"

### Viewing Documents

1. Click the eye icon (👁️) next to any document
2. Document opens in a modal preview
3. Use toolbar buttons to:
   - Download document
   - Toggle fullscreen mode
   - Close preview

### Downloading Documents

- Click the download icon (⬇️) next to any document
- OR click download in preview modal
- File downloads to browser's default location

### Deleting Documents

1. Click the trash icon (🗑️) next to a document
2. Inline confirmation appears with warning
3. Click "Delete" to confirm or "Cancel" to abort
4. Document removed from list on success

## Component States

### Loading States
- **Initial Load:** Spinner shown while fetching documents
- **Uploading:** Progress bar with percentage (0-100%)
- **Empty State:** Shows icon and message when no documents exist

### Error States
- **Upload Failed:** Toast notification with error details
- **Download Failed:** Toast notification
- **Delete Failed:** Toast notification
- **Validation Error:** Toast with specific validation message

### Success States
- **Upload Complete:** Toast confirmation with filename
- **Delete Complete:** Toast confirmation
- **Download Started:** Toast notification

## Styling & Theming

The component uses Tailwind CSS utility classes and follows the application's design system:

- **Card Layout:** White background with border and shadow
- **Hover Effects:** Documents highlight on hover
- **Drag Zones:** Blue highlight when dragging files
- **Colors:**
  - Primary actions: Blue
  - Destructive actions: Red
  - Muted text: Gray
  - Success: Green

## Dependencies

### Internal Dependencies
```typescript
import { DocumentViewer as PreviewModal } from '@pleeno/ui'
import { Button, Card, Select, Label, useToast } from '@pleeno/ui'
import { cn } from '@pleeno/ui/lib/utils'
```

### External Dependencies
```typescript
import { FileText, Upload, Download, Trash2, Eye, Loader2, X, AlertCircle } from 'lucide-react'
```

## Security & Authorization

### RLS (Row-Level Security)
- All API calls enforce agency-level data isolation
- Students and documents are scoped to user's agency
- Unauthorized access attempts return 403 Forbidden

### File Security
- Files stored in Supabase Storage with RLS policies
- Public URLs generated but access controlled by database policies
- Unique filenames prevent conflicts and overwrites

### Audit Logging
- Document uploads logged to `audit_logs` table
- Deletions logged before file removal
- Includes user_id, timestamp, and document metadata

## Testing Checklist

### Manual Testing

- [ ] **Upload PDF** - Upload a PDF document successfully
- [ ] **Upload JPEG** - Upload a JPEG image successfully
- [ ] **Upload PNG** - Upload a PNG image successfully
- [ ] **Reject Invalid Type** - Try uploading .docx or .txt (should fail)
- [ ] **Reject Large File** - Try uploading file > 10MB (should fail)
- [ ] **Drag & Drop** - Drag and drop a valid file
- [ ] **Preview PDF** - Click eye icon on PDF, verify preview works
- [ ] **Preview Image** - Click eye icon on image, verify preview works
- [ ] **Fullscreen Mode** - Toggle fullscreen in preview modal
- [ ] **Download** - Download a document successfully
- [ ] **Delete** - Delete a document with confirmation
- [ ] **Cancel Delete** - Click delete, then cancel
- [ ] **Upload Progress** - Verify progress bar shows during upload
- [ ] **Empty State** - Verify empty state shows when no documents
- [ ] **Loading State** - Verify spinner shows during fetch
- [ ] **Document Types** - Test all 4 document type selections

### Edge Cases

- [ ] Upload file with special characters in name
- [ ] Upload file with very long filename
- [ ] Upload multiple files rapidly
- [ ] Delete while upload in progress
- [ ] Preview while another preview open
- [ ] Network error during upload
- [ ] Network error during delete

## Troubleshooting

### Common Issues

**Issue:** Upload fails with "Failed to upload file"
**Solution:**
- Check file size is under 10MB
- Verify file type is PDF, JPEG, or PNG
- Check network connection
- Verify user has permission to upload

**Issue:** Preview shows "Failed to load document"
**Solution:**
- File may have been deleted from storage
- Check browser console for errors
- Try downloading instead

**Issue:** Delete confirmation not appearing
**Solution:**
- Check that `deleteConfirmId` state is being set
- Verify the trash icon onClick handler is working

**Issue:** Drag & drop not working
**Solution:**
- Ensure browser supports drag & drop API
- Check that drag event handlers are properly bound
- Verify file type is in accept list

## Performance Considerations

### Optimizations
- Documents list fetched once on mount
- Preview modal lazy-loaded on first use
- Upload progress simulated for better UX
- File validation happens client-side before upload

### Future Enhancements
- [ ] Multiple file upload at once
- [ ] Document thumbnails for images
- [ ] Search/filter documents by type or name
- [ ] Bulk delete multiple documents
- [ ] Document versioning
- [ ] OCR text extraction from PDFs
- [ ] Document expiration dates

## Related Components

- `DocumentViewer` (from `@pleeno/ui`) - Preview modal component
- `StudentForm` - Main student creation/edit form
- `EnrollmentsSection` - Student enrollment management

## Related Files

- **API Routes:**
  - `apps/entities/app/api/students/[id]/documents/route.ts`
  - `apps/entities/app/api/students/[id]/documents/[doc_id]/route.ts`
- **Utils:**
  - `packages/utils/src/file-upload.ts`
  - `packages/utils/src/errors.ts`
- **UI Components:**
  - `packages/ui/src/components/enrollments/DocumentViewer.tsx`
  - `packages/ui/src/components/ui/dialog.tsx`

## Architecture References

See `docs/architecture.md` for:
- File Upload Pattern (lines 1199-1254)
- Supabase Storage Configuration (lines 1645-1691)
- Student Documents Schema (lines 1604-1615)

## Changelog

### v1.0.0 (2025-01-14)
- Initial implementation
- Upload, preview, download, delete functionality
- Drag & drop support
- File validation
- Progress indicators
- Delete confirmation
- Integration with student detail page
