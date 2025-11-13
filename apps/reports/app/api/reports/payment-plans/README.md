# Payment Plans Report API

**Endpoint:** `POST /api/reports/payment-plans`

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Task:** 3 - Create Payment Plans Report API Route

## Overview

This API generates comprehensive payment plans reports with flexible filtering, pagination, sorting, and contract expiration tracking. All queries are automatically filtered by the authenticated user's agency via RLS.

## Authentication

Requires authentication with role `agency_admin` or `agency_user`.

## Request Schema

```json
{
  "filters": {
    "date_from": "2024-01-01",           // Optional: Filter by start date (YYYY-MM-DD)
    "date_to": "2024-12-31",             // Optional: Filter by start date (YYYY-MM-DD)
    "college_ids": ["uuid1", "uuid2"],   // Optional: Filter by colleges
    "branch_ids": ["uuid1", "uuid2"],    // Optional: Filter by branches
    "student_ids": ["uuid1", "uuid2"],   // Optional: Filter by students
    "status": ["active", "completed"],   // Optional: Filter by status
    "contract_expiration_from": "2024-01-01",  // Optional: Filter by contract expiration
    "contract_expiration_to": "2024-12-31"     // Optional: Filter by contract expiration
  },
  "columns": [
    "student_name",
    "college_name",
    "plan_amount",
    "total_paid",
    "contract_status"
  ],
  "pagination": {
    "page": 1,
    "page_size": 25
  },
  "sort": {
    "column": "created_at",
    "direction": "desc"
  }
}
```

## Response Schema

```json
{
  "data": [
    {
      "id": "uuid",
      "reference_number": "REF-001",
      "student_id": "uuid",
      "student_name": "John Doe",
      "college_id": "uuid",
      "college_name": "University of Example",
      "branch_id": "uuid",
      "branch_name": "Sydney Campus",
      "program_name": "Bachelor of Business",
      "plan_amount": 50000.00,
      "currency": "AUD",
      "commission_rate_percent": 15.00,
      "expected_commission": 7500.00,
      "total_paid": 10000.00,
      "total_remaining": 40000.00,
      "earned_commission": 1500.00,
      "status": "active",
      "contract_expiration_date": "2025-12-31",
      "days_until_contract_expiration": 412,
      "contract_status": "active",
      "start_date": "2024-01-15",
      "created_at": "2024-01-10T08:30:00Z",
      "updated_at": "2024-01-10T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total_count": 150,
    "total_pages": 6
  },
  "summary": {
    "total_plan_amount": 2500000.00,
    "total_paid_amount": 500000.00,
    "total_commission": 375000.00
  }
}
```

## Computed Fields

- **total_paid**: Sum of paid installments (from installments table)
- **total_remaining**: `plan_amount - total_paid`
- **earned_commission**: Commission earned on paid amount: `total_paid * (commission_rate_percent / 100)`
- **days_until_contract_expiration**: Days between today and contract expiration date
- **contract_status**:
  - `expired`: contract_expiration_date < today
  - `expiring_soon`: 0 <= days until expiration <= 30
  - `active`: days until expiration > 30

## Features

### 1. Flexible Filtering
- Date range (start_date)
- College, branch, and student filters
- Status filtering
- Contract expiration date range

### 2. Server-Side Pagination
- Configurable page size (1-100)
- Total count and pages returned
- LIMIT/OFFSET for efficient queries

### 3. Dynamic Sorting
- Sort by any column
- Ascending or descending order

### 4. Summary Totals
- Calculated across entire dataset (not just current page)
- Total plan amount
- Total paid amount
- Total commission

### 5. RLS Enforcement
- All queries automatically filtered by user's agency_id
- No cross-agency data access possible

## Example Request

```bash
curl -X POST http://localhost:3000/api/reports/payment-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "filters": {
      "date_from": "2024-01-01",
      "college_ids": ["uuid1"]
    },
    "columns": ["student_name", "college_name", "plan_amount"],
    "pagination": {
      "page": 1,
      "page_size": 10
    }
  }'
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "errors": {
      "columns": ["Select at least one column"]
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "User not associated with an agency"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch payment plans"
}
```

## Implementation Notes

### Database Schema Requirements
- **enrollments** table must have `contract_expiration_date` field (DATE)
- Joins: `payment_plans` → `enrollments` → `students`, `branches` → `colleges`
- RLS policies enforce agency isolation

### Future Enhancements
- When installments table is implemented, `total_paid` will be calculated from actual payment records
- Currently `total_paid` is set to 0 as a placeholder

## Testing

See the test cases in the task manifest for comprehensive testing scenarios.
