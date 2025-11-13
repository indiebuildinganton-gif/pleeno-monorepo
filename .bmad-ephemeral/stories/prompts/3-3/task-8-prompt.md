# Story 3-3: Student-College Enrollment Linking
## Task 8: Document Viewer Component

**Previous Tasks:**
- Tasks 1-7: Database, APIs, Payment Plan, Student/College Pages - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Create a reusable DocumentViewer component for viewing offer letters with PDF preview, image display, maximize/fullscreen capability, and download functionality.

## Subtasks Checklist

- [ ] Create DocumentViewer component with modal/dialog UI
- [ ] Support PDF preview (using react-pdf or iframe)
- [ ] Support image display (JPEG, PNG)
- [ ] Add maximize/fullscreen toggle button
- [ ] Add download button
- [ ] Add close button
- [ ] Handle loading states during document fetch
- [ ] Handle errors (document not found, load failure)

## Acceptance Criteria

This task addresses:
- **AC2**: Enrollment Display and Navigation (view/maximize offer letters)
- **AC5**: Document Management (view/download/maximize documents)

## Key Constraints

1. **Multi-Zone Architecture**: Shared component in packages/ui/ for use across apps
2. **State Management**: Use Zustand or React state for document viewer UI state
3. **Document Formats**: Support PDF and image (JPEG, PNG) rendering

## Component to Implement

### DocumentViewer
```typescript
// packages/ui/src/components/enrollments/DocumentViewer.tsx
interface DocumentViewerProps {
  documentUrl: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}
```
**Notes**: Reusable document viewer for offer letters with PDF preview and maximize/fullscreen.

## Implementation Location

```
packages/ui/src/components/enrollments/DocumentViewer.tsx  # NEW: Document viewer component
```

## Dependencies

- Shadcn UI Dialog component for modal
- react-pdf library (optional, for PDF preview)
- Task 4: Offer letter download endpoint

## Artifacts & References

**Code References:**
- Document viewer component pattern from Story 3.2
- Shadcn Dialog component

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 122-133)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 7 as "Completed" with today's date
2. Add notes about Task 7 (enrolled students section on college page working)
3. Mark Task 8 as "In Progress" with today's date

---

## Implementation Instructions

1. **Create DocumentViewer component**:
   - Use Shadcn Dialog for modal container
   - Accept documentUrl, filename, isOpen, onClose props
   - Detect file type from filename extension
2. **Implement PDF rendering**:
   - Option 1: Use react-pdf library for rich preview
   - Option 2: Use iframe with PDF URL for simpler approach
   - Add pagination controls if using react-pdf
3. **Implement image rendering**:
   - Use img tag for JPEG/PNG
   - Add zoom controls (optional)
4. **Add controls**:
   - Maximize/fullscreen toggle button
   - Download button (link to API endpoint)
   - Close button
5. **Handle loading and errors**:
   - Show spinner while document loads
   - Error message if document fails to load
   - Fallback for unsupported formats
6. **Style component**:
   - Full-screen overlay option
   - Responsive design
   - Consistent with app theme
7. **Update EnrollmentsSection components** (Tasks 6 & 7):
   - Replace "View Offer Letter" links with DocumentViewer integration
   - Open DocumentViewer modal on click

### Testing

- Test PDF document viewing
- Test image document viewing (JPEG, PNG)
- Test maximize/fullscreen toggle
- Test download button
- Test close button and ESC key
- Test loading state
- Test error state (invalid document URL)
- Test responsive design on mobile

---

## Next Steps

After completing Task 8:
1. ✅ Update manifest.md (mark Task 8 complete, add notes)
2. 📄 Move to `task-9-prompt.md` - Enrollment Status Management UI
3. 🔄 Continue sequential execution
