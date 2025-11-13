# Story 3-1: College Registry - Task 14
## Create College Form Component

**Task 14 of 21**: Frontend - College create/edit form

**Previous**: Task 13 (College detail page) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/colleges/components/CollegeForm.tsx (Client Component)
- [ ] Form fields: Name, City, Commission Rate (0-100%), GST Status (toggle)
- [ ] Use React Hook Form with Zod validation
- [ ] Default GST status to "Included"
- [ ] Show validation errors inline
- [ ] "Cancel" and "Save College" buttons
- [ ] On submit: call POST/PATCH /api/colleges
- [ ] Show success toast and redirect to detail page

### AC: 2-4

**Form Fields**:
- Name (required, text input)
- City (optional, text input)
- Commission Rate (required, number 0-100)
- GST Status (toggle: Included/Excluded)

**Tech**: React Hook Form, Zod, TanStack Query for mutations

---

## Success Criteria
- ✅ Form validates inputs
- ✅ GST toggle works
- ✅ Submits to API endpoint
- ✅ Shows success/error feedback
- ✅ Redirects on success

**Next**: Task 15 - Create branch form component
