# Story 2-1: Agency Profile Setup - Task 3

## Story Context

**As an** Agency Admin,
**I want** to configure my agency's profile with basic information,
**So that** my agency identity is established in the system and my team knows which agency they're working in.

---

## Task 3: Create Agency Settings Page and Form

### Previous Tasks Completed
✅ Task 1: Created Agency Validation Schema
✅ Task 2: Implemented API Route for Agency Updates

### Description
Create the frontend settings page where agency admins can view and edit their agency's profile information. This uses the API from Task 2 and the validation schema from Task 1.

### Subtasks
- [ ] Create `apps/agency/app/settings/page.tsx` with agency settings form
- [ ] Implement form fields: name, contact_email, contact_phone, currency, timezone
- [ ] Add validation using React Hook Form + Zod schema
- [ ] Display current agency values pre-filled in form
- [ ] Add Save button with loading state
- [ ] Handle form submission to API endpoint (Task 2)
- [ ] Display success/error messages

### Acceptance Criteria
This task supports:
- **AC #1**: Agency Admin can view and edit agency information
- **AC #2**: Changes are saved with proper validation

### Key Constraints
- **Form validation**: Use React Hook Form + Zod for all forms
- **Project structure**: Create in apps/agency zone
- **Error handling**: Display user-friendly error messages
- **Loading states**: Show loading during API calls

### Dependencies
- React Hook Form v7.66.0
- @hookform/resolvers
- AgencyUpdateSchema from Task 1
- API endpoint from Task 2 (`PATCH /api/agencies/[id]`)

### Reference Documents
- [Architecture Doc - Agency Zone](docs/architecture.md#project-structure---agency-zone)
- [PRD - Agency Management Features](docs/PRD.md#data-centralization-foundation)

---

## 📋 Update Implementation Manifest

1. Read `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`
2. Update Task 2: Set status to "Completed" with today's date
3. Update Task 3: Set status to "In Progress" with today's date
4. Add notes about API endpoint completion

---

## Implementation Instructions

1. **Update manifest** as described above
2. **Create** `apps/agency/app/settings/page.tsx`
3. **Implement form** with React Hook Form:
   - Fetch current agency data on mount
   - Pre-fill form with current values
   - Validate using AgencyUpdateSchema
   - Submit to API endpoint
   - Handle success/error states
4. **Style** using Tailwind CSS and shared UI components
5. **Test** form validation and submission

### Expected File Structure
```
apps/agency/app/settings/
└── page.tsx              # New file
```

### Implementation Pattern

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AgencyUpdateSchema, type AgencyUpdate } from '@pleeno/validations'
import { useState, useEffect } from 'react'

export default function AgencySettingsPage() {
  const [loading, setLoading] = useState(false)
  const [agencyId, setAgencyId] = useState<string>()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AgencyUpdate>({
    resolver: zodResolver(AgencyUpdateSchema)
  })

  // Fetch current agency data
  useEffect(() => {
    async function loadAgency() {
      // Get user's agency_id from session
      // Fetch agency data
      // Pre-fill form with reset(data)
    }
    loadAgency()
  }, [reset])

  const onSubmit = async (data: AgencyUpdate) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/agencies/${agencyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        // Show success message
      } else {
        // Show error message
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Agency Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        {/* Form fields */}
        <div>
          <label>Agency Name</label>
          <input {...register('name')} />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}
        </div>

        {/* More fields... */}

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
```

---

## After Completion

1. ✅ Update manifest.md: Mark Task 3 completed
2. 🔄 Move to: `task-04-display-agency-name-header.md`

---

## Testing Checklist

Before marking complete:
- [ ] Settings page created at correct path
- [ ] Form fields for all agency properties
- [ ] Validation works (required fields, email format)
- [ ] Current values pre-filled
- [ ] Save button with loading state
- [ ] Success message on save
- [ ] Error messages display properly
- [ ] Manifest updated with Task 3 progress
