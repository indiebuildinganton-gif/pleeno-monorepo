# Story 6-2: Cash Flow Projection Chart - Implementation Manifest

**Story:** Cash Flow Projection Chart
**Status:** In Progress
**Started:** 2025-11-13

## Task Progress

### Task 1: Create Cash Flow Projection API Route
- Status: Completed
- Started: 2025-11-13
- Completed: 2025-11-13
- Notes: Successfully created API route at apps/dashboard/app/api/cash-flow-projection/route.ts with:
  - Query parameter validation (days, groupBy)
  - Date grouping logic (day/week/month)
  - Timezone-aware date calculations
  - Join with payment_plans, enrollments, students, colleges
  - Proper RLS filtering by agency_id
  - 5-minute caching for performance
  - Comprehensive error handling

### Task 2: Create CashFlowChart Component
- Status: Completed
- Started: 2025-11-13
- Completed: 2025-11-13
- Updated: 2025-11-14 (Fixed API endpoint path)
- Notes: Successfully created React component at apps/dashboard/app/components/CashFlowChart.tsx with:
  - TanStack Query for data fetching from /api/cash-flow-projection
  - Stacked bar chart using Recharts (paid in green #10b981, expected in blue #3b82f6)
  - Responsive container with 400px height
  - Custom tooltip showing paid, expected, total amounts and installment count
  - Loading skeleton using Card structure
  - Error state with retry button
  - Date formatting based on groupBy parameter (day/week/month)
  - Currency formatting using @pleeno/utils formatCurrency
  - Props: groupBy (day/week/month), days (default 90)
  - 5-minute stale time for caching
  - Fixed: API endpoint path corrected from /api/dashboard/cash-flow-projection to /api/cash-flow-projection

### Task 3: Implement Interactive Tooltip
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Add View Toggle Controls
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Implement Real-Time Updates
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Add Widget Header and Controls
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Integrate into Dashboard Page
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

### Task 2 - CashFlowChart Component Implementation
- **Component Structure**: Follows established patterns from SeasonalCommissionChart and KPIWidget
  - Client-side component with 'use client' directive
  - TypeScript interfaces for type safety
  - Proper error handling and loading states
- **Data Visualization**:
  - Stacked BarChart with two series (paid + expected)
  - Rounded corners on bars for better aesthetics
  - Custom color coding: green (#10b981) for paid, blue (#3b82f6) for expected
- **Tooltip Enhancement**: Custom tooltip showing breakdown of paid, expected, total, and installment count
- **Date Formatting**: Dynamic date labels based on groupBy parameter
  - day: "MMM dd" (Jan 15)
  - week: "MMM dd" (week start)
  - month: "MMM yyyy" (Jan 2025)
- **Currency Formatting**: Compact format for Y-axis (1K, 1M notation)
- **Component Props**: Flexible groupBy and days parameters for different views
- **Reusability**: Designed to be easily integrated into dashboard layouts

### Task 1 - API Route Implementation
- **Date Grouping Logic**: Implemented custom date bucketing for day/week/month views
  - Day: Direct date formatting
  - Week: Calculates Monday as week start (ISO week standard)
  - Month: Uses first day of month
- **Query Optimization**: Single query with nested joins to minimize database round trips
- **RLS Security**: Leverages Supabase RLS policies for automatic agency_id filtering
- **Data Structure**: Returns time series array sorted by date_bucket ascending
- **Error Handling**: Includes Zod validation errors with detailed feedback
