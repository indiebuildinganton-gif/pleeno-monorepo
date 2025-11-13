# Story 6.1 Execution Manifest

**Story:** Key Performance Indicators (KPIs) Widget with Seasonal and Market Insights

**Epic:** 6 - Business Intelligence Dashboard

**Status:** ready-for-dev

**Generated:** 2025-11-13

---

## Task Execution Checklist

Use this manifest to track your progress as you execute each task sequentially in Claude Code Web.

### Backend API Routes

- [ ] **Task 1:** Create KPI Metrics API Route
  - File: `task-1-kpi-metrics-api.md`
  - Route: `GET /api/dashboard/kpis`
  - Deliverable: `apps/dashboard/app/api/kpis/route.ts`
  - Status: Not started

- [ ] **Task 2:** Create Seasonal Commission API Route
  - File: `task-2-seasonal-commission-api.md`
  - Route: `GET /api/dashboard/seasonal-commission`
  - Deliverable: `apps/dashboard/app/api/seasonal-commission/route.ts`
  - Status: Not started

- [ ] **Task 3:** Create Commission by School API Route
  - File: `task-3-commission-by-school-api.md`
  - Route: `GET /api/dashboard/commission-by-school`
  - Deliverable: `apps/dashboard/app/api/commission-by-school/route.ts`
  - Status: Not started

- [ ] **Task 4:** Create Commission by Country API Route
  - File: `task-4-commission-by-country-api.md`
  - Route: `GET /api/dashboard/commission-by-country`
  - Deliverable: `apps/dashboard/app/api/commission-by-country/route.ts`
  - Status: Not started

### Frontend Components

- [ ] **Task 5:** Create KPIWidget Component
  - File: `task-5-kpi-widget-component.md`
  - Deliverable: `apps/dashboard/app/components/KPIWidget.tsx`
  - Status: Not started

- [ ] **Task 6:** Create SeasonalCommissionChart Component
  - File: `task-6-seasonal-chart-component.md`
  - Deliverable: `apps/dashboard/app/components/SeasonalCommissionChart.tsx`
  - Status: Not started

- [ ] **Task 7:** Create CommissionBySchoolWidget Component
  - File: `task-7-school-widget-component.md`
  - Deliverable: `apps/dashboard/app/components/CommissionBySchoolWidget.tsx`
  - Status: Not started

- [ ] **Task 8:** Create CommissionByCountryWidget Component
  - File: `task-8-country-widget-component.md`
  - Deliverable: `apps/dashboard/app/components/CommissionByCountryWidget.tsx`
  - Status: Not started

### Integration

- [ ] **Task 9:** Integrate Widgets into Dashboard Page
  - File: `task-9-integrate-dashboard.md`
  - Deliverable: `apps/dashboard/app/page.tsx`
  - Status: Not started

### Testing

- [ ] **Task 10:** Testing
  - File: `task-10-testing.md`
  - Deliverables:
    - `apps/dashboard/app/api/**/__tests__/*.test.ts`
    - `apps/dashboard/app/components/__tests__/*.test.tsx`
    - `__tests__/e2e/dashboard.spec.ts`
  - Status: Not started

---

## Execution Instructions

1. **Sequential Execution:** Execute tasks in order (1→10)
2. **Copy-Paste Prompts:** Copy the content of each task file and paste into Claude Code Web
3. **Mark Progress:** Check off tasks as you complete them
4. **Verify Before Next:** Test each task's deliverable before moving to the next
5. **Context File:** Reference `.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.context.xml` for full story context

## Acceptance Criteria Summary

1. ✅ Dashboard displays KPI cards with core business metrics
2. ✅ Total active students count shown
3. ✅ Total active payment plans count shown
4. ✅ Total outstanding amount shown
5. ✅ Total earned commission shown
6. ✅ Payment collection rate percentage shown
7. ✅ Each KPI shows trend indicator (↑ green, ↓ red, → gray)
8. ✅ Seasonal commission chart shows 12-month data
9. ✅ Chart highlights peak and quiet months
10. ✅ Year-over-year comparison shown if available
11. ✅ Top 5 schools by commission displayed
12. ✅ Percentage share per school shown
13. ✅ Trend indicator per school shown
14. ✅ Top 5 countries by commission displayed
15. ✅ Percentage share per country shown
16. ✅ Trend indicator per country shown

## Story Completion Checklist

- [ ] All 10 tasks completed
- [ ] All tests passing
- [ ] Dashboard loads in <2 seconds
- [ ] All widgets display correctly on mobile and desktop
- [ ] Currency formatting respects agency settings
- [ ] RLS enforcement verified (no cross-agency data access)
- [ ] Error states and loading states tested
- [ ] Code reviewed and merged

---

**Next Steps:**
1. Open Claude Code Web
2. Navigate to `docs/stories/prompts/6-1-kpis-widget/`
3. Start with `task-1-kpi-metrics-api.md`
4. Copy the full content and paste into Claude Code Web
5. Let Claude Code implement the task
6. Verify implementation works
7. Check off task in this manifest
8. Move to next task

**Story Context:** [6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.context.xml](.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.context.xml)
