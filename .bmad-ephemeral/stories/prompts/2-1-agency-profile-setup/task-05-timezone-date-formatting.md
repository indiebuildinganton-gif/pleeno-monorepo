# Story 2-1: Agency Profile Setup - Task 5

## Story Context

**As an** Agency Admin,
**I want** to configure my agency's profile with basic information,
**So that** my agency identity is established in the system and my team knows which agency they're working in.

---

## Task 5: Implement Timezone-Aware Date Formatting

### Previous Tasks Completed
✅ Task 1: Created Agency Validation Schema
✅ Task 2: Implemented API Route for Agency Updates
✅ Task 3: Created Agency Settings Page and Form
✅ Task 4: Displayed Agency Name in Application Header

### Description
Create utility functions for timezone-aware date formatting so all timestamps in the application display in the agency's configured timezone. Database stores dates in UTC, but displays them in the agency's local timezone.

### Subtasks
- [ ] Create `packages/utils/src/date-helpers.ts`
- [ ] Implement `formatDateInAgencyTimezone()` using date-fns-tz
- [ ] Use agency timezone from user session context
- [ ] Create helper for relative timestamps (e.g., "2 hours ago")
- [ ] Export utilities for use across zones
- [ ] Write unit tests for timezone conversion

### Acceptance Criteria
This task supports **AC #4**: All timestamps display in the agency's configured timezone

### Key Constraints
- **Timezone handling**: Store all timestamps in UTC, display in agency timezone
- **Testing**: Write unit tests for utilities
- **Performance**: Cache timezone data to avoid repeated lookups

### Dependencies
- date-fns v4.1.0
- date-fns-tz (latest)

### Reference Documents
- [Architecture Doc - Date Helpers Pattern](docs/architecture.md#implementation-patterns---date-helpers)

---

## 📋 Update Implementation Manifest

1. Read `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`
2. Update Task 4: Set status to "Completed" with today's date
3. Update Task 5: Set status to "In Progress" with today's date
4. Add notes about header implementation

---

## Implementation Instructions

1. **Update manifest** as described above
2. **Create** `packages/utils/src/date-helpers.ts`
3. **Implement** timezone conversion functions
4. **Create** helper for relative timestamps
5. **Write** unit tests
6. **Export** from packages/utils/src/index.ts

### Expected File Structure
```
packages/utils/src/
├── date-helpers.ts       # New file
├── date-helpers.test.ts  # New test file
└── index.ts              # Update exports
```

### Implementation Pattern

```typescript
// packages/utils/src/date-helpers.ts
import { format, formatDistanceToNow } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

/**
 * Format a date in the agency's timezone
 * @param date - Date to format (UTC)
 * @param timezone - IANA timezone (e.g., 'Australia/Brisbane')
 * @param formatString - date-fns format string (default: 'PPpp')
 * @returns Formatted date string in agency timezone
 */
export function formatDateInAgencyTimezone(
  date: Date | string,
  timezone: string,
  formatString: string = 'PPpp'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const zonedDate = utcToZonedTime(dateObj, timezone)
  return format(zonedDate, formatString)
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param date - Date to compare (UTC)
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Convert local date to UTC for storage
 * @param date - Local date
 * @param timezone - IANA timezone
 * @returns UTC Date
 */
export function convertToUTC(date: Date, timezone: string): Date {
  return zonedTimeToUtc(date, timezone)
}
```

### Unit Tests Pattern

```typescript
// packages/utils/src/date-helpers.test.ts
import { describe, it, expect } from 'vitest'
import { formatDateInAgencyTimezone, getRelativeTime } from './date-helpers'

describe('formatDateInAgencyTimezone', () => {
  it('converts UTC to Brisbane timezone', () => {
    const utcDate = new Date('2024-01-01T00:00:00Z')
    const result = formatDateInAgencyTimezone(utcDate, 'Australia/Brisbane', 'yyyy-MM-dd HH:mm')
    expect(result).toBe('2024-01-01 10:00') // Brisbane is UTC+10
  })

  it('handles string dates', () => {
    const result = formatDateInAgencyTimezone('2024-01-01T00:00:00Z', 'Australia/Brisbane', 'yyyy-MM-dd')
    expect(result).toBe('2024-01-01')
  })
})

describe('getRelativeTime', () => {
  it('returns relative time string', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const result = getRelativeTime(twoHoursAgo)
    expect(result).toMatch(/2 hours ago/)
  })
})
```

---

## After Completion

1. ✅ Update manifest.md: Mark Task 5 completed
2. 🔄 Move to: `task-06-role-based-access-control.md`

---

## Testing Checklist

Before marking complete:
- [ ] date-helpers.ts created with all functions
- [ ] formatDateInAgencyTimezone() works correctly
- [ ] getRelativeTime() works correctly
- [ ] Unit tests written and passing
- [ ] Functions exported from packages/utils
- [ ] Timezone conversion tested with multiple timezones
- [ ] Manifest updated with Task 5 progress
