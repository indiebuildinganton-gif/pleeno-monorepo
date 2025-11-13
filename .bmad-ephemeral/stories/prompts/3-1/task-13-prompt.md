# Story 3-1: College Registry - Task 13
## Create College Detail Page

**Task 13 of 21**: Frontend - College detail page layout

**Previous**: Task 12 (College list page) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/colleges/[id]/page.tsx (Server Component)
- [ ] Fetch college, branches, contacts, notes, activity via Supabase
- [ ] Display college header: name, city, commission rate, GST status
- [ ] Add "Edit Info" and "Delete" buttons (admin only, top right)
- [ ] Display branches section with clickable links formatted as "College Name — Branch City"
- [ ] Display contacts section with "Add Contact" button (admin only)
- [ ] Display activity panel (right side) with time filter and search
- [ ] Display notes section with character counter and "Post Note" button

### AC: 3, 4, 7, 14-19

**Layout**:
```
┌──────────────────────────────────┬─────────────────┐
│ University X - Sydney            │  Activity       │
│ [Edit] [Delete]                  │  [Last 30 days] │
│                                  │  [Search...]    │
│ Commission: 15% | GST: Included  │  - Update       │
│                                  │  - Contact Add  │
│ Branches                         │                 │
│ - University X — Sydney          │                 │
│ - University X — Melbourne       │                 │
│                                  │                 │
│ Contacts [Add Contact]           │                 │
│ - Lina Perez (College)           │                 │
│   Accountant                     │                 │
│                                  │                 │
│ Notes                            │                 │
│ [Textarea 0/2000]                │                 │
│ [Post Note]                      │                 │
└──────────────────────────────────┴─────────────────┘
```

---

## Success Criteria
- ✅ Server Component loads all data
- ✅ Layout matches design
- ✅ Admin buttons show conditionally
- ✅ All sections display correctly

**Next**: Task 14 - Create college form component
