# Task 3: Payment Plan API Routes

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Implement POST /api/payment-plans (create) and GET /api/payment-plans/[id] (detail) API routes with validation, auto-population, and RLS enforcement.

## Acceptance Criteria

- AC 1: Payment Plan Data Entry
- AC 2: Enrollment Selection
- AC 5: Data Validation

## Subtasks

1. Implement POST /api/payment-plans (create new plan):
   - Validate enrollment_id exists and belongs to user's agency
   - Validate total_amount > 0
   - Validate commission_rate between 0 and 100
   - Validate start_date is valid date
   - Auto-populate agency_id from authenticated user's session
   - Auto-populate commission_rate from branch (query enrollments → branches → commission_rate_percent)
   - Return validation errors with descriptive messages
   - Return created payment plan with 201 status

2. Implement GET /api/payment-plans/[id] (payment plan detail):
   - Return payment plan with related enrollment data
   - Include student, college, branch info via joins
   - Return 404 if not found or user doesn't have access (RLS)
   - Return 200 with payment plan data

## Implementation Notes

**File Locations**:
- `apps/payments/app/api/payment-plans/route.ts` (POST)
- `apps/payments/app/api/payment-plans/[id]/route.ts` (GET)

**POST /api/payment-plans**:

Request Body:
```typescript
{
  enrollment_id: string;  // UUID
  total_amount: number;   // Decimal, > 0
  start_date: string;     // ISO date format
  notes?: string;         // Optional
  reference_number?: string; // Optional
}
```

Response (201 Created):
```typescript
{
  success: true;
  data: {
    id: string;
    enrollment_id: string;
    agency_id: string;
    total_amount: number;
    currency: string;
    start_date: string;
    commission_rate_percent: number;
    expected_commission: number;
    status: 'active';
    notes: string | null;
    reference_number: string | null;
    created_at: string;
    updated_at: string;
  }
}
```

Validation Errors (400 Bad Request):
```typescript
{
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    fields: {
      [fieldName: string]: string[];
    }
  }
}
```

**GET /api/payment-plans/[id]**:

Response (200 OK):
```typescript
{
  success: true;
  data: {
    id: string;
    enrollment_id: string;
    agency_id: string;
    total_amount: number;
    currency: string;
    start_date: string;
    commission_rate_percent: number;
    expected_commission: number;
    status: 'active' | 'completed' | 'cancelled';
    notes: string | null;
    reference_number: string | null;
    created_at: string;
    updated_at: string;
    enrollment: {
      id: string;
      program_name: string;
      status: string;
      student: {
        id: string;
        first_name: string;
        last_name: string;
      };
      branch: {
        id: string;
        city: string;
        commission_rate_percent: number;
        college: {
          id: string;
          name: string;
        }
      }
    }
  }
}
```

**Validation Rules**:
- enrollment_id: Must be valid UUID, must exist in enrollments table, must belong to same agency
- total_amount: Must be number > 0
- commission_rate: Must be between 0 and 100 (auto-populated from branch)
- start_date: Must be valid ISO date string
- notes: Optional, max length 10,000 characters
- reference_number: Optional, max length 255 characters

**Auto-Population Logic**:
```typescript
// Get user's agency_id from session
const { data: { user } } = await supabase.auth.getUser();
const agency_id = user.user_metadata.agency_id;

// Get commission rate from branch via enrollment
const { data: enrollment } = await supabase
  .from('enrollments')
  .select('branch:branches(commission_rate_percent)')
  .eq('id', enrollment_id)
  .eq('agency_id', agency_id)
  .single();

const commission_rate_percent = enrollment.branch.commission_rate_percent;
```

## Related Tasks

- **Depends on**: Task 1 (payment_plans table), Task 2 (commission calculation)
- **Blocks**: Task 4 (form component), Task 6 (creation mutation)

## Testing Checklist

- [ ] POST /api/payment-plans creates payment plan successfully
- [ ] POST validates enrollment_id exists
- [ ] POST validates enrollment belongs to same agency
- [ ] POST validates total_amount > 0
- [ ] POST rejects negative amount
- [ ] POST rejects zero amount
- [ ] POST validates commission_rate 0-100
- [ ] POST auto-populates agency_id from session
- [ ] POST auto-populates commission_rate from branch
- [ ] POST returns 201 with created payment plan
- [ ] POST returns 400 with validation errors
- [ ] GET /api/payment-plans/[id] returns payment plan with enrollment
- [ ] GET returns 404 if payment plan not found
- [ ] GET returns 404 if payment plan belongs to different agency (RLS)
- [ ] GET includes student, college, branch via joins

## References

- [docs/architecture.md](../../../docs/architecture.md) - Payments Domain (lines 1632-1709)
- [docs/PRD.md](../../../docs/PRD.md) - FR-5: Payment Plan Management (lines 734-836)
