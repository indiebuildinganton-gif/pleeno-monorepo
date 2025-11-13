# Story 3-1: College Registry - Task 10
## Implement Notes API Endpoints

**Task 10 of 21**: College notes CRUD

**Previous**: Task 9 (Contacts API) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/api/colleges/[id]/notes/route.ts
- [ ] GET /api/colleges/[id]/notes - List notes
- [ ] POST /api/colleges/[id]/notes - Add note
- [ ] Validate content length <= 2000 characters
- [ ] Store user_id from authenticated session
- [ ] Return notes with user name, timestamp, content

### AC: 17-19

**Key Feature**: All authenticated users can add notes (not admin-only)

---

## Success Criteria
- ✅ GET returns notes with user names
- ✅ POST creates note with user attribution
- ✅ 2000 char limit enforced
- ✅ Users can edit/delete own notes

**Next**: Task 11 - Implement activity API endpoint
