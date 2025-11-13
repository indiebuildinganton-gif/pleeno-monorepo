# Story 3-1: College Registry - Task 17
## Create Activity Feed Component

**Task 17 of 21**: Frontend - Activity timeline with filters

**Previous**: Task 16 (Contact form) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/colleges/components/ActivityFeed.tsx
- [ ] Display activity entries chronologically (newest first)
- [ ] Each entry: event type badge, description, relative timestamp
- [ ] For field updates, show "Field: old → new" format
- [ ] Add time period filter: Last 7/30/60/90 days, All time
- [ ] Add search input with debounce (300ms)
- [ ] Auto-refresh on filter/search change
- [ ] Use TanStack Query for activity data

### AC: 14-16

**Activity Format**:
```
[Update] • 10 days ago
GST Status: Included → Excluded
By: John Doe

[Contact Added] • 8 days ago
Added contact: Lina Perez
By: Jane Smith
```

---

## Success Criteria
- ✅ Activity displays chronologically
- ✅ Time filter works
- ✅ Search with debounce works
- ✅ Shows user attribution
- ✅ Auto-refreshes on filter change

**Next**: Task 18 - Create notes section component
