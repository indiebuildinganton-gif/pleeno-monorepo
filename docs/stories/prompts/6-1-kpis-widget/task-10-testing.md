# Task 10: Testing

## Context
You are implementing Story 6.1, Task 10 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Write comprehensive tests for all API routes and components.

## Acceptance Criteria
- All ACs: Comprehensive test coverage for API routes, components, and integration

## Requirements

Write tests for all components and API routes created in Tasks 1-9:

### 1. API Route Tests (Vitest)

**Task 1-4 API Routes:**
- `apps/dashboard/app/api/kpis/__tests__/route.test.ts`
- `apps/dashboard/app/api/seasonal-commission/__tests__/route.test.ts`
- `apps/dashboard/app/api/commission-by-school/__tests__/route.test.ts`
- `apps/dashboard/app/api/commission-by-country/__tests__/route.test.ts`

**Test Coverage:**
- Mock Supabase client queries
- Verify aggregation logic with sample data
- Test edge cases: no data, single record, multiple agencies
- Test trend calculation: positive, negative, zero change
- Test RLS enforcement (cannot access other agencies' data)
- Test percentage share calculations
- Test NULL handling (e.g., nationality)

### 2. Component Tests (React Testing Library)

**Task 5-8 Components:**
- `apps/dashboard/app/components/__tests__/KPIWidget.test.tsx`
- `apps/dashboard/app/components/__tests__/SeasonalCommissionChart.test.tsx`
- `apps/dashboard/app/components/__tests__/CommissionBySchoolWidget.test.tsx`
- `apps/dashboard/app/components/__tests__/CommissionByCountryWidget.test.tsx`

**Test Coverage:**
- Test rendering with mock data
- Test loading states (skeleton UI)
- Test error states with retry button
- Test trend indicators (up/down arrows with correct colors)
- Test currency formatting
- Test chart rendering (Recharts with mock data)
- Test responsive design (desktop vs mobile)
- Test user interactions (clicking retry, links)

### 3. Integration Tests (Playwright - Optional)

**E2E Test:**
- `__tests__/e2e/dashboard.spec.ts`

**Test Coverage:**
- Login → dashboard → verify all widgets display
- Test data refresh after user action (e.g., record payment → KPIs update)
- Test performance: dashboard loads within 2 seconds
- Test responsive layout on different screen sizes

## Testing Standards

**Framework:** Vitest for unit tests, React Testing Library for components, Playwright for E2E

**File location:** Tests colocated with components or in `__tests__/` directory

**Mock strategy:**
- Mock Supabase client queries in API route tests
- Mock fetch requests in component tests (use MSW or vi.mock)
- Use fixed test data for predictable assertions

**Coverage targets:**
- API routes: 80%+ line coverage
- Components: 70%+ line coverage
- Critical paths: 100% coverage (commission calculations, RLS enforcement)

## Example Test: KPI API Route

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';

describe('GET /api/dashboard/kpis', () => {
  it('calculates KPIs correctly with sample data', async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { count: 100 }, // active_students
            ],
          }),
        }),
      }),
    };

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.active_students).toBe(100);
    expect(data.data.trends.active_students).toMatch(/up|down|neutral/);
  });

  it('returns correct trend for increased metrics', async () => {
    // Mock current month: 150, previous month: 100
    // Expected trend: 'up'
  });

  it('handles edge case: no data available', async () => {
    // Expected: return zeros with 'neutral' trends
  });
});
```

## Example Test: KPIWidget Component

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIWidget } from '../KPIWidget';

describe('KPIWidget', () => {
  it('displays 5 metric cards with correct values', async () => {
    // Mock fetch response
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          active_students: 100,
          active_payment_plans: 50,
          outstanding_amount: 25000,
          earned_commission: 15000,
          collection_rate: 85,
          trends: {
            active_students: 'up',
            active_payment_plans: 'neutral',
            outstanding_amount: 'down',
            earned_commission: 'up',
            collection_rate: 'up',
          },
        },
      }),
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KPIWidget />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // active_students
      expect(screen.getByText('50')).toBeInTheDocument(); // active_payment_plans
    });
  });

  it('displays trend arrows with correct colors', async () => {
    // Test: 'up' trend shows green arrow
    // Test: 'down' trend shows red arrow
    // Test: 'neutral' trend shows gray arrow
  });

  it('shows loading skeleton while fetching', () => {
    // Test: loading state renders skeleton
  });

  it('shows error state with retry button', async () => {
    // Mock fetch error
    // Test: error message and retry button displayed
  });
});
```

## Edge Cases to Test

1. **No data available:** Agency with no students/payment plans
2. **First month:** No previous month for trend comparison
3. **NULL values:** Students with NULL nationality
4. **<5 schools/countries:** Show all available, not limited to 5
5. **Zero commission:** Schools/countries with 0 earned commission
6. **Percentage edge case:** All commission from 1 school (100%)
7. **Date boundary:** Month transitions (e.g., Jan 31 → Feb 1)
8. **RLS enforcement:** Cannot access other agency's data
9. **Currency formatting:** Different currencies (AUD, NZD, USD)
10. **Responsive design:** Mobile vs desktop layout

## Testing Tools & Setup

```json
// package.json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0",
    "playwright": "^1.40.0"
  }
}
```

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.{ts,tsx}', '**/node_modules/**'],
    },
  },
});
```

## Running Tests

```bash
# Unit tests (API routes + components)
npm run test

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# Watch mode (during development)
npm run test:watch
```

## Success Criteria

- All tests pass ✅
- Coverage targets met (80% API routes, 70% components) ✅
- No console errors or warnings during tests ✅
- Tests run in <30 seconds (fast feedback loop) ✅
- CI/CD integration (tests run on every commit) ✅

## Dependencies

- vitest
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- msw (for mocking API requests)
- playwright (for E2E tests)

## References

- [Architecture: Testing Standards](docs/architecture.md#Testing)
- [PRD: Data Accuracy - Zero calculation errors](docs/PRD.md#Product-Performance-Metrics)
