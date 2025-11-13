# Story 2-1: Agency Profile Setup - Task 4

## Story Context

**As an** Agency Admin,
**I want** to configure my agency's profile with basic information,
**So that** my agency identity is established in the system and my team knows which agency they're working in.

---

## Task 4: Display Agency Name in Application Header

### Previous Tasks Completed
✅ Task 1: Created Agency Validation Schema
✅ Task 2: Implemented API Route for Agency Updates
✅ Task 3: Created Agency Settings Page and Form

### Description
Display the agency name in the application header so users always know which agency they're working in. This provides context and confirms the agency identity across all pages.

### Subtasks
- [ ] Update `apps/shell/app/layout.tsx` root layout
- [ ] Fetch current agency data from Supabase
- [ ] Create Header component displaying agency name
- [ ] Use shared UI component from packages/ui
- [ ] Handle loading and error states

### Acceptance Criteria
This task supports **AC #3**: Agency name appears in the application header/navigation

### Key Constraints
- **Project structure**: Update shell app layout (root)
- **Performance**: Cache agency data to avoid repeated fetches
- **Error handling**: Gracefully handle missing agency data

### Dependencies
- Supabase client for fetching agency data
- Shared UI components from packages/ui

### Reference Documents
- [Architecture Doc - Shell Zone](docs/architecture.md#project-structure)
- [PRD - Data Centralization](docs/PRD.md)

---

## 📋 Update Implementation Manifest

1. Read `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`
2. Update Task 3: Set status to "Completed" with today's date
3. Update Task 4: Set status to "In Progress" with today's date
4. Add notes about settings page completion

---

## Implementation Instructions

1. **Update manifest** as described above
2. **Update** `apps/shell/app/layout.tsx` to include Header component
3. **Fetch** agency data using Supabase
4. **Display** agency name in header
5. **Handle** loading and error states gracefully
6. **Test** that agency name appears on all pages

### Expected File Changes
```
apps/shell/app/
├── layout.tsx            # Update this file
└── components/
    └── Header.tsx        # Create new component
```

### Implementation Pattern

```typescript
// apps/shell/app/components/Header.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const [agencyName, setAgencyName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAgency() {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's agency_id
        const { data: userData } = await supabase
          .from('users')
          .select('agency_id')
          .eq('id', user.id)
          .single()

        if (!userData?.agency_id) return

        // Get agency name
        const { data: agency } = await supabase
          .from('agencies')
          .select('name')
          .eq('id', userData.agency_id)
          .single()

        if (agency) {
          setAgencyName(agency.name)
        }
      } catch (error) {
        console.error('Failed to load agency:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAgency()
  }, [])

  if (loading) {
    return <div className="h-16 bg-gray-100 animate-pulse" />
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{agencyName || 'Pleeno'}</h1>
        </div>
        {/* Navigation, user menu, etc. */}
      </div>
    </header>
  )
}
```

```typescript
// apps/shell/app/layout.tsx
import { Header } from './components/Header'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

---

## After Completion

1. ✅ Update manifest.md: Mark Task 4 completed
2. 🔄 Move to: `task-05-timezone-date-formatting.md`

---

## Testing Checklist

Before marking complete:
- [ ] Header component created
- [ ] Root layout updated to include Header
- [ ] Agency name fetches and displays correctly
- [ ] Loading state handled gracefully
- [ ] Error states handled (no crash if agency missing)
- [ ] Header appears on all pages
- [ ] Manifest updated with Task 4 progress
