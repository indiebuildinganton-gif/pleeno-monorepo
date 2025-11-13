# Story 3-1: College Registry - Task 5
## Create Activity Feed Infrastructure

**Task 5 of 21**: Create database function for activity feed

**Previous**: Task 4 (Create college notes schema) - ✅ Should be completed

---

## Task Details

### Subtasks
- [ ] Create function to query audit_logs filtered by entity_type='college' and entity_id
- [ ] Create view or function: get_college_activity(college_id, from_date, search_query)
- [ ] Return activity entries with: timestamp, user_name, action, old_values, new_values
- [ ] Support time period filtering (7, 30, 60, 90 days, all time)
- [ ] Support text search on action description and field changes

### Acceptance Criteria: AC 14-16

**Function Implementation**:
```sql
-- Function to get college activity
CREATE OR REPLACE FUNCTION get_college_activity(
  p_college_id UUID,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  user_name TEXT,
  entity_type TEXT,
  action TEXT,
  old_values JSONB,
  new_values JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.created_at AS timestamp,
    u.full_name AS user_name,
    al.entity_type,
    al.action,
    al.old_values,
    al.new_values
  FROM audit_logs al
  LEFT JOIN users u ON al.user_id = u.id
  WHERE
    (al.entity_id = p_college_id AND al.entity_type = 'college')
    OR (al.entity_id IN (SELECT id FROM branches WHERE college_id = p_college_id) AND al.entity_type = 'branch')
    OR (al.entity_id IN (SELECT id FROM college_contacts WHERE college_id = p_college_id) AND al.entity_type = 'college_contact')
    AND (p_from_date IS NULL OR al.created_at >= p_from_date)
    AND (p_search_query IS NULL OR al.action ILIKE '%' || p_search_query || '%')
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

**Features**:
- Aggregates activity from college, branches, and contacts
- Time period filtering (from_date parameter)
- Text search on action field
- Returns user names for attribution
- Ordered by timestamp (newest first)

---

## Manifest Update

Update Task 4 → Completed, Task 5 → In Progress

---

## Success Criteria

- ✅ get_college_activity function created
- ✅ Queries audit_logs for college and related entities
- ✅ Supports time filtering and search
- ✅ Returns formatted activity data
- ✅ Function tested with sample data

**Next**: Task 6 - Implement colleges API endpoints (GET/POST)
