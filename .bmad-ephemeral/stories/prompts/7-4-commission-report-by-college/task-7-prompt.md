# Story 7-4: Commission Report by College - Task 7

## Story Context

**As an** Agency Admin
**I want** to generate commission reports grouped by college/branch with location details
**So that** I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions

## Task 7: Add City Grouping/Filtering

**Acceptance Criteria**: #8

**Previous Tasks**:
- Task 1 - Created report page UI with date range and city filters
- Task 2 - Implemented commission data API
- Task 3 - Created table display component
- Task 4 - Added CSV export
- Task 5 - Created PDF template
- Task 6 - Implemented PDF export API

### Task Description

Add optional city-based grouping to reorganize commission reports by location, useful for agencies with branches in multiple cities.

### Subtasks Checklist

- [ ] Add optional "Group by City" toggle to report builder
- [ ] When enabled, change query GROUP BY to include city as primary grouping:
  ```sql
  GROUP BY b.city, c.id, c.name, b.id, b.name, b.commission_rate_percent
  ORDER BY b.city, c.name, b.name
  ```
- [ ] Update table display to group by city first, then college/branch
- [ ] Add city filter dropdown to narrow results
- [ ] Test: Toggle "Group by City" → Report reorganizes by city

## Context

### Relevant Acceptance Criteria

8. **And** the report can be grouped/filtered by city when needed

### Key Constraints

- **Multi-Tenant Security**: All queries MUST filter by agency_id
- **Performance**: Use database indexes on branches.city for filtering

### Database Changes Needed

The database function from Task 2 (`get_commission_report`) needs to be updated to support city grouping, OR you can create a new parameter/function variant.

**Option A**: Add `p_group_by_city` parameter to existing function
**Option B**: Create new function `get_commission_report_by_city`
**Option C**: Handle grouping in application layer (less performant but simpler)

### Reference Documentation

- Context File: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
- Story Dev Notes: See SQL query example for city grouping
- Task 2: Database function you created

## Manifest Update Instructions

Before starting implementation:

1. **Read the manifest**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`
2. **Update Task 6**:
   - Status: Completed
   - Completed: [Today's Date]
   - Notes: [Add notes from Task 6, e.g., "Implemented PDF export with agency logo and professional formatting"]
3. **Update Task 7**:
   - Status: In Progress
   - Started: [Today's Date]

## Implementation Notes

**Building on Previous Tasks**: This task enhances the existing reporting functionality with optional city-based grouping.

**Key Implementation Points**:

1. **Frontend Changes** (Report Page from Task 1):
   - Add "Group by City" checkbox/toggle to the filter section
   - When checked, pass `group_by_city: true` to API
   - City filter dropdown remains (for filtering to specific cities)
   - Both can be used together: filter to one city AND group by city

2. **Backend Changes** (API Route from Task 2):
   - Accept new parameter: `group_by_city` (boolean)
   - If `group_by_city` is true, modify query grouping:
     ```sql
     GROUP BY b.city, c.id, c.name, b.id, b.name, b.commission_rate_percent
     ORDER BY b.city, c.name, b.name
     ```
   - If false, use existing grouping (college first)

3. **Database Function Update**:

   **Recommended Approach**: Modify existing `get_commission_report` function

   Add parameter `p_group_by_city BOOLEAN DEFAULT FALSE`

   Use dynamic ORDER BY:
   ```sql
   CREATE OR REPLACE FUNCTION get_commission_report(
     p_agency_id UUID,
     p_date_from DATE,
     p_date_to DATE,
     p_city TEXT DEFAULT NULL,
     p_group_by_city BOOLEAN DEFAULT FALSE
   )
   RETURNS TABLE (...) AS $$
   BEGIN
     RETURN QUERY
     SELECT
       c.id AS college_id,
       c.name AS college_name,
       b.id AS branch_id,
       b.name AS branch_name,
       b.city,
       -- ... other fields
     FROM colleges c
     INNER JOIN branches b ON c.id = b.college_id
     -- ... rest of joins
     WHERE c.agency_id = p_agency_id
       AND i.due_date >= p_date_from
       AND i.due_date <= p_date_to
       AND (p_city IS NULL OR b.city = p_city)
     GROUP BY b.city, c.id, c.name, b.id, b.name, b.commission_rate_percent
     ORDER BY
       CASE WHEN p_group_by_city THEN b.city END,
       c.name,
       b.name;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

4. **Display Component Changes** (CommissionReportTable from Task 3):
   - Check if data is grouped by city
   - If grouped by city:
     - Add city-level grouping (outermost group)
     - Then college grouping
     - Then branch rows
   - Visual hierarchy: City header (largest) > College header > Branch rows
   - Consider different background colors for city vs college headers

5. **City Grouping Logic**:
   ```typescript
   // Group by city first, then college
   const groupedByCity = data.reduce((acc, row) => {
     if (!acc[row.city]) {
       acc[row.city] = {}
     }
     if (!acc[row.city][row.college_name]) {
       acc[row.city][row.college_name] = []
     }
     acc[row.city][row.college_name].push(row)
     return acc
   }, {} as Record<string, Record<string, typeof data>>)
   ```

6. **Export Updates**:
   - CSV export (Task 4): Add city as first column when grouped by city
   - PDF export (Task 6): Add city section headers when grouped by city

7. **UI/UX Considerations**:
   - City grouping toggle should be clearly labeled
   - Consider showing example of how data will be organized
   - When city filter is active + group by city is off, it's just a filter
   - When both are active, you get single-city grouping (less useful but valid)

**Example Display When Grouped by City**:
```
┌─ NEW YORK ─────────────────────────────┐
│  ┌─ University of Example ──────────┐  │
│  │  - Main Campus                   │  │
│  │  - Downtown Branch               │  │
│  └──────────────────────────────────┘  │
│  ┌─ Another College ────────────────┐  │
│  │  - Manhattan Branch              │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
┌─ BOSTON ───────────────────────────────┐
│  ┌─ College Name ───────────────────┐  │
│  │  - City Center                   │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

## Next Steps

After completing this task:

1. **Test City Grouping**:
   - Generate report without "Group by City" → Verify original college grouping
   - Enable "Group by City" toggle → Verify data reorganizes by city
   - Test with city filter alone → Verify only one city's data shows
   - Test with city filter + group by city → Verify single city grouped display
   - Verify exports (CSV/PDF) reflect city grouping when enabled

2. **Test Edge Cases**:
   - Single city in data → Should still show city header
   - No data → Should show empty state
   - Multiple branches in same city → Verify all show under city group

3. **Update the manifest**:
   - Set Task 7 status to "Completed" with today's date
   - Add implementation notes (e.g., "Added city-based grouping with database function update")

4. **Verify All Acceptance Criteria**:
   - Review acceptance criteria #1-8
   - Verify all are met with city grouping feature
   - Test full workflow: filter → generate → display → export (CSV & PDF)

5. **Move to Task 8**:
   - Open file: `task-8-prompt.md`
   - Task 8 is comprehensive testing and validation
   - Copy and paste the contents into Claude Code Web

## Tips

- Keep the database function flexible with the boolean parameter
- Test the SQL query directly in Supabase SQL editor first
- Dynamic ORDER BY in PostgreSQL can be tricky - test thoroughly
- Consider performance impact of city grouping on large datasets
- City headers should be visually distinct from college headers
- Use consistent naming: "city" throughout (not "location" or "branch city")
- Test with real data if possible (multiple cities and colleges)
- Ensure backward compatibility - existing reports should work without changes
- Document the city grouping feature for users
