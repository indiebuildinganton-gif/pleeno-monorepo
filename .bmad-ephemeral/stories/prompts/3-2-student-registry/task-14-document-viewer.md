# Task 14: Document Viewer Component

## Context
Story 3.2: Student Registry - Document management UI for viewing/downloading files

## Acceptance Criteria Coverage
- AC 7: Document Management

## Task Description
Create document viewer component for displaying, downloading, and managing student documents.

## Subtasks
1. Create document list component
2. Add file upload button
3. Implement document download
4. Create PDF preview with maximize/fullscreen option
5. Support image preview
6. Add delete document functionality

## Technical Requirements
- Location: `apps/entities/app/students/components/`
- Files to create:
  - `DocumentViewer.tsx` (Client Component)
- Use Shadcn Dialog for preview modal
- Use @react-pdf/renderer for PDF preview (or iframe)
- Support PDF, JPEG, PNG formats

## UI Layout
```
Documents:
┌─────────────────────────────────┐
│ [📄] offer-letter.pdf           │
│      [View] [Download] [Delete] │
├─────────────────────────────────┤
│ [📄] passport.jpg               │
│      [View] [Download] [Delete] │
└─────────────────────────────────┘
[+ Upload Document]
```

## Document Preview Modal
- Full-screen option
- Zoom controls for PDF
- Navigation for multi-page PDFs
- Close button
- Download from preview

## Document Types
- offer_letter (PDF)
- passport (image)
- visa (image/PDF)
- other (any supported format)

## File Upload
- Drag & drop support
- File type validation (PDF, JPEG, PNG)
- File size limit (10MB)
- Progress indicator
- Success/error feedback

## Constraints
- Max file size: 10MB
- Supported formats: PDF, JPEG, PNG
- Preview in modal
- Fullscreen/maximize option
- Download functionality
- Delete with confirmation

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 7, lines 63-67)
- Architecture: `docs/architecture.md` (File Upload Pattern)

## Definition of Done
- [ ] Document list displayed
- [ ] Upload button working
- [ ] File validation functional
- [ ] PDF preview working
- [ ] Image preview working
- [ ] Maximize/fullscreen working
- [ ] Download working
- [ ] Delete with confirmation working
- [ ] Progress indicators shown
