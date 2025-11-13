# Story 3-1: College Registry - Task 12
## Create College List Page

**Task 12 of 21**: Frontend - College list page (Server Component)

**Previous**: Task 11 (Activity API) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/colleges/page.tsx (Server Component)
- [ ] Fetch colleges via Supabase client (RLS auto-applied)
- [ ] Display table: Name, City, Commission Rate, GST Status, Branch Count, Updated
- [ ] Display GST status as badge: "Included" (green) or "Excluded" (yellow)
- [ ] Show branch count (e.g., "3 branches")
- [ ] Add "+ Add College" button (admin only, top right)
- [ ] Make rows clickable to navigate to /colleges/[id]
- [ ] Use TanStack Table for sorting and filtering

### AC: 1

**Key Design**:
```
┌─────────────────────────────────────────────────────────┐
│ Colleges                           [+ Add College]      │
├─────────────────────────────────────────────────────────┤
│ Name              City      Commission  GST    Branches │
│ University X      Sydney    15%         [Included]   3  │
│ College Y         Melbourne 12%         [Excluded]   2  │
└─────────────────────────────────────────────────────────┘
```

**Tech Stack**: Next.js 15 Server Component, TanStack Table, Tailwind CSS

---

## Success Criteria
- ✅ Server Component fetches data
- ✅ Table displays all colleges
- ✅ Admin-only button shown conditionally
- ✅ Rows clickable to detail page
- ✅ GST badges colored correctly

**Next**: Task 13 - Create college detail page
