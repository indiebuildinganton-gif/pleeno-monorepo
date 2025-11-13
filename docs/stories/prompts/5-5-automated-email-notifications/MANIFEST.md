# Story 5.5: Automated Email Notifications - Implementation Manifest

**Story ID:** 5.5
**Story Name:** Automated Email Notifications (Multi-Stakeholder)
**Generated:** 2025-11-13
**Total Tasks:** 7

---

## Overview

This manifest tracks the sequential implementation of Story 5.5 for Claude Code Web. Each task should be completed in order, as later tasks depend on earlier ones.

**Story Goal:** Implement configurable email notifications for overdue payments sent to multiple stakeholders (agency admins, students, colleges, sales agents).

---

## Task Execution Checklist

### ✅ Task 1: Database Schema for Notification System
- **File:** [task-1-database-schema.md](task-1-database-schema.md)
- **Status:** ⬜ Not Started | ⏳ In Progress | ✅ Completed
- **Prerequisites:** None
- **Estimated Time:** 2-3 hours
- **Key Deliverables:**
  - [ ] Migration file created: `supabase/migrations/004_notifications_domain/001_notification_system.sql`
  - [ ] All tables created (notification_rules, email_templates, notification_log)
  - [ ] RLS policies applied
  - [ ] Indexes created for performance
  - [ ] Migration tested locally

**Notes:**
```
[Add completion notes here after finishing this task]
```

---

### ✅ Task 2: Notification Settings UI
- **File:** [task-2-notification-settings-ui.md](task-2-notification-settings-ui.md)
- **Status:** ⬜ Not Started | ⏳ In Progress | ✅ Completed
- **Prerequisites:** Task 1
- **Estimated Time:** 4-5 hours
- **Key Deliverables:**
  - [ ] Notification settings page created: `apps/agency/app/settings/notifications/page.tsx`
  - [ ] API routes implemented: `/api/notification-rules`
  - [ ] Sales agent assignment added to student form
  - [ ] Email preferences added to profile page
  - [ ] All UI tests passing

**Notes:**
```
[Add completion notes here after finishing this task]
```

---

### ✅ Task 3: Email Template Management UI
- **File:** [task-3-email-template-management.md](task-3-email-template-management.md)
- **Status:** ⬜ Not Started | ⏳ In Progress | ✅ Completed
- **Prerequisites:** Task 1
- **Estimated Time:** 5-6 hours
- **Key Deliverables:**
  - [ ] Email template management page created: `apps/agency/app/settings/email-templates/page.tsx`
  - [ ] Template editor component built with rich text editor
  - [ ] API routes implemented: `/api/email-templates`
  - [ ] Default templates provided
  - [ ] Preview functionality working
  - [ ] HTML sanitization implemented

**Notes:**
```
[Add completion notes here after finishing this task]
```

---

### ✅ Task 4: Email Sending Service
- **File:** [task-4-email-sending-service.md](task-4-email-sending-service.md)
- **Status:** ⬜ Not Started | ⏳ In Progress | ✅ Completed
- **Prerequisites:** Task 1
- **Estimated Time:** 4-5 hours
- **Key Deliverables:**
  - [ ] Resend SDK installed and configured
  - [ ] React Email templates created (all 3-4 types)
  - [ ] Email utility functions implemented: `packages/utils/src/email-helpers.ts`
  - [ ] Template rendering tested with placeholders
  - [ ] Test emails sent successfully

**Notes:**
```
[Add completion notes here after finishing this task]
```

---

### ✅ Task 5: Notification Job - Extend Status Update Function
- **File:** [task-5-notification-job-extension.md](task-5-notification-job-extension.md)
- **Status:** ⬜ Not Started | ⏳ In Progress | ✅ Completed
- **Prerequisites:** Task 1, Task 4, Story 5.1 (Status Update Job)
- **Estimated Time:** 6-8 hours
- **Key Deliverables:**
  - [ ] SQL function extended: `update_installment_statuses()` returns newly overdue IDs
  - [ ] Edge Function created: `supabase/functions/notifications/send-notifications/index.ts`
  - [ ] Edge Function deployed to Supabase
  - [ ] Status update job integrated with Edge Function
  - [ ] Duplicate prevention working (notification_log)
  - [ ] End-to-end flow tested

**Notes:**
```
[Add completion notes here after finishing this task]
```

---

### ✅ Task 6: Testing
- **File:** [task-6-testing.md](task-6-testing.md)
- **Status:** ⬜ Not Started | ⏳ In Progress | ✅ Completed
- **Prerequisites:** All previous tasks (1-5)
- **Estimated Time:** 5-6 hours
- **Key Deliverables:**
  - [ ] Unit tests: email helpers (template rendering, formatting)
  - [ ] Integration tests: API routes (notification rules, email templates)
  - [ ] Edge Function tests: notification logic with mocked Resend
  - [ ] E2E tests: complete notification flow
  - [ ] All tests passing with >70% coverage

**Notes:**
```
[Add completion notes here after finishing this task]
```

---

### ✅ Task 7: Documentation and Configuration
- **File:** [task-7-documentation-configuration.md](task-7-documentation-configuration.md)
- **Status:** ⬜ Not Started | ⏳ In Progress | ✅ Completed
- **Prerequisites:** All previous tasks (1-6)
- **Estimated Time:** 3-4 hours
- **Key Deliverables:**
  - [ ] Architecture documentation updated: `docs/architecture.md`
  - [ ] Admin configuration guide created: `docs/admin-guide-notifications.md`
  - [ ] Sample email templates documented: `docs/sample-email-templates.md`
  - [ ] Deployment checklist created: `docs/deployment-notifications.md`
  - [ ] Environment variables documented: `.env.example`

**Notes:**
```
[Add completion notes here after finishing this task]
```

---

## Implementation Progress

**Overall Status:** ⬜ Not Started

**Tasks Completed:** 0 / 7

**Progress Bar:**
```
[░░░░░░░░░░] 0%
```

---

## Key Files Created/Modified

### Database
- `supabase/migrations/004_notifications_domain/001_notification_system.sql`
- `supabase/migrations/004_notifications_domain/002_extend_status_update.sql`

### Edge Functions
- `supabase/functions/notifications/send-notifications/index.ts`
- `supabase/functions/notifications/send-notifications/deno.json`

### Agency App
- `apps/agency/app/settings/notifications/page.tsx`
- `apps/agency/app/settings/email-templates/page.tsx`
- `apps/agency/app/api/notification-rules/route.ts`
- `apps/agency/app/api/email-templates/route.ts`
- `apps/agency/components/email-template-editor.tsx`
- `apps/agency/lib/resend-client.ts`
- `apps/agency/lib/default-templates.ts`
- `apps/agency/lib/template-preview.ts`

### Shared Packages
- `packages/utils/src/email-helpers.ts`

### Email Templates
- `emails/payment-reminder.tsx`
- `emails/commission-alert.tsx`
- `emails/overdue-notification.tsx`

### Tests
- `packages/utils/src/__tests__/email-helpers.test.ts`
- `apps/agency/app/api/__tests__/notification-rules.test.ts`
- `apps/agency/app/api/__tests__/email-templates.test.ts`
- `supabase/functions/notifications/__tests__/send-notifications.test.ts`
- `apps/agency/e2e/notifications.spec.ts`

### Documentation
- `docs/architecture.md` (updated)
- `docs/admin-guide-notifications.md`
- `docs/sample-email-templates.md`
- `docs/deployment-notifications.md`
- `.env.example` (updated)

---

## Deployment Requirements

### Environment Variables
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://pleeno.com
```

### Services
- Resend account with verified domain
- Supabase Edge Function deployment
- Database migration applied

---

## Dependencies

### NPM Packages
- `@resend/node`
- `resend`
- `@react-email/components`
- `react-email`
- `sanitize-html` (for XSS prevention)

### External Services
- **Resend:** Email delivery service
- **Supabase Edge Functions:** Notification processing

---

## Success Criteria

**Story is complete when:**
1. ✅ All 7 tasks completed
2. ✅ All tests passing
3. ✅ Emails sending successfully to all recipient types
4. ✅ Duplicate prevention working
5. ✅ Agency admins can configure notification rules
6. ✅ Agency admins can customize email templates
7. ✅ Documentation complete

---

## Troubleshooting

### Common Issues

**Issue:** Emails not sending
- Check RESEND_API_KEY is set
- Verify notification rules are enabled
- Check Edge Function logs

**Issue:** Duplicate emails
- Verify notification_log UNIQUE constraint
- Check last_notified_date updates

**Issue:** Template rendering errors
- Verify placeholder syntax: `{{variable}}`
- Check all required variables exist in data

---

## Notes for Future Developers

1. **Notification System Architecture:** See [docs/architecture.md#Pattern 1: Multi-Stakeholder Notification System]
2. **Email Template Variables:** Full list in [docs/sample-email-templates.md#Variable Reference]
3. **Resend Dashboard:** Monitor email delivery at https://resend.com/emails
4. **Rate Limits:** Max 100 emails per hour per agency (configurable in Edge Function)

---

## Completion Sign-Off

**Developer:** ___________________
**Date Completed:** ___________________
**Code Review By:** ___________________
**QA Testing By:** ___________________
**Deployed to Production:** ___________________

---

**END OF MANIFEST**
