# Task 7: Create Colleges/Branches/Students Lookup APIs

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** AC #1

---

## Task Overview

Create lookup API routes to populate filter dropdowns in ReportBuilder (colleges, branches, students).

---

## Requirements

### API Routes

Create the following API routes:

1. **GET /api/reports/lookup/colleges**
   - Path: `apps/reports/app/api/reports/lookup/colleges/route.ts`
   - Returns: List of colleges for current agency
   - Response: `{ id, name, branch_count }[]`

2. **GET /api/reports/lookup/branches?college_id=X**
   - Path: `apps/reports/app/api/reports/lookup/branches/route.ts`
   - Query Params: `college_id` (optional, repeatable)
   - Returns: Branches for specified college(s)
   - Response: `{ id, name, college_id, contract_expiration_date }[]`

3. **GET /api/reports/lookup/students?search=X**
   - Path: `apps/reports/app/api/reports/lookup/students/route.ts`
   - Query Params: `search` (min 2 characters)
   - Returns: Students matching search query (typeahead)
   - Response: `{ id, name, college_name }[]` (max 50 results)

### Implementation Details

1. **Colleges API**
   ```typescript
   export async function GET(request: Request) {
     const supabase = createClient()

     const { data, error } = await supabase
       .from('colleges')
       .select('id, name, branches(count)')
       // RLS auto-filters by agency_id

     if (error) return NextResponse.json({ error: error.message }, { status: 500 })

     const colleges = data.map(c => ({
       id: c.id,
       name: c.name,
       branch_count: c.branches[0]?.count || 0,
     }))

     return NextResponse.json(colleges)
   }
   ```

2. **Branches API**
   ```typescript
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url)
     const collegeIds = searchParams.getAll('college_id')

     const supabase = createClient()
     let query = supabase
       .from('branches')
       .select('id, name, college_id, enrollments(contract_expiration_date)')

     if (collegeIds.length > 0) {
       query = query.in('college_id', collegeIds)
     }

     const { data, error } = await query
     // RLS auto-filters by agency_id

     if (error) return NextResponse.json({ error: error.message }, { status: 500 })

     return NextResponse.json(data)
   }
   ```

3. **Students API**
   ```typescript
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url)
     const search = searchParams.get('search') || ''

     if (search.length < 2) {
       return NextResponse.json({ error: 'Search must be at least 2 characters' }, { status: 400 })
     }

     const supabase = createClient()

     const { data, error } = await supabase
       .from('students')
       .select('id, name, enrollments(colleges(name))')
       .ilike('name', `%${search}%`)
       .limit(50)
       // RLS auto-filters by agency_id

     if (error) return NextResponse.json({ error: error.message }, { status: 500 })

     const students = data.map(s => ({
       id: s.id,
       name: s.name,
       college_name: s.enrollments[0]?.colleges?.name || 'N/A',
     }))

     return NextResponse.json(students)
   }
   ```

### TanStack Query Hooks

Create `apps/reports/app/hooks/useReportLookups.ts`:

```typescript
export function useColleges() {
  return useQuery({
    queryKey: ['report-lookup-colleges'],
    queryFn: async () => {
      const res = await fetch('/api/reports/lookup/colleges')
      if (!res.ok) throw new Error('Failed to fetch colleges')
      return res.json()
    },
    staleTime: 600000, // 10 minutes
  })
}

export function useBranches(collegeIds?: string[]) {
  return useQuery({
    queryKey: ['report-lookup-branches', collegeIds],
    queryFn: async () => {
      const params = new URLSearchParams()
      collegeIds?.forEach(id => params.append('college_id', id))
      const res = await fetch(`/api/reports/lookup/branches?${params}`)
      if (!res.ok) throw new Error('Failed to fetch branches')
      return res.json()
    },
    enabled: Boolean(collegeIds?.length),
    staleTime: 600000, // 10 minutes
  })
}

export function useStudents(search: string) {
  return useQuery({
    queryKey: ['report-lookup-students', search],
    queryFn: async () => {
      const res = await fetch(`/api/reports/lookup/students?search=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error('Failed to fetch students')
      return res.json()
    },
    enabled: search.length >= 2,
    staleTime: 60000, // 1 minute
  })
}
```

---

## Technical Constraints

- **RLS Enforcement:** All queries auto-filtered by `agency_id`
- **Supabase Client:** Use server-side client from `packages/database`
- **Caching:** Use TanStack Query with appropriate stale times
- **Typeahead:** Debounce student search (500ms) in ReportBuilder
- **Performance:** Limit students query to 50 results

---

## Acceptance Criteria

✅ GET /api/reports/lookup/colleges returns agency's colleges
✅ GET /api/reports/lookup/branches filters by college_id(s)
✅ GET /api/reports/lookup/students searches by name (min 2 chars, max 50 results)
✅ All APIs enforce RLS (only agency's data)
✅ TanStack Query hooks created for all lookups
✅ Hooks integrated into ReportBuilder component
✅ Appropriate caching (10 min for colleges/branches, 1 min for students)

---

## Reference Code

See story markdown for:
- API route implementations (lines 206-220)
- TanStack Query hooks (lines 832-876)

---

## Output

After implementing:
1. Show all three API route files
2. Show useReportLookups.ts hook file
3. Test APIs:
   - GET /api/reports/lookup/colleges → Verify returns agency's colleges
   - GET /api/reports/lookup/branches?college_id=X → Verify filters correctly
   - GET /api/reports/lookup/students?search=john → Verify returns matching students
4. Integrate hooks into ReportBuilder:
   - Colleges dropdown populated
   - Branches dropdown populated (lazy load on college select)
   - Students typeahead working (debounced)
5. Verify RLS enforcement (only current agency's data)
