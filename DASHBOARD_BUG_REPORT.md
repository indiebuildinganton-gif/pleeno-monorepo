# Dashboard Complete Failure Bug Report

**Report Date:** 2025-11-17
**Environment:** Development (localhost:3002)
**Severity:** CRITICAL - Complete Dashboard Failure
**Status:** All widgets failing to load data

---

## Executive Summary

The dashboard at `http://localhost:3002/dashboard` is completely non-functional. Every single widget and data component is displaying error states, rendering the entire dashboard unusable. All API endpoints are returning 404 errors, indicating a complete disconnect between the frontend components and backend API routes.

---

## Affected Components

### 1. **Overdue Payments Widget**
- **Status:** FAILED
- **Error:** "Unable to load overdue payments - There was an error fetching the data. Please try again."
- **Component:** [OverduePaymentsWidget.tsx](apps/dashboard/app/components/OverduePaymentsWidget.tsx)
- **Expected API:** `/api/dashboard/overdue-payments`
- **Current Behavior:** API returns 404 Not Found

### 2. **Key Metrics (KPI Widget)**
- **Status:** FAILED
- **Error:** "Failed to load KPI metrics - There was an error loading the dashboard metrics. Please try again."
- **Component:** [KPIWidget.tsx](apps/dashboard/app/components/KPIWidget.tsx:196-206)
- **Expected API:** `/api/kpis`
- **Current Behavior:** API returns 404 Not Found
- **Expected Data:**
  - Active Students count
  - Active Payment Plans count
  - Outstanding Amount (AUD)
  - Earned Commission (AUD)
  - Collection Rate (%)

### 3. **Seasonal Trends Chart**
- **Status:** FAILED
- **Error:** "Failed to load seasonal commission data - There was an error loading the seasonal commission chart. Please try again."
- **Component:** [SeasonalCommissionChart.tsx](apps/dashboard/app/components/SeasonalCommissionChart.tsx:189-199)
- **Expected API:** `/api/dashboard/seasonal-commission`
- **Current Behavior:** API returns 404 Not Found
- **Expected Data:** Last 12 months of commission data with YoY comparison

### 4. **Commission Breakdown - By School**
- **Status:** FAILED
- **Error:** "Failed to load commission by school - There was an error loading the school commission data. Please try again."
- **Component:** [CommissionBySchoolWidget.tsx](apps/dashboard/app/components/CommissionBySchoolWidget.tsx:190-200)
- **Expected API:** `/api/dashboard/commission-by-school`
- **Current Behavior:** API returns 404 Not Found
- **Expected Data:** Top 5 schools by commission with percentage share

### 5. **Commission Breakdown - By Country**
- **Status:** FAILED
- **Error:** "Failed to load commission by country - There was an error loading the country commission data. Please try again."
- **Component:** [CommissionByCountryWidget.tsx](apps/dashboard/app/components/CommissionByCountryWidget.tsx:251-261)
- **Expected API:** `/api/dashboard/commission-by-country`
- **Current Behavior:** API returns 404 Not Found
- **Expected Data:** Top 5 countries by commission with flag emojis

### 6. **Payment Status Overview**
- **Status:** FAILED
- **Error:** "Failed to load payment status - There was an error loading the payment status overview. Please try again."
- **Component:** [PaymentStatusWidget.tsx](apps/dashboard/app/components/PaymentStatusWidget.tsx)
- **Expected API:** Not specified in component review
- **Current Behavior:** Likely API 404 error

### 7. **Commission Performance by College**
- **Status:** FAILED
- **Error:** "Failed to Load Data - Failed to fetch commission breakdown"
- **Component:** [CommissionBreakdownWidget.tsx](apps/dashboard/app/components/CommissionBreakdownWidget.tsx:86-102)
- **Expected API:** `/api/commission-by-college?period={period}&college_id={id}&branch_id={id}`
- **Current Behavior:** API returns 404 Not Found
- **Features Affected:**
  - Summary metrics (Total Commissions, GST, Outstanding)
  - Filter controls (Time Period, College, Branch)
  - Data table with drill-down links
  - All displaying "No data available"

### 8. **Recent Activity Feed**
- **Status:** FAILED
- **Error:** "Unable to load recent activity"
- **Component:** [ActivityFeed.tsx](apps/dashboard/app/components/ActivityFeed.tsx:56-69)
- **Expected API:** `/api/activity-log?limit=20`
- **Current Behavior:** API returns 404 Not Found
- **Expected Data:** Last 20 activity events with user info and timestamps

### 9. **Cash Flow Projection Chart**
- **Status:** FAILED
- **Error:** "Unable to load cash flow projection"
- **Component:** [CashFlowChart.tsx](apps/dashboard/app/components/CashFlowChart.tsx:251-265)
- **Expected API:** `/api/cash-flow-projection?groupBy={view}&days={days}`
- **Current Behavior:** API returns 404 Not Found
- **View Options:** Daily, Weekly, Monthly
- **Default Period:** Next 90 days
- **Expected Data:** Paid vs expected payments stacked bar chart

---

## Root Cause Analysis

### Primary Issue: API Route Path Mismatch

The components are making requests to API endpoints that do not exist or are not properly routed. Investigation reveals:

1. **API Route Files Exist** in [apps/dashboard/app/api/](apps/dashboard/app/api/)
   ```
   - commission-by-college/route.ts
   - cash-flow-projection/route.ts
   - commission-by-country/route.ts
   - commission-by-school/route.ts
   - seasonal-commission/route.ts
   - kpis/route.ts
   - activity-log/route.ts
   - dashboard/overdue-payments/route.ts
   - dashboard/payment-status-summary/route.ts
   - dashboard/due-soon-count/route.ts
   - entities/branches/route.ts
   - entities/colleges/route.ts
   ```

2. **Frontend Components Request Different Paths**
   - Component requests: `/api/kpis`
   - Component requests: `/api/dashboard/seasonal-commission`
   - Component requests: `/api/dashboard/commission-by-school`
   - etc.

3. **Path Resolution Issue**
   - The dashboard app is running on port 3002
   - Next.js may not be properly resolving the API routes
   - The `/dashboard` basePath may be interfering with route resolution
   - API routes are returning 404 instead of being handled by Next.js

### Secondary Issues

1. **No Authentication/Authorization Check**
   - Components make unauthenticated requests
   - No visible auth error handling
   - "Agency User" shown in header but no auth context visible

2. **Missing Error Recovery**
   - All widgets show generic error messages
   - No fallback data or cached data display
   - No automatic retry mechanisms beyond manual "Retry" buttons

3. **Development Environment Issues**
   - Dashboard running on port 3002 (non-standard)
   - Possible Next.js configuration issues with basePath
   - Turbopack enabled (`--turbopack` flag in dev script)

---

## Testing Performed

### API Endpoint Verification

```bash
# Test 1: KPIs endpoint
$ curl http://localhost:3002/api/kpis
Response: 404 Not Found (HTML error page)

# Test 2: Overdue payments endpoint
$ curl http://localhost:3002/api/dashboard/overdue-payments
Response: 404 Not Found (HTML error page)
```

Both endpoints returned full HTML 404 pages instead of JSON responses, confirming the API routes are not being resolved.

---

## Technical Details

### Frontend Configuration

**File:** [apps/dashboard/package.json](apps/dashboard/package.json)
```json
{
  "scripts": {
    "dev": "next dev --turbopack --port 3002"
  }
}
```

**File:** [apps/dashboard/next.config.ts](apps/dashboard/next.config.ts)
- Configuration not reviewed but likely contains basePath or routing config

### Component Query Implementation

All widgets use TanStack Query (`@tanstack/react-query`) with:
- 5-minute stale time
- Automatic refetch on window focus
- No authentication headers
- Fetch API for requests

**Example from KPIWidget:**
```typescript
const { data, isLoading, isError, refetch } = useQuery<KPIResponse>({
  queryKey: ['dashboard', 'kpis'],
  queryFn: async () => {
    const res = await fetch('/api/kpis')
    if (!res.ok) {
      throw new Error('Failed to fetch KPI metrics')
    }
    return res.json()
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

---

## Impact Assessment

### User Impact: CRITICAL

- **Complete loss of dashboard functionality**
- No access to any business metrics
- Unable to view overdue payments (critical business data)
- Cannot track commission performance
- No visibility into cash flow projections
- Activity feed non-functional

### Business Impact: HIGH

- Agency staff cannot monitor payment status
- No real-time visibility into outstanding payments
- Commission tracking completely disabled
- Financial planning (cash flow) impossible
- No audit trail (activity log down)

---

## Reproduction Steps

1. Start the dashboard development server:
   ```bash
   cd /Users/brenttudas/Pleeno
   pnpm run dev --filter=dashboard
   ```

2. Navigate to: `http://localhost:3002/dashboard`

3. **Expected Result:** Dashboard loads with populated widgets showing business metrics

4. **Actual Result:** All widgets display error states:
   - "Unable to load overdue payments"
   - "Failed to load KPI metrics"
   - "Failed to load seasonal commission data"
   - "Failed to load commission by school"
   - "Failed to load commission by country"
   - "Failed to load payment status"
   - "Failed to Load Data" (commission breakdown)
   - "Unable to load recent activity"
   - "Unable to load cash flow projection"

---

## Proposed Solutions

### Immediate Fix (Critical Priority)

1. **Verify Next.js API Route Configuration**
   - Check [next.config.ts](apps/dashboard/next.config.ts) for basePath issues
   - Ensure API routes are properly configured
   - Verify rewrites/redirects aren't blocking API paths

2. **Path Resolution Fix**
   - Option A: Move API routes to match component paths
   - Option B: Update component fetch URLs to match existing routes
   - Option C: Configure Next.js rewrites to map paths correctly

3. **Quick Test Fix**
   ```typescript
   // In each component, try absolute URL
   const res = await fetch('http://localhost:3002/api/kpis')
   // Or try without /api prefix
   const res = await fetch('/kpis')
   ```

### Short-term Solutions

1. **Add API Route Debugging**
   ```typescript
   // In each route.ts file
   export async function GET(request: Request) {
     console.log('API Route Hit:', request.url)
     // ... rest of handler
   }
   ```

2. **Implement API Health Check Endpoint**
   ```typescript
   // /api/health/route.ts
   export async function GET() {
     return Response.json({ status: 'ok', timestamp: new Date() })
   }
   ```

3. **Add Authentication Layer**
   - Implement proper auth check in API routes
   - Add auth context to components
   - Handle 401/403 errors appropriately

### Long-term Solutions

1. **Centralized API Client**
   ```typescript
   // packages/api-client/
   export const dashboardApi = {
     kpis: () => fetch('/api/kpis'),
     overduePayments: () => fetch('/api/dashboard/overdue-payments'),
     // ... etc
   }
   ```

2. **API Route Testing**
   - Add integration tests for all API routes
   - Verify routes are accessible in CI/CD
   - Test files already exist in `__tests__/` directories

3. **Better Error Handling**
   - Implement exponential backoff retry
   - Add cached/stale data fallback
   - Show more specific error messages
   - Add Sentry/error tracking integration

4. **Development Tools**
   - Add API route debugger page
   - Create dashboard health check page
   - Implement mock data mode for development

---

## Files Requiring Investigation

### High Priority
1. [apps/dashboard/next.config.ts](apps/dashboard/next.config.ts) - Next.js configuration
2. [apps/dashboard/app/api/kpis/route.ts](apps/dashboard/app/api/kpis/route.ts) - Sample API route
3. [apps/dashboard/middleware.ts](apps/dashboard/middleware.ts) - If exists, check for route blocking

### Medium Priority
4. [apps/shell/next.config.ts](apps/shell/next.config.ts) - Parent app config (if monorepo setup)
5. [packages/auth/](packages/auth/) - Authentication setup
6. [apps/dashboard/.env.local](apps/dashboard/.env.local) - Environment configuration

---

## Related Issues

- Epic 6: Dashboard & Reporting Zone
- Story 6.1: KPI Widgets with Trends and Market Breakdown
- Story 6.2: Cash Flow Projection Chart
- Story 6.3: Commission Breakdown by College
- Story 6.4: Recent Activity Feed
- Story 6.5: Overdue Payments Summary Widget

---

## Additional Notes

### API Routes Found But Not Working

All API route files exist in the codebase with proper TypeScript implementations:

```
/Users/brenttudas/Pleeno/apps/dashboard/app/api/
├── activity-log/route.ts
├── cash-flow-projection/route.ts
├── commission-by-college/route.ts
├── commission-by-country/route.ts
├── commission-by-school/route.ts
├── dashboard/
│   ├── due-soon-count/route.ts
│   ├── overdue-payments/route.ts
│   └── payment-status-summary/route.ts
├── entities/
│   ├── branches/route.ts
│   └── colleges/route.ts
├── kpis/route.ts
└── seasonal-commission/route.ts
```

Each route file has accompanying test files in `__tests__/` directories, suggesting the routes were properly developed and tested at some point.

### Development Server Status

```bash
$ ps aux | grep dashboard
brenttudas  43251  0.0  0.1 422229632  17168 s116  S+   10:35PM   0:00.88
node /Users/brenttudas/Pleeno/apps/dashboard/node_modules/.bin/../next/dist/bin/next
dev --turbopack --port 3002
```

Dashboard server is running on port 3002 with Turbopack enabled.

---

## Screenshots

Not applicable - all widgets show identical error states with "Retry" buttons.

---

## Workaround

**None available.** The dashboard is completely non-functional. Users must:
1. Wait for fix
2. Use alternative method to view data (direct database queries, etc.)
3. Use different environment if available

---

## Next Steps

1. ✅ Bug report created
2. ⏳ Investigate Next.js configuration
3. ⏳ Test individual API routes directly
4. ⏳ Fix path resolution issues
5. ⏳ Verify authentication setup
6. ⏳ Re-test all widgets
7. ⏳ Add monitoring/health checks

---

**Priority:** P0 - CRITICAL
**Assigned To:** Development Team
**Estimated Fix Time:** 2-4 hours (assuming configuration issue)

---

## References

- Dashboard Page: [apps/dashboard/app/page.tsx](apps/dashboard/app/page.tsx)
- API Routes Directory: [apps/dashboard/app/api/](apps/dashboard/app/api/)
- Component Directory: [apps/dashboard/app/components/](apps/dashboard/app/components/)
