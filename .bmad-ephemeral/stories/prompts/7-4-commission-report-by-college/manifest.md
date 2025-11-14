# Story 7-4 Implementation Manifest

**Story**: Commission Report by College
**Status**: In Progress
**Started**: 2025-11-14

## Task Progress

### Task 1: Create Commissions Report Page
- Status: Completed
- Started: 2025-11-14
- Completed: 2025-11-14
- Notes: Created comprehensive commission report page with date range filter (preset options: Last 30 days, Last 90 days, This year, Custom), city filter dropdown, Generate Report button, placeholder table with mock data, and loading states. Installed required dependencies: date-fns, react-hook-form, @hookform/resolvers, zod, @tanstack/react-query. Page follows established patterns from payment-plans report.

### Task 2: Implement Commission Report API Route
- Status: Completed
- Started: 2025-11-14
- Completed: 2025-11-14
- Notes: Created commission report API with database function approach for optimal performance. Implemented TypeScript types, PostgreSQL function for aggregation, and API route with full validation and error handling. Function supports date range filtering (required), optional city filtering, and returns commission data grouped by college/branch with drill-down student payment plan details.

### Task 3: Display Commission Report Results
- Status: Completed
- Started: 2025-11-14
- Completed: 2025-11-14
- Notes: Created CommissionReportTable component with full college grouping, expandable drill-down for student payment plans, currency formatting, and visual highlighting. Integrated component with page and connected to API route. Component features: college headers with blue background, clickable branch rows with expand/collapse icons, nested student payment plan tables, summary totals row with color-coded values (green for earned, red for outstanding), and proper accessibility attributes.

### Task 4: Add CSV Export for Commissions Report
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Create Professional PDF Template for Commissions
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Implement PDF Export API Route
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Add City Grouping/Filtering
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Testing and Validation
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

### Task 1 Implementation Details

**Page Location**: `apps/reports/app/reports/commissions/page.tsx`

**Key Features Implemented**:
- Date range filter with 4 preset options (Last 30 days, Last 90 days, This year, Custom)
- Default date range: This year (Jan 1 to today)
- Optional city filter dropdown (populated with mock cities for now)
- Form validation using Zod schema
- Generate Report button with loading state
- Collapsible filter panel after report generation
- Placeholder table showing mock commission data
- Empty state before report generation
- Proper error handling and toast notifications

**Dependencies Added**:
- `date-fns@^4.1.0` - Date manipulation and formatting
- `react-hook-form@^7.66.0` - Form state management
- `@hookform/resolvers@^5.2.2` - Zod integration for forms
- `zod@^4.1.12` - Schema validation
- `@tanstack/react-query@5.90.7` - API state management (ready for Task 2)

**Design Patterns**:
- Follows existing payment-plans report structure
- Uses @pleeno/ui components for consistency
- Client component with form state management
- Prepared for API integration in Task 2 (commented TODO sections)

**Next Steps**:
- Task 2 will implement the actual API route at `/api/reports/commissions`
- City filter will be updated to fetch from branches table via API
- Mock data in the table will be replaced with real API responses

### Task 2 Implementation Details

**Files Created**:
1. `apps/reports/app/types/commissions-report.ts` - TypeScript type definitions
2. `supabase/migrations/004_reports_domain/004_commission_report_function.sql` - Database function
3. `apps/reports/app/api/reports/commissions/route.ts` - API route handler

**Database Function**: `get_commission_report`
- **Signature**: `get_commission_report(p_agency_id UUID, p_date_from DATE, p_date_to DATE, p_city TEXT)`
- **Returns**: Table with commission data grouped by college/branch
- **Features**:
  - SECURITY DEFINER function with explicit agency_id filtering on all tables
  - Uses FILTER clauses for earned_commission and outstanding_commission calculations
  - Aggregates payment plan drill-down data as JSONB
  - Efficient single query with all necessary joins
  - Handles NULL cases with COALESCE
  - Date filtering on installments.student_due_date
  - Optional city filtering on branches.city

**Commission Calculations**:
- **earned_commission**: `SUM(paid_amount * (rate/100)) FILTER (WHERE paid_date IS NOT NULL AND generates_commission = true)`
- **outstanding_commission**: `SUM(amount * (rate/100)) FILTER (WHERE paid_date IS NULL AND student_due_date < CURRENT_DATE AND generates_commission = true AND status NOT IN ('cancelled', 'draft'))`
- **total_paid**: `SUM(paid_amount) FILTER (WHERE paid_date IS NOT NULL)`

**API Route**: `POST /api/reports/commissions`
- **Authentication**: Requires agency_admin or agency_user role
- **Request Body**:
  - `date_from`: string (required, YYYY-MM-DD format)
  - `date_to`: string (required, YYYY-MM-DD format)
  - `city`: string (optional)
- **Validation**:
  - Required field validation
  - Date format validation (YYYY-MM-DD)
  - Date range validation (from <= to)
- **Response**:
  - `data`: Array of CommissionReportRow (one per branch)
  - `summary`: { total_paid, total_earned, total_outstanding }
- **Error Handling**: Uses handleApiError for consistent error responses

**TypeScript Types**:
- `CommissionsReportRequest` - Request body interface
- `CommissionReportRow` - Data row interface with all fields
- `CommissionPaymentPlan` - Drill-down payment plan details
- `CommissionsSummary` - Summary totals interface
- `CommissionsReportResponse` - Complete response interface

**Security**:
- RLS enforcement via agency_id parameter to database function
- Authentication required via requireRole middleware
- Input validation for all request parameters
- Prevents SQL injection via parameterized queries

**Migration Instructions**:
To apply the database migration, run:
```bash
npx supabase db push
```
Or apply the migration file directly through Supabase dashboard.

**Testing Notes**:
The API route is ready to use once the migration is applied. Test with:
```bash
curl -X POST http://localhost:3005/api/reports/commissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"date_from":"2025-01-01","date_to":"2025-12-31"}'
```

**Next Steps**:
- Task 3 will integrate this API with the UI to display commission report results
- City dropdown will be updated to fetch actual cities from branches table
- Mock data in table will be replaced with real API response data

### Task 3 Implementation Details

**Files Created**:
1. `apps/reports/app/components/CommissionReportTable.tsx` - Table component with college grouping and expandable drill-down

**Files Modified**:
1. `apps/reports/app/reports/commissions/page.tsx` - Integrated table component and connected to API

**Component Features**:
- **College Grouping**: Data grouped by college with distinct blue header rows (`bg-blue-50` in light mode, `bg-blue-950/30` in dark mode)
- **Branch Rows**: Each branch under its college with hover effects and expandable interaction
- **Expandable Drill-Down**:
  - Click branch rows to expand/collapse student payment plan details
  - ChevronRight icon when collapsed, ChevronDown when expanded
  - Keyboard accessible (Enter/Space keys)
  - Shows nested table with student name, payment plan ID, amounts, and commission
- **Currency Formatting**: Uses `Intl.NumberFormat` with USD locale for all monetary values
- **Visual Highlighting**:
  - Earned commission: Green text (`text-green-600` / `text-green-400` for dark mode)
  - Outstanding commission: Red text when > 0 (`text-red-600` / `text-red-400` for dark mode)
  - Outstanding commission: Muted text when 0
- **Summary Row**: Footer with totals for paid, earned, and outstanding commissions
- **Responsive Design**: Horizontal scroll on mobile, grid layout for branch rows
- **Accessibility**: Proper ARIA attributes, keyboard navigation, semantic HTML

**API Integration**:
- Replaced mock data with real API call to `/api/reports/commissions`
- Updated state to use `CommissionsReportResponse` type
- Error handling with user-friendly toast messages
- Loading states during report generation
- Empty state when no data found

**Table Structure**:
- Columns: College/Branch, City, Total Paid, Rate %, Earned Commission, Outstanding Commission
- Nested tables for drill-down student payment plans
- Fixed header with proper column alignment
- Summary footer with color-coded totals

**Next Steps**:
- Task 4 will add CSV export functionality for commission reports
- Consider adding sort functionality to columns if needed
- May add pagination if report data becomes very large
