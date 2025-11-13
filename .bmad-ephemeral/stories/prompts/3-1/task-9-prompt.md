# Story 3-1: College Registry - Task 9
## Implement Contacts API Endpoints

**Task 9 of 21**: College contacts CRUD

**Previous**: Task 8 (Branches API) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/api/colleges/[id]/contacts/route.ts
- [ ] GET /api/colleges/[id]/contacts - List contacts
- [ ] POST /api/colleges/[id]/contacts - Add contact (admin)
- [ ] Validate email format if provided
- [ ] Validate phone format if provided
- [ ] Create apps/entities/app/api/contacts/[id]/route.ts for PATCH/DELETE
- [ ] Log all contact changes in audit_logs

### AC: 9-13

**Validation**: Email and phone format validation, all fields optional except name

---

## Success Criteria
- ✅ CRUD operations work for contacts
- ✅ Admin-only modifications
- ✅ Email/phone validation
- ✅ Changes logged in audit trail

**Next**: Task 10 - Implement notes API endpoints
