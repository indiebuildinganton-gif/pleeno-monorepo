# Task 12: Activity Feed UI

## Context
Story 3.2: Student Registry - Timeline showing all student changes

## Acceptance Criteria Coverage
- AC 5: Activity Feed

## Task Description
Create activity feed component showing chronological changes with filters and search.

## Subtasks
1. Create Activity panel component for right side
2. Add refresh icon
3. Add time period filter dropdown
4. Add search activity input box
5. Display activity feed showing Updates and Notes
6. Format field changes with old → new values
7. Show event type labels (Update, Note)
8. Display relative timestamps
9. Implement auto-refresh (optional)

## Technical Requirements
- Location: `apps/entities/app/students/components/`
- Files to create:
  - `ActivityFeed.tsx` (Client Component)
- Use TanStack Query with polling for auto-refresh
- Use Shadcn Select for time period filter
- Use Shadcn Input for search

## UI Layout
```
Activity Feed [🔄]
[Time Period ▾] [Search...]

┌─────────────────────────────────┐
│ UPDATE                          │
│ Visa Status: In Process → Approved
│ 4 days ago                      │
├─────────────────────────────────┤
│ NOTE                            │
│ Added note: "Called student..." │
│ 1 week ago                      │
└─────────────────────────────────┘
```

## Activity Entry Types
- Update: Field changes (show old → new)
- Note: Note additions
- Enrollment: College/Branch changes
- Email: Email updates

## Time Period Options
- Last 24 hours
- Last 7 days
- Last 30 days
- Last 90 days
- All time

## Constraints
- Right side panel layout
- Real-time updates (polling or websocket)
- Filter by time period
- Search functionality
- Old → new value formatting
- Relative timestamps

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 5, lines 44-50)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Panel displays on right side
- [ ] Refresh icon working
- [ ] Time period filter functional
- [ ] Search working
- [ ] Activity entries formatted correctly
- [ ] Old → new values shown
- [ ] Event type labels displayed
- [ ] Timestamps relative
- [ ] Auto-refresh working (optional)
