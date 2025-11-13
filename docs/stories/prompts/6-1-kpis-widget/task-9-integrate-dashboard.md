# Task 9: Integrate Widgets into Dashboard Page

## Context
You are implementing Story 6.1, Task 9 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Update dashboard page to include all four new widgets in a responsive grid layout.

## Acceptance Criteria
- All ACs: Dashboard displays all widgets in organized layout

## Requirements

Update `apps/dashboard/app/page.tsx` to include all four new widgets:

1. **Arrange in responsive grid layout:**
   - **Row 1:** KPI cards (5 columns on desktop, stacked on mobile)
   - **Row 2:** Seasonal chart (full width)
   - **Row 3:** School breakdown (left half) + Country breakdown (right half)

2. **Ensure consistent spacing and styling** with existing dashboard widgets

3. **Add section headings:**
   - "Key Metrics"
   - "Seasonal Trends"
   - "Commission Breakdown"

## Page Structure

```typescript
import { KPIWidget } from './components/KPIWidget';
import { SeasonalCommissionChart } from './components/SeasonalCommissionChart';
import { CommissionBySchoolWidget } from './components/CommissionBySchoolWidget';
import { CommissionByCountryWidget } from './components/CommissionByCountryWidget';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Row 1: Key Metrics */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Key Metrics</h2>
        <KPIWidget />
      </section>

      {/* Row 2: Seasonal Trends */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Seasonal Trends</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <SeasonalCommissionChart />
        </div>
      </section>

      {/* Row 3: Commission Breakdown */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Commission Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <CommissionBySchoolWidget />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <CommissionByCountryWidget />
          </div>
        </div>
      </section>
    </div>
  );
}
```

## Layout Requirements

- **Desktop (≥768px):**
  - Row 1: 5 columns (KPI cards side-by-side)
  - Row 2: Full width (Seasonal chart)
  - Row 3: 2 columns (School left, Country right)

- **Mobile (<768px):**
  - All widgets stack vertically
  - Full width for all components

- **Spacing:**
  - 8 spacing units between sections (space-y-8)
  - 6 spacing units between widgets in Row 3 (gap-6)
  - 4 spacing units below section headings (mb-4)

## Styling Requirements

- Use Tailwind CSS responsive utilities (md:, lg:)
- Section headings: text-2xl, font-bold
- Widget containers: bg-white, rounded-lg, shadow, p-6
- Container: mx-auto, px-4, py-8
- Consistent with existing dashboard styling

## Technical Constraints

- **Architecture:** Dashboard zone at `apps/dashboard/` with basePath `/dashboard`
- **Routing:** Shell app proxies `/dashboard` requests
- **Performance:** Widgets fetch data independently (parallel loading)
- **Styling:** Tailwind CSS + Shadcn UI

## Implementation Notes

- Each widget fetches its own data independently (no prop drilling)
- TanStack Query handles caching and deduplication
- Loading states handled within each widget component
- Error states handled within each widget component
- Page should not have its own loading/error boundaries (widgets manage their own)

## If Dashboard Zone Doesn't Exist Yet

If `apps/dashboard/` doesn't exist (Story 5.4 not implemented):

1. Create dashboard zone structure:
```
apps/dashboard/
├── app/
│   ├── page.tsx              # This file
│   ├── layout.tsx            # Root layout
│   ├── api/                  # API routes (from Tasks 1-4)
│   └── components/           # Widget components (from Tasks 5-8)
├── package.json
├── next.config.js            # basePath: '/dashboard'
└── tsconfig.json
```

2. Configure `next.config.js`:
```javascript
module.exports = {
  basePath: '/dashboard',
  transpilePackages: ['@pleeno/ui', '@pleeno/utils'],
};
```

3. Update `apps/shell/next.config.js` with rewrites:
```javascript
async rewrites() {
  return [
    {
      source: '/dashboard/:path*',
      destination: 'http://localhost:3001/dashboard/:path*',
    },
  ];
}
```

## Testing Requirements

- Integration test: Dashboard page loads and displays all widgets
- Test: Responsive layout (5 columns → 1 column on mobile)
- Test: Section headings display correctly
- Test: All widgets render without errors
- Test: Page load time <2 seconds (performance target)

## Dependencies

- All component dependencies from Tasks 5-8
- next (for page routing)
- tailwindcss

## References

- [Architecture: Multi-Zone Microfrontends](docs/architecture.md#Multi-Zone-Microfrontends)
- [Architecture: Dashboard Zone](docs/architecture.md#Project-Structure-Dashboard-Zone)
- [PRD: Dashboard load time target](docs/PRD.md#Product-Performance-Metrics)
