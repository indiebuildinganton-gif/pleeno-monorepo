# Story 7-3: PDF Export Functionality - Task 3

**Story**: PDF Export Functionality
**Task**: Add Agency Logo/Branding
**Acceptance Criteria**: AC #2
**Previous Tasks**: Task 1 (API Route), Task 2 (PDF Components) - Should be completed

## User Story Context

**As a** Agency Admin
**I want** to export reports to PDF format with my agency's branding
**So that** I can share professional-looking reports that represent my agency

## Task Description

Implement agency logo upload functionality and integrate logo display in PDF reports. This includes database schema changes, Supabase Storage configuration, upload UI, and logo rendering in PDFReportHeader.

## Subtasks Checklist

- [ ] Extend `agencies` table with `logo_url` field (nullable TEXT)
- [ ] Create Supabase Storage bucket `agency-logos` with public access
- [ ] Create RLS policy for logo uploads: agencies can upload to their own folder
- [ ] Create logo upload functionality in agency settings page:
  - File upload form with preview
  - Upload to Supabase Storage: `agency-logos/{agency_id}/logo.{ext}`
  - Store public URL in agencies.logo_url
- [ ] Validate file type (PNG, JPG, SVG only) and size (max 2MB)
- [ ] In PDF template:
  - Load agency logo from agencies.logo_url
  - Display logo in header (max 150x50px)
  - Fallback to agency name text if no logo
- [ ] Display agency name and contact email below logo
- [ ] Test: Upload logo → Generate PDF → Verify logo appears

## Acceptance Criteria

**AC #2**: And the PDF includes: agency logo/name, report title, generation date, filters applied

## Context & Constraints

### Key Constraints
- **File Size Limits**: Logo uploads max 2MB, validate file types (PNG, JPG, SVG only)
- **Storage Security**: Supabase Storage RLS policy - agencies can only upload to their own folder (agency-logos/{agency_id}/)
- **Error Handling**: Logo load failure must fallback to text agency name

### Relevant Interfaces

**agencies.logo_url**
- Database field: `ALTER TABLE agencies ADD COLUMN logo_url TEXT;`
- Path: `supabase/migrations/002_entities_domain/001_colleges_schema.sql`
- Description: Nullable TEXT field storing Supabase Storage public URL of uploaded agency logo

**Supabase Storage - agency-logos bucket**
- Kind: Cloud Storage
- Signature: `bucket: agency-logos, path: {agency_id}/logo.{ext}, public: true`
- Description: Public storage bucket for agency logos. Path structure: agency-logos/{agency_id}/logo.{png|jpg|svg}

### Dependencies

**Required:**
- Task 2 completed (PDFReportHeader component exists)
- Supabase Storage configured
- Agency settings page location: `apps/agency/app/settings/page.tsx`

### Artifacts & References

**Code References:**
- `packages/ui/src/pdf/PDFReportHeader.tsx` - Update to load and display logo
- `apps/agency/app/settings/page.tsx` - Add logo upload functionality
- `supabase/migrations/002_entities_domain/001_colleges_schema.sql` - Database schema

## Update Manifest

Before starting implementation:
1. Open `.bmad-ephemeral/stories/prompts/7-3/manifest.md`
2. Update Task 2 status to "Completed" with completion date
3. Update Task 3 status to "In Progress" with start date
4. Add implementation notes from Task 2

## Implementation Guidelines

### Step 1: Database Migration

Create migration file: `supabase/migrations/[timestamp]_add_agency_logo.sql`

```sql
-- Add logo_url to agencies table
ALTER TABLE agencies ADD COLUMN logo_url TEXT;

-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: agencies can upload to their own folder
CREATE POLICY "Agencies can upload own logos"
ON storage.objects FOR INSERT
TO authenticated
USING (
  bucket_id = 'agency-logos' AND
  (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid())
);

-- RLS policy: agencies can read own logos
CREATE POLICY "Agencies can read own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agency-logos' AND
  (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid())
);

-- RLS policy: public read access for PDFs
CREATE POLICY "Public read access for agency logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agency-logos');
```

### Step 2: Agency Settings Logo Upload UI

Location: `apps/agency/app/settings/page.tsx`

Features:
- File input with drag-and-drop support
- Image preview before upload
- Validation: PNG/JPG/SVG, max 2MB
- Upload progress indicator
- Success/error messages
- Display current logo if exists
- Option to remove logo

### Step 3: Upload Flow

1. User selects image file
2. Client-side validation (type, size)
3. Upload to Supabase Storage: `agency-logos/{agency_id}/logo.{ext}`
4. Get public URL from Storage response
5. Update `agencies.logo_url` with public URL
6. Show success message and preview

### Step 4: Update PDFReportHeader Component

```tsx
import { Image, Text, View } from '@react-pdf/renderer';

interface PDFReportHeaderProps {
  agency: {
    name: string;
    logo_url?: string;
    contact_email?: string;
  };
  reportTitle: string;
  generatedAt: Date;
}

// In component:
// If logo_url exists and loads:
//   <Image src={agency.logo_url} style={styles.logo} />
// Else fallback:
//   <Text style={styles.agencyName}>{agency.name}</Text>
```

Add error handling for logo load failures using try-catch or error boundary.

## Implementation Notes

### What Was Completed in Previous Tasks
- Task 1: API route for PDF export created
- Task 2: PDF components created (PDFReportHeader ready for logo integration)

### How This Task Builds On Previous Work
- PDFReportHeader component from Task 2 will be updated to display logo
- API route from Task 1 will fetch agency info including logo_url
- Logo upload provides the image that appears in all future PDF exports

### Key Technical Decisions

**Storage Choice**: Supabase Storage vs external CDN
- Using Supabase Storage for simplicity and integration
- RLS policies provide secure access control
- Public bucket allows PDF generation without auth

**Image Format Support**:
- PNG: Best for logos with transparency
- JPG: Good for photos, smaller file size
- SVG: Vector graphics, scales perfectly

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 3 as "Completed" with date
2. Add notes about logo upload implementation and any issues
3. Move to `task-4-prompt.md` to add report metadata and filters display
4. Task 4 will enhance the header with more context information

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Supabase Storage bucket created with correct permissions
- [ ] RLS policy allows agency to upload to own folder
- [ ] RLS policy prevents agency from uploading to other folders
- [ ] Logo upload UI works with drag-and-drop
- [ ] File validation works (type and size)
- [ ] Logo preview shows before upload
- [ ] Upload completes and URL stored in agencies.logo_url
- [ ] PDFReportHeader displays logo when logo_url exists
- [ ] PDFReportHeader shows agency name when no logo
- [ ] Logo displays at correct size (max 150x50px)
- [ ] Full flow: Upload logo → Generate PDF → Logo appears in PDF header
