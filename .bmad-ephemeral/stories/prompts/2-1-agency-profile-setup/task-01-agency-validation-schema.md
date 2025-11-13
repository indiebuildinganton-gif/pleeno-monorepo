# Story 2-1: Agency Profile Setup - Task 1

## Story Context

**As an** Agency Admin,
**I want** to configure my agency's profile with basic information,
**So that** my agency identity is established in the system and my team knows which agency they're working in.

---

## Task 1: Create Agency Validation Schema

### Description
Create the Zod validation schema for agency profile updates. This schema will be used by both the frontend form and the backend API to ensure data consistency and validation.

### Subtasks
- [ ] Create `packages/validations/src/agency.schema.ts`
- [ ] Define `AgencyUpdateSchema` with required fields (name, contact_email)
- [ ] Validate currency (AUD, USD, EUR, GBP, NZD, CAD)
- [ ] Validate timezone (use valid IANA timezone list)
- [ ] Validate email format
- [ ] Validate phone number format (optional)
- [ ] Export TypeScript types from schema

### Acceptance Criteria
This task supports **AC #2**: Changes are saved to the database with proper validation

### Key Constraints
- **Validation**: Use Zod for all schema validation
- **Project structure**: Create in shared `packages/validations` for reuse across frontend and backend
- **Timezone validation**: Must use valid IANA timezone names
- **Currency validation**: Limit to supported currencies (AUD, USD, EUR, GBP, NZD, CAD)

### Interface to Implement

```typescript
// packages/validations/src/agency.schema.ts

import { z } from 'zod'

export const AgencyUpdateSchema = z.object({
  name: z.string().min(1, "Agency name is required"),
  contact_email: z.string().email("Invalid email format"),
  contact_phone: z.string().optional(),
  currency: z.enum(["AUD", "USD", "EUR", "GBP", "NZD", "CAD"]),
  timezone: z.string() // Valid IANA timezone
})

export type AgencyUpdate = z.infer<typeof AgencyUpdateSchema>
```

### Dependencies
- `zod` v4.x - Already in package.json from Story 1.1

### Reference Documents
- [Architecture Doc - Data Architecture - Agency Domain](docs/architecture.md#data-architecture---agency-domain)
- [Story Context](../.bmad-ephemeral/stories/2-1-agency-profile-setup.context.xml)

---

## 📋 CRITICAL: Create Implementation Manifest

**Before starting development**, create a manifest file to track progress across all 7 tasks.

### Create File: `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`

```markdown
# Story 2-1 Implementation Manifest

**Story**: Agency Profile Setup
**Status**: In Progress
**Started**: [Today's Date]

## Task Progress

### Task 1: Create Agency Validation Schema
- Status: In Progress
- Started: [Today's Date]
- Completed:
- Notes:

### Task 2: Implement API Route for Agency Updates
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Create Agency Settings Page and Form
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Display Agency Name in Application Header
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Implement Timezone-Aware Date Formatting
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Add Role-Based Access Control
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Write Tests for Agency Settings Feature
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through the implementation]
```

---

## Implementation Instructions

1. **First**: Create the manifest file as described above
2. **Verify** project structure exists from Story 1.1
3. **Create** `packages/validations/src/agency.schema.ts`
4. **Test** the schema imports correctly

---

## After Completion

1. ✅ Update manifest.md: Mark Task 1 completed with date
2. 🔄 Move to: `task-02-api-route-agency-updates.md`
