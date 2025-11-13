# Story 3-1: College Registry - Task 7
## Implement College Detail API Endpoint

**Task 7 of 21**: GET/PATCH/DELETE /api/colleges/[id]

**Previous**: Task 6 (Implement colleges list/create API) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/api/colleges/[id]/route.ts
- [ ] GET - Get college details with branches and contacts
- [ ] PATCH - Update college (admin only)
- [ ] DELETE - Soft delete college (admin only)
- [ ] Check for associated payment plans before deletion
- [ ] Log all changes in audit_logs

### AC: 3, 4

**Implementation**: GET with related data, PATCH with admin check, DELETE with dependency check

---

## Success Criteria
- ✅ GET returns college with branches and contacts
- ✅ PATCH updates college (admin only)
- ✅ DELETE prevented if payment plans exist
- ✅ All changes logged to audit_logs

**Next**: Task 8 - Implement branches API endpoints
