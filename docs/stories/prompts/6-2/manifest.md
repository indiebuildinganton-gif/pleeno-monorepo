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
- Status: Completed
- Started: 2025-11-14
- Completed: 2025-11-14
- Notes: Successfully enhanced CustomTooltip component in CashFlowChart.tsx with:
  - Dynamic date range formatting based on groupBy parameter (day: "MMM dd, yyyy", week: "MMM dd-dd, yyyy", month: "MMMM yyyy")
  - Comprehensive amount display showing Total Expected (blue), Total Paid (green), and Total for Period (bold)
  - Installment count display
  - Student list showing top 5 students with name, amount, and status (paid/expected)
  - "...and N more" indicator when more than 5 students in period
  - Empty bucket handling with graceful fallback message
  - Max-width constraint for better tooltip readability
  - Currency formatting using agency currency (AUD)
  - Color-coded status indicators (green for paid, blue for expected)

### Task 4: Add View Toggle Controls
- Status: Completed
- Started: 2025-11-14
- Completed: 2025-11-14
- Notes: Successfully added view toggle controls with:
  - Three toggle buttons (Daily, Weekly, Monthly) in CardHeader
  - Integration with Zustand dashboard store for state persistence
  - CashFlowView type exported from @pleeno/stores
  - Active button styling using variant="default" vs variant="outline"
  - Automatic refetch when view changes via TanStack Query
  - Default view set to "Weekly"
  - Loading spinner indicator during refetch (isFetching state)
  - Removed groupBy prop, now using store state
  - View persists across page refreshes via Zustand persist middleware

### Task 5: Implement Real-Time Updates
- Status: Completed
- Started: 2025-11-14
- Completed: 2025-11-14
- Notes: Successfully implemented real-time updates with:
  - TanStack Query refetchOnWindowFocus: Automatically refetches when user returns to browser tab
  - TanStack Query refetchInterval: Background polling every 5 minutes for automatic updates
  - Enhanced visual loading indicator in top-right corner with "Updating..." badge (blue background, spinner, shadow)
  - Supabase Realtime subscription to installments table filtered by agency_id
  - Automatic query cache invalidation when installments are inserted, updated, or deleted
  - useAuth hook integration to get agency_id from user.app_metadata
  - Proper cleanup of Realtime subscription on component unmount
  - Payment mutation integration: No existing payment mutations found, but Realtime subscription handles all installment changes from any source

### Task 6: Add Widget Header and Controls
- Status: Completed
- Started: 2025-11-14
- Completed: 2025-11-14
- Notes: Successfully transformed component into complete dashboard widget with:
  - Widget container with white background, rounded corners, shadow-lg, and padding
  - Header section with title "Cash Flow Projection (Next {days} Days)" and date range indicator
  - Refresh button with spinning icon animation during refetch (using RefreshCw from lucide-react)
  - Summary metrics section with three cards:
    - Total Expected: Blue background (#10b981), displays sum of expected_amount
    - Total Paid: Green background (#3b82f6), displays sum of paid_amount
    - Net Projection: Purple background, displays total expected + paid
  - View toggle buttons positioned on right side (Daily/Weekly/Monthly)
  - Responsive layout using Tailwind CSS:
    - flex-col sm:flex-row for header section
    - grid-cols-1 sm:grid-cols-3 for summary metrics
    - Buttons stack on mobile, inline on desktop
  - Empty state with SVG icon and helpful message when no data
  - Loading state with animated skeleton (bg-gray-200)
  - Error state with retry button
  - All currency formatted using formatCurrency from @pleeno/utils
  - Removed Card/CardHeader/CardContent components, using semantic div structure instead
  - Summary metrics only show when data is available (chartData.length > 0)

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

### Task 5 - Real-Time Updates Implementation
- **TanStack Query Configuration**:
  - refetchOnWindowFocus: Ensures data is fresh when users return to the dashboard tab
  - refetchInterval: 5-minute background polling prevents stale data during long sessions
  - staleTime: 5 minutes prevents unnecessary refetches for frequently changing views
- **Supabase Realtime Integration**:
  - Channel name: 'cash-flow-updates'
  - Listens to all events (*) on installments table: INSERT, UPDATE, DELETE
  - Filter: agency_id=eq.${agencyId} ensures users only receive updates for their agency
  - Uses queryClient.invalidateQueries to trigger refetch when data changes
  - Proper cleanup: Removes channel subscription on component unmount
- **Visual Feedback**:
  - Loading indicator only shows during background updates (isFetching && !isLoading)
  - Positioned absolutely in top-right corner with z-10 for visibility
  - Blue-themed badge with spinner and "Updating..." text for clear user feedback
  - Shadow and border for depth and visual separation
- **Authentication**:
  - Uses useAuth hook from @pleeno/auth to get current user
  - Extracts agency_id from user.app_metadata (JWT metadata)
  - Only subscribes to Realtime when agency_id is available
- **Performance**:
  - Query cache prevents duplicate fetches across view changes
  - Realtime subscription more efficient than continuous polling
  - Invalidation-based updates ensure data consistency without over-fetching

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

### Task 3 - Interactive Tooltip Implementation
- **Date Range Formatting**: Created formatDateRange helper function for context-aware date display
  - Daily view: Shows single date (e.g., "Jan 15, 2025")
  - Weekly view: Shows date range (e.g., "Jan 15-21, 2025")
  - Monthly view: Shows month and year (e.g., "January 2025")
- **Enhanced Data Display**:
  - Three-tier amount breakdown: Expected (blue), Paid (green), Total (bold)
  - Installment count with singular/plural grammar
  - Color-coded values matching chart colors for consistency
- **Student List**:
  - Top 5 students displayed with name, amount, and status
  - Truncation with "...and N more" indicator for overflow
  - Status color coding (green for paid, blue for expected)
- **Empty State Handling**: Graceful fallback for periods with no installments
- **UX Enhancements**:
  - Max-width constraint (max-w-sm) prevents overly wide tooltips
  - Shadow and border for depth and definition
  - Proper spacing and typography hierarchy
  - Responsive layout with flex justify-between for clean alignment

### Task 1 - API Route Implementation
- **Date Grouping Logic**: Implemented custom date bucketing for day/week/month views
  - Day: Direct date formatting
  - Week: Calculates Monday as week start (ISO week standard)
  - Month: Uses first day of month
- **Query Optimization**: Single query with nested joins to minimize database round trips
- **RLS Security**: Leverages Supabase RLS policies for automatic agency_id filtering
- **Data Structure**: Returns time series array sorted by date_bucket ascending
- **Error Handling**: Includes Zod validation errors with detailed feedback
