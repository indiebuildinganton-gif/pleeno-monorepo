# Story 6.4: Recent Activity Feed - Task Prompts

This folder contains task-specific prompts for implementing Story 6.4 in Claude Code Web.

## 📋 Quick Start

1. **Open** [MANIFEST.md](./MANIFEST.md) to track your progress
2. **Start** with Task 1 and work sequentially through Task 8
3. **Copy** each task file content and paste into Claude Code Web
4. **Verify** each task works before moving to the next
5. **Check off** completed tasks in the manifest

## 📁 Files

### Manifest
- **[MANIFEST.md](./MANIFEST.md)** - Progress tracking checklist

### Database Setup (Task 1)
- **[task-1-database-schema.md](./task-1-database-schema.md)** - Create activity_log table with RLS

### Backend Implementation (Tasks 2-3)
- **[task-2-activity-logging.md](./task-2-activity-logging.md)** - Activity logger utility and API route integration
- **[task-3-activity-feed-api.md](./task-3-activity-feed-api.md)** - GET /api/activity-log route

### Frontend Components (Tasks 4-6)
- **[task-4-activity-feed-component.md](./task-4-activity-feed-component.md)** - ActivityFeed and ActivityCard components
- **[task-5-auto-refresh.md](./task-5-auto-refresh.md)** - Auto-refresh with TanStack Query
- **[task-6-clickable-activities.md](./task-6-clickable-activities.md)** - Clickable navigation implementation

### Integration & Testing (Tasks 7-8)
- **[task-7-dashboard-integration.md](./task-7-dashboard-integration.md)** - Dashboard page integration
- **[task-8-testing.md](./task-8-testing.md)** - Comprehensive testing

## 🎯 Story Overview

**Epic 6:** Business Intelligence Dashboard

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**Deliverables:**
- Activity log database table with RLS
- Activity logger utility for cross-cutting logging
- Activity feed API route
- ActivityFeed and ActivityCard React components
- Auto-refresh functionality
- Clickable activities with navigation
- Dashboard integration
- Comprehensive test suite

## 🔗 References

- **Story File:** `.bmad-ephemeral/stories/6-4-recent-activity-feed.md`
- **Architecture:** `docs/architecture.md`
- **PRD:** `docs/PRD.md`
- **Epics:** `docs/epics.md`

## ⚡ Execution Tips

1. **Work Sequentially:** Don't skip tasks - they build on each other
2. **Test As You Go:** Verify each component works before building on it
3. **Check Context:** Reference the story markdown file for detailed architectural patterns
4. **Use Manifest:** Track progress to avoid losing your place
5. **Read Constraints:** Each task file includes technical constraints and implementation notes

## 📊 Progress Tracking

Track your progress in [MANIFEST.md](./MANIFEST.md):
- [ ] Task 1: Database Schema
- [ ] Tasks 2-3: Backend Implementation
- [ ] Tasks 4-6: Frontend Components
- [ ] Task 7: Dashboard Integration
- [ ] Task 8: Testing

---

**Generated:** 2025-11-13
**Status:** Ready for development
