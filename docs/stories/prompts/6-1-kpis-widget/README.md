# Story 6.1: KPI Dashboard Widget - Task Prompts

This folder contains task-specific prompts for implementing Story 6.1 in Claude Code Web.

## 📋 Quick Start

1. **Open** [MANIFEST.md](./MANIFEST.md) to track your progress
2. **Start** with Task 1 and work sequentially through Task 10
3. **Copy** each task file content and paste into Claude Code Web
4. **Verify** each task works before moving to the next
5. **Check off** completed tasks in the manifest

## 📁 Files

### Manifest
- **[MANIFEST.md](./MANIFEST.md)** - Progress tracking checklist

### Backend API Routes (Tasks 1-4)
- **[task-1-kpi-metrics-api.md](./task-1-kpi-metrics-api.md)** - GET /api/dashboard/kpis
- **[task-2-seasonal-commission-api.md](./task-2-seasonal-commission-api.md)** - GET /api/dashboard/seasonal-commission
- **[task-3-commission-by-school-api.md](./task-3-commission-by-school-api.md)** - GET /api/dashboard/commission-by-school
- **[task-4-commission-by-country-api.md](./task-4-commission-by-country-api.md)** - GET /api/dashboard/commission-by-country

### Frontend Components (Tasks 5-8)
- **[task-5-kpi-widget-component.md](./task-5-kpi-widget-component.md)** - KPIWidget component
- **[task-6-seasonal-chart-component.md](./task-6-seasonal-chart-component.md)** - SeasonalCommissionChart component
- **[task-7-school-widget-component.md](./task-7-school-widget-component.md)** - CommissionBySchoolWidget component
- **[task-8-country-widget-component.md](./task-8-country-widget-component.md)** - CommissionByCountryWidget component

### Integration & Testing (Tasks 9-10)
- **[task-9-integrate-dashboard.md](./task-9-integrate-dashboard.md)** - Dashboard page integration
- **[task-10-testing.md](./task-10-testing.md)** - Comprehensive testing

## 🎯 Story Overview

**Epic 6:** Business Intelligence Dashboard

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**Deliverables:**
- 4 API routes for KPIs, seasonal data, school breakdown, country breakdown
- 4 React components (KPI cards, seasonal chart, school widget, country widget)
- Dashboard page integration
- Comprehensive test suite

## 🔗 References

- **Story File:** `.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md`
- **Context File:** `.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.context.xml`
- **Architecture:** `docs/architecture.md`
- **PRD:** `docs/PRD.md`
- **Epics:** `docs/epics.md`

## ⚡ Execution Tips

1. **Work Sequentially:** Don't skip tasks - they build on each other
2. **Test As You Go:** Verify each API route works before building components
3. **Check Context:** Reference the context XML file for architectural patterns
4. **Use Manifest:** Track progress to avoid losing your place
5. **Read Constraints:** Each task file includes technical constraints and implementation notes

## 📊 Progress Tracking

Track your progress in [MANIFEST.md](./MANIFEST.md):
- [ ] Tasks 1-4: Backend API Routes
- [ ] Tasks 5-8: Frontend Components
- [ ] Task 9: Dashboard Integration
- [ ] Task 10: Testing

---

**Generated:** 2025-11-13
**Status:** Ready for development
