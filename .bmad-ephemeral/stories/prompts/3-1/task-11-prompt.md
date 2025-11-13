# Story 3-1: College Registry - Task 11
## Implement Activity API Endpoint

**Task 11 of 21**: Activity feed API

**Previous**: Task 10 (Notes API) - ✅ Completed

---

## Subtasks
- [ ] Create apps/entities/app/api/colleges/[id]/activity/route.ts
- [ ] GET /api/colleges/[id]/activity?period=30&search=gst
- [ ] Query audit_logs for entity_type='college', 'branch', 'college_contact'
- [ ] Filter by time period (query param: period=7|30|60|90|all)
- [ ] Filter by search query
- [ ] Return formatted activity: timestamp (relative), user, action, description, before/after values

### AC: 14-16

**Uses**: get_college_activity function from Task 5

---

## Success Criteria
- ✅ Activity endpoint returns filtered results
- ✅ Time period filtering works
- ✅ Search filtering works
- ✅ Returns formatted activity with user names

**Next**: Task 12 - Create college list page (Frontend begins!)
