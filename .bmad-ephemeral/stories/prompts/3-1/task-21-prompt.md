# Story 3-1: College Registry - Task 21
## Write Tests for College Management

**Task 21 of 21**: Comprehensive testing suite - FINAL TASK!

**Previous**: Task 20 (Admin permission checks) - ✅ Completed

---

## Subtasks
- [ ] Test: Admin can create college (200)
- [ ] Test: Regular user cannot create college (403)
- [ ] Test: Commission rate validation (0-100 range)
- [ ] Test: GST status validation (included/excluded only)
- [ ] Test: Admin can update college (200)
- [ ] Test: Admin can delete college without payment plans (200)
- [ ] Test: Cannot delete college with payment plans (400)
- [ ] Test: Branch inherits default commission rate
- [ ] Test: Contact changes logged in audit trail
- [ ] Test: Notes character limit enforced (max 2000)
- [ ] Test: Activity feed filters by time period
- [ ] Test: Activity feed search works correctly
- [ ] Test: RLS prevents cross-agency access
- [ ] Test: Duplicate college name prevented within agency

### AC: 1-19 (All!)

**Test Categories**:

### Unit Tests
```typescript
// packages/validations/src/college.schema.test.ts
describe('CollegeSchema', () => {
  it('validates commission rate is 0-100', () => {
    expect(() => CollegeSchema.parse({ commission_rate: -1 })).toThrow()
    expect(() => CollegeSchema.parse({ commission_rate: 101 })).toThrow()
    expect(CollegeSchema.parse({ commission_rate: 50 })).toBeTruthy()
  })

  it('validates GST status enum', () => {
    expect(() => CollegeSchema.parse({ gst_status: 'invalid' })).toThrow()
    expect(CollegeSchema.parse({ gst_status: 'included' })).toBeTruthy()
  })
})
```

### Integration Tests
```typescript
// apps/entities/app/api/colleges/route.test.ts
describe('POST /api/colleges', () => {
  it('creates college when user is admin', async () => {
    const response = await POST(createMockRequest({
      name: 'Test College',
      city: 'Sydney',
      commission_rate: 15,
      gst_status: 'included'
    }))
    expect(response.status).toBe(200)
  })

  it('returns 403 when user is not admin', async () => {
    const response = await POST(createMockRequestAsRegularUser({...}))
    expect(response.status).toBe(403)
  })

  it('prevents duplicate college names within agency', async () => {
    await createCollege({ name: 'Test College' })
    const response = await POST(createMockRequest({ name: 'Test College' }))
    expect(response.status).toBe(400)
  })
})

describe('Branch commission rate inheritance', () => {
  it('inherits default commission from college', async () => {
    const college = await createCollege({ commission_rate: 15 })
    const branch = await createBranch({ college_id: college.id })
    expect(branch.commission_rate_percent).toBe(15)
  })

  it('can override commission rate', async () => {
    const college = await createCollege({ commission_rate: 15 })
    const branch = await createBranch({
      college_id: college.id,
      commission_rate: 20
    })
    expect(branch.commission_rate_percent).toBe(20)
  })
})
```

### E2E Tests
```typescript
// apps/entities/__tests__/college-management.e2e.test.ts
describe('College Management E2E', () => {
  it('completes full college creation flow', async ({ page }) => {
    await page.goto('/colleges')
    await page.click('text=+ Add College')
    await page.fill('input[name="name"]', 'Test University')
    await page.fill('input[name="city"]', 'Sydney')
    await page.fill('input[name="commission_rate"]', '15')
    await page.click('text=Save College')

    await expect(page).toHaveURL(/\/colleges\/[a-z0-9-]+/)
    await expect(page.locator('text=Test University')).toBeVisible()
  })

  it('adds branch with inherited commission rate', async ({ page }) => {
    const college = await createTestCollege({ commission_rate: 15 })
    await page.goto(`/colleges/${college.id}`)
    await page.click('text=Add Branch')

    // Commission rate should be pre-filled
    const rateInput = page.locator('input[name="commission_rate"]')
    await expect(rateInput).toHaveValue('15')

    await page.fill('input[name="name"]', 'Sydney Branch')
    await page.fill('input[name="city"]', 'Sydney')
    await page.click('text=Add Branch')

    await expect(page.locator('text=Test University — Sydney')).toBeVisible()
  })
})
```

### RLS Tests
```typescript
describe('Row Level Security', () => {
  it('prevents cross-agency access', async () => {
    const agency1College = await createCollege({ agency_id: 'agency-1' })

    // User from agency-2 tries to access agency-1 college
    const supabase = createClientForAgency('agency-2')
    const { data } = await supabase
      .from('colleges')
      .select()
      .eq('id', agency1College.id)
      .single()

    expect(data).toBeNull() // RLS blocks access
  })
})
```

---

## Test Execution

Run tests:
```bash
# Unit tests
npm test packages/validations

# Integration tests
npm test apps/entities/app/api

# E2E tests
npm run test:e2e apps/entities

# All tests
npm test
```

---

## Manifest Update - FINAL!

**Update manifest for the last time**:

1. Mark Task 20 as Completed
2. Mark Task 21 as In Progress
3. When all tests pass, mark Task 21 as Completed
4. Update Story Status to "Completed"
5. Add final implementation notes

```markdown
## Task Progress

### Task 21: Write tests for college management
- Status: Completed
- Started: [Date]
- Completed: [Date]
- Notes: All 14 test scenarios passing. Coverage: Unit (schemas), Integration (API), E2E (flows), RLS (security)

---

**Story Status**: ✅ COMPLETED
**Final Test Results**: All tests passing
**Total Implementation Time**: [Calculate from Task 1 start to Task 21 completion]
```

---

## Success Criteria

Task 21 (and entire story) complete when:
- ✅ All 14+ tests written and passing
- ✅ Unit tests cover validation schemas
- ✅ Integration tests cover API endpoints
- ✅ E2E tests cover critical user flows
- ✅ RLS tests verify security isolation
- ✅ Admin permission tests verify access control
- ✅ Audit logging tests verify change tracking
- ✅ Test coverage > 80% for new code
- ✅ All acceptance criteria validated by tests
- ✅ Manifest shows all 21 tasks completed

---

## Congratulations!

You've completed all 21 tasks for Story 3-1: College Registry!

**What you've built**:
- ✅ 4 database tables with RLS policies
- ✅ 1 activity feed database function
- ✅ 6 API endpoint groups (colleges, branches, contacts, notes, activity)
- ✅ 7 frontend components (list, detail, 5 forms/panels)
- ✅ 4 validation schemas
- ✅ Admin permission utilities
- ✅ Comprehensive test suite

**Next Steps**:
1. Mark the story as "done" in your sprint status file
2. Update the main story file status from "ready-for-dev" to "done"
3. Move to the next story in Epic 3 (Story 3.2: Student Registry)
4. Celebrate your accomplishment!

The College Registry is now fully functional and production-ready. Excellent work! 🎉
