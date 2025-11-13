# Story 3-1: College Registry - Task 18
## Create Notes Section Component

**Task 18 of 21**: Frontend - Notes with character counter

**Previous**: Task 17 (Activity feed) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/colleges/components/NotesSection.tsx
- [ ] Display textarea with maxLength=2000
- [ ] Display character counter: "{current} / 2,000"
- [ ] "Post Note" button (disabled if empty or > 2000 chars)
- [ ] POST to /api/colleges/[id]/notes
- [ ] Show success toast
- [ ] Clear textarea after successful post
- [ ] Display list of existing notes with user name, relative timestamp
- [ ] Edit/delete icons for each note (creator only or admin)

### AC: 17-19

**Character Counter**: Updates in real-time as user types

**Note Display**:
```
[User Name] • 2 days ago
Note content here...
[Edit] [Delete]
```

---

## Success Criteria
- ✅ Character counter updates live
- ✅ Button disabled when invalid
- ✅ Note posts successfully
- ✅ Textarea clears after post
- ✅ Edit/delete work correctly

**Next**: Task 19 - Create validation schemas
