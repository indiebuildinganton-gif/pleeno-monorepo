# Story 3-1: College Registry - Task 8
## Implement Branches API Endpoints

**Task 8 of 21**: Branches CRUD operations

**Previous**: Task 7 (College detail API) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/api/colleges/[id]/branches/route.ts
- [ ] GET /api/colleges/[id]/branches - List branches
- [ ] POST /api/colleges/[id]/branches - Create branch (admin)
- [ ] Auto-populate commission_rate from college default if not provided
- [ ] Create apps/entities/app/api/branches/[id]/route.ts for PATCH/DELETE

### AC: 5-8

**Key Feature**: Trigger auto-fills commission rate from college default (from Task 2)

---

## Success Criteria
- ✅ GET returns all branches for college
- ✅ POST creates branch with inherited commission rate
- ✅ PATCH/DELETE work (admin only)
- ✅ Commission rate validation (0-100)

**Next**: Task 9 - Implement contacts API endpoints
