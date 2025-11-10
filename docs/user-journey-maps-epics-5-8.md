# pleeno - User Journey Maps (EPICs 5-8)

**Author:** anton
**Date:** 2025-11-10
**Project Level:** MVP
**Scope:** EPICs 5-8 (Intelligent Status Automation through Audit & Compliance)

---

## Table of Contents

- [Epic 5: Intelligent Status Automation](#epic-5-intelligent-status-automation)
  - [Story 5.1: Automated Status Detection Job](#story-51-automated-status-detection-job)
  - [Story 5.2: Due Soon Notification Flags](#story-52-due-soon-notification-flags)
  - [Story 5.3: Overdue Payment Alerts](#story-53-overdue-payment-alerts)
  - [Story 5.4: Payment Status Dashboard Widget](#story-54-payment-status-dashboard-widget)
  - [Story 5.5: Automated Email Notifications](#story-55-automated-email-notifications)
- [Epic 6: Business Intelligence Dashboard](#epic-6-business-intelligence-dashboard)
  - [Story 6.1: Key Performance Indicators (KPIs) Widget](#story-61-key-performance-indicators-kpis-widget)
  - [Story 6.2: Cash Flow Projection Chart](#story-62-cash-flow-projection-chart)
  - [Story 6.3: Commission Breakdown by College](#story-63-commission-breakdown-by-college)
  - [Story 6.4: Recent Activity Feed](#story-64-recent-activity-feed)
  - [Story 6.5: Overdue Payments Summary Widget](#story-65-overdue-payments-summary-widget)
- [Epic 7: Reporting & Export](#epic-7-reporting--export)
  - [Story 7.1: Payment Plans Report Generator](#story-71-payment-plans-report-generator)
  - [Story 7.2: CSV Export Functionality](#story-72-csv-export-functionality)
  - [Story 7.3: PDF Export Functionality](#story-73-pdf-export-functionality)
  - [Story 7.4: Commission Report by College](#story-74-commission-report-by-college)
  - [Story 7.5: Student Payment History Report](#story-75-student-payment-history-report)
- [Epic 8: Audit & Compliance Infrastructure](#epic-8-audit--compliance-infrastructure)
  - [Story 8.1: Comprehensive Audit Logging](#story-81-comprehensive-audit-logging)
  - [Story 8.2: Audit Log Viewer Interface](#story-82-audit-log-viewer-interface)
  - [Story 8.3: Data Retention Policy Configuration](#story-83-data-retention-policy-configuration)
  - [Story 8.4: Change History for Payment Plans](#story-84-change-history-for-payment-plans)
  - [Story 8.5: Data Export for Compliance](#story-85-data-export-for-compliance)

---

## Epic 5: Intelligent Status Automation

**Epic Goal:** Implement the automated status tracking bot that eliminates manual work and provides proactive alerts—this delivers the "wow moment" where payments are automatically flagged as due soon or overdue.

---

### Story 5.1: Automated Status Detection Job

**User Story:**
As a **system**,
I want **a scheduled job that runs daily to update installment statuses**,
So that **overdue payments are automatically detected without manual checking**.

**Acceptance Criteria:**

**Given** installments exist with due dates
**When** the daily status check job runs
**Then** all installments with status "pending" and due_date < today are marked as "overdue"

**And** the job runs automatically every day at a configured time (e.g., 2 AM UTC)
**And** the job logs its execution and any status changes made
**And** the job only processes installments for active payment plans
**And** the job is resilient to failures and retries on error

#### User Journey Map

**Persona:** System (Automated Job)

| Journey Stage | System Actions | System Feelings/State | Pain Points | Opportunities |
|---------------|----------------|----------------------|-------------|---------------|
| **1. Initialization** | Daily cron job triggers at 2 AM UTC | Routine, predictable | Job may fail silently if monitoring not set up | Implement health checks and alerting |
| **2. Database Query** | Queries all pending installments with due_date < today | Processing | Large dataset could cause performance issues | Use indexed queries, batch processing |
| **3. Status Update** | Updates installment status from "pending" to "overdue" | Executing | Concurrent updates may cause conflicts | Use transactions, row-level locking |
| **4. Logging** | Records execution details: time, records updated, errors | Accountable | Logs may grow large over time | Implement log rotation, structured logging |
| **5. Error Handling** | Retries on failure, sends alerts if critical | Resilient | False positives may trigger unnecessary alerts | Fine-tune retry logic, alert thresholds |
| **6. Completion** | Job finishes, metrics recorded | Complete | Success not visible without monitoring | Create dashboard for job execution history |

**Key Touchpoints:**
- Cron scheduler (Vercel Cron, Supabase Edge Functions)
- Database (installments table)
- Logging system (jobs_log table)
- Monitoring/alerting service

**Success Metrics:**
- Job completes successfully 99.9% of the time
- Average execution time < 30 seconds
- Zero data inconsistencies
- Alerts fire only for genuine failures

---

### Story 5.2: Due Soon Notification Flags

**User Story:**
As an **Agency User**,
I want **to see visual indicators for payments due within the next 7 days**,
So that **I can proactively follow up before payments become overdue**.

**Acceptance Criteria:**

**Given** installments exist with upcoming due dates
**When** I view payment plans or the dashboard
**Then** installments due within 7 days are flagged as "due soon"

**And** "due soon" installments display with a warning badge/color
**And** the dashboard shows a count of "due soon" installments
**And** I can filter the payment plans list to show only plans with "due soon" installments
**And** the threshold (7 days) is configurable per agency

#### User Journey Map

**Persona:** Lisa - Agency User (Operations Coordinator)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Login** | Logs into pleeno dashboard | "What needs my attention today?" | Too many things to check manually | Dashboard should surface urgent items first |
| **2. Dashboard Scan** | Scans dashboard widgets | Hopeful for clear priorities | Information overload if not well-organized | Visual hierarchy with color coding |
| **3. Notice "Due Soon" Count** | Sees "3 payments due in next 7 days" badge | Alert, focused | Doesn't know if this is normal or urgent | Compare to historical average |
| **4. Filter Payment Plans** | Clicks badge, navigates to filtered view | Seeking details | May need to open multiple plans to understand | Quick preview on hover |
| **5. Review Details** | Reviews student names, amounts, due dates | Planning next actions | Needs to remember to follow up | One-click "Send Reminder" action |
| **6. Follow Up** | Reaches out to students via external email/phone | Proactive, in control | Manual outreach is time-consuming | Future: automated reminder emails |
| **7. Configuration (Optional)** | Agency Admin adjusts threshold from 7 to 5 days | Empowered, customizing | Setting hidden in settings page | Contextual configuration from dashboard |

**Key Touchpoints:**
- Dashboard (first view after login)
- Payment plans list (filtered view)
- Agency settings page (threshold configuration)

**Emotional Journey:**
- Start: Neutral → Alert (see "due soon" indicator)
- Middle: Focused → Informed (review details)
- End: In control → Satisfied (follow-up initiated)

**Success Metrics:**
- 80% of "due soon" payments are followed up within 24 hours
- "Due soon" conversion to "paid on time" rate > 70%
- User configures threshold within first 2 weeks

---

### Story 5.3: Overdue Payment Alerts

**User Story:**
As an **Agency User**,
I want **to receive in-app notifications for overdue payments**,
So that **I'm immediately aware when follow-up action is needed**.

**Acceptance Criteria:**

**Given** the automated status job has marked installments as overdue
**When** I log into the application
**Then** I see a notification/alert for new overdue payments since my last login

**And** the notification shows the number of overdue installments
**And** clicking the notification takes me to a filtered view of overdue payments
**And** I can dismiss notifications after reviewing
**And** the dashboard prominently displays the total count and value of overdue payments

#### User Journey Map

**Persona:** Marcus - Agency Admin (Agency Owner)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Background (System)** | Overnight: 2 installments become overdue | N/A | May miss critical overdue items | System tracks this automatically |
| **2. Login** | Logs in next morning, sees notification bell with "2" | Alert, concerned | "How bad is it?" | Preview notification content on hover |
| **3. Open Notifications** | Clicks bell, sees: "2 payments are now overdue" | Anxious, needs context | Lacks urgency info (1 day vs 30 days overdue?) | Show days overdue in notification |
| **4. Navigate to Overdue** | Clicks notification, taken to filtered overdue view | Focused, investigating | Needs full context: student history, contact info | Rich detail view with action buttons |
| **5. Review Overdue Items** | Reviews 2 overdue payments: $500 (2 days) and $1200 (1 day) | Prioritizing | Which to tackle first? | Auto-sort by amount × days overdue |
| **6. Take Action** | Calls students, sends follow-up emails | Proactive, stressed | Manual work, context switching | Quick-action panel: "Email Student", "Call Student" |
| **7. Dismiss Notification** | Marks notification as read | Relieved, organized | May forget to follow up later | Schedule follow-up reminders |
| **8. Monitor Dashboard** | Checks "Overdue Payments" widget throughout day | Vigilant | Widget doesn't update in real-time | Auto-refresh every 5 minutes |

**Key Touchpoints:**
- Notification bell icon (header)
- Notifications dropdown/page
- Overdue payments filtered view
- Dashboard overdue widget

**Emotional Journey:**
- Start: Concerned → Alert (notification appears)
- Middle: Anxious → Focused (understand severity)
- End: Proactive → Relieved (action taken, notification cleared)

**Success Metrics:**
- Notification click-through rate > 85%
- Time from notification to first action < 2 hours
- Overdue payments resolved within average 3 days

---

### Story 5.4: Payment Status Dashboard Widget

**User Story:**
As an **Agency User**,
I want **a dashboard widget showing payment status overview at a glance**,
So that **I instantly know which payments need attention**.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** the page loads
**Then** I see a payment status summary widget displaying:

**And** count and total value of pending payments
**And** count and total value of due soon payments (next 7 days)
**And** count and total value of overdue payments
**And** count and total value of paid payments (this month)
**And** clicking any metric filters the payment plans list accordingly

#### User Journey Map

**Persona:** Sarah - Agency User (Finance Officer)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Dashboard Access** | Navigates to dashboard (homepage after login) | Routine, seeking clarity | Dashboard loads slowly if not optimized | Cache widget data for 5 minutes |
| **2. Widget Scan** | Scans Payment Status widget in 3 seconds | Assessing situation | Too many numbers can be overwhelming | Visual indicators: green/yellow/red |
| **3. Interpret Metrics** | Sees: Pending (12, $15K), Due Soon (3, $2.5K), Overdue (1, $800), Paid This Month (8, $9K) | Informed, confident | Hard to remember what's "normal" | Show trend vs last month |
| **4. Identify Priority** | Notices 1 overdue payment—this is the priority | Focused, decisive | Doesn't know details without clicking | Tooltip on hover: "Student: John Doe, $800, 3 days overdue" |
| **5. Click Overdue** | Clicks "Overdue: 1 ($800)" | Investigating | New page load interrupts flow | Consider modal/slide-over for quick view |
| **6. Review Filtered List** | Views payment plans list filtered to overdue | Engaged | Only one item, but needs full context | Show student contact info in list view |
| **7. Return to Dashboard** | Returns to dashboard to check other metrics | Monitoring | Breadcrumb navigation may be unclear | Sticky header with dashboard link |
| **8. Check Due Soon** | Clicks "Due Soon: 3 ($2.5K)" to plan follow-ups | Proactive, planning | Can't bulk-action from here | Future: "Send Reminders to All" button |

**Key Touchpoints:**
- Dashboard homepage
- Payment Status widget (4 clickable metrics)
- Payment plans filtered views

**Emotional Journey:**
- Start: Calm → Assessing (scan widget)
- Middle: Informed → Focused (identify priority)
- End: In control → Confident (action plan clear)

**Success Metrics:**
- Widget loads in < 1 second
- 70% of users click at least one metric per session
- Dashboard is homepage for 90% of users

---

### Story 5.5: Automated Email Notifications

**User Story:**
As an **Agency Admin**,
I want **to optionally receive email notifications for overdue payments**,
So that **I'm alerted even when not logged into the system**.

**Acceptance Criteria:**

**Given** I am an Agency Admin with email notifications enabled
**When** the daily status job detects new overdue payments
**Then** I receive a summary email listing all newly overdue installments

**And** the email includes student names, colleges, amounts, and due dates
**And** the email includes a link to view the overdue payments in the app
**And** I can enable/disable email notifications in my profile settings
**And** emails are sent only once per installment when it first becomes overdue

#### User Journey Map

**Persona:** David - Agency Admin (Busy Owner, travels frequently)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Enable Notifications** | Goes to Settings → Profile, toggles "Email notifications for overdue payments" ON | Proactive, setting up | Hard to find setting if not discoverable | Onboarding prompt: "Enable email alerts?" |
| **2. Background (System)** | Overnight: 2 installments become overdue, system sends email at 6 AM | N/A | Email may go to spam | Use authenticated domain, test deliverability |
| **3. Receive Email** | Checks phone in morning, sees email: "2 payments are now overdue - pleeno" | Alert, concerned | Subject line doesn't convey urgency | Include total amount in subject |
| **4. Open Email** | Opens email, scans summary table | Seeking quick assessment | Email design may not be mobile-friendly | Responsive email template |
| **5. Review Details** | Reads: "John Smith - MIT Australia - $500 - Due: Nov 3 (7 days overdue)" | Informed, prioritizing | No context on student history | Link to student profile in email |
| **6. Click Link** | Clicks "View Overdue Payments" button | Taking action | Link may open to generic dashboard | Deep link to overdue filter |
| **7. Mobile Login** | Logs in on phone (may need to authenticate) | Inconvenient if not using SSO | Re-authentication on mobile is friction | Remember device, biometric login |
| **8. Take Action** | Views overdue payments in app, sends follow-up | Relieved, in control | Can't take action directly from email | Future: "Email Student" link in email |
| **9. Next Day** | Does NOT receive duplicate email for same overdue items | Satisfied, not annoyed | May forget about overdue if only one email | Weekly digest for persistent overdue? |

**Key Touchpoints:**
- Settings → Profile (enable/disable)
- Email inbox (notification email)
- Deep link to overdue payments view in app

**Emotional Journey:**
- Start: Proactive → Prepared (enable setting)
- Middle: Alert → Informed (receive and read email)
- End: In control → Satisfied (action taken, no spam)

**Success Metrics:**
- Email deliverability rate > 98%
- Email open rate > 60%
- Click-through rate from email to app > 40%
- Unsubscribe rate < 2%


## Epic 6: Business Intelligence Dashboard

**Epic Goal:** Surface critical KPIs, cash flow projections, and actionable insights through an interactive dashboard, delivering the transformation from chaos to control.

---

### Story 6.1: Key Performance Indicators (KPIs) Widget

**User Story:**
As an **Agency Admin**,
I want **to see high-level KPIs on my dashboard**,
So that **I can quickly assess the health of my business at a glance**.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** the page loads
**Then** I see KPI cards displaying:

**And** total active students (count)
**And** total active payment plans (count)
**And** total outstanding amount (sum of unpaid installments)
**And** total earned commission (sum of commission from paid installments)
**And** payment collection rate (% of expected payments received this month)
**And** each KPI shows trend indicator (up/down vs last month)

#### User Journey Map

**Persona:** Rachel - Agency Admin (Growth-focused Owner)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Dashboard Access** | Logs in, dashboard loads with KPI widget at top | Expectant, strategic mindset | KPIs may load slowly if not cached | Prioritize KPI widget loading |
| **2. Quick Scan** | Scans all 5 KPI cards in 5 seconds | Assessing business health | Too much data can be overwhelming | Use icons and color for quick recognition |
| **3. Active Students** | Sees "120 Active Students ↑ 8% vs last month" | Pleased, growth is good | Doesn't know if 8% is significant | Contextual benchmark: "Above average" |
| **4. Payment Plans** | Sees "87 Active Payment Plans ↑ 5%" | Confident | May wonder: plans/student ratio | Show derived metric: "1.4 plans/student" |
| **5. Outstanding Amount** | Sees "$145,000 Outstanding ↓ 3%" | Good, collections improving | Is this good or bad? | Explain: "3% better than last month" |
| **6. Earned Commission** | Sees "$12,500 Earned Commission ↑ 15%" | Excited! This is revenue | Only shows earned, not outstanding | Add "Expected: $18,000" for context |
| **7. Collection Rate** | Sees "82% Collection Rate ↓ 2%" | Concerned, trend is down | Doesn't know what's a good rate | Benchmark: "Industry avg: 75-85%" |
| **8. Drill Down** | Clicks on "Collection Rate" to see details | Investigating | No drill-down available yet | Link to detailed report/chart |
| **9. Share with Team** | Takes screenshot to share in team meeting | Proud, communicating | Manual screenshot is clunky | "Export Dashboard" or "Share Link" feature |

**Key Touchpoints:**
- Dashboard homepage
- KPI widget (5 cards with trend indicators)

**Emotional Journey:**
- Start: Expectant → Assessing (scan KPIs)
- Middle: Pleased → Concerned (mix of good/bad trends)
- End: Informed → Empowered (understand business state)

**Success Metrics:**
- KPI widget loads in < 2 seconds
- Users spend average 30+ seconds reviewing KPIs per session
- 60% of users check dashboard at least 3x per week

---

### Story 6.2: Cash Flow Projection Chart

**User Story:**
As an **Agency Admin**,
I want **a visual chart showing projected cash flow for the next 90 days**,
So that **I can anticipate incoming payments and plan accordingly**.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** I access the cash flow widget
**Then** I see a chart showing projected daily/weekly incoming payments for the next 90 days

**And** projections are based on scheduled installment due dates
**And** the chart distinguishes between expected payments and already-paid amounts
**And** I can hover over chart points to see details (student names, amounts)
**And** the chart updates in real-time as payments are recorded
**And** I can toggle between daily, weekly, and monthly views

#### User Journey Map

**Persona:** Tom - Agency Admin (Cash-conscious CFO)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Dashboard Access** | Scrolls down to Cash Flow Projection widget | Seeking financial foresight | Chart may not be visible without scrolling | Consider sticky/prominent placement |
| **2. Initial View** | Sees bar chart: next 90 days, grouped by week | Curious, analyzing | Default view (weekly) may not match need | Remember user preference (daily/weekly/monthly) |
| **3. Toggle to Daily** | Clicks "Daily" view toggle | Seeking granularity | Too many bars (90 days) makes chart crowded | Limit daily view to 30 days, weekly for 90 |
| **4. Interpret Chart** | Sees green bars (already paid) and blue bars (expected) | Understanding cash flow | Hard to tell what's confirmed vs projected | Clearer legend and color contrast |
| **5. Identify Peak Week** | Notices Week 3 has largest expected payment: $12,000 | Planning | Doesn't know which students/plans | Hover shows tooltip: "5 payments, $12K total" |
| **6. Hover for Details** | Hovers over Week 3 bar, sees tooltip with student names | Engaged, informed | Tooltip text may be cut off if too many students | Scrollable tooltip or "View all →" link |
| **7. Check Next 30 Days** | Focuses on next 4 weeks, sees $8K expected | Confident in short-term | Worried about students paying late | Overlay "actual vs expected" from past weeks |
| **8. Toggle to Monthly** | Switches to monthly view for long-term planning | Strategic thinking | Only shows 3 bars (3 months), seems too simple | Good for high-level, keep granular options |
| **9. Notice Gap** | Sees Month 2 has very low expected payments | Concerned, identifying risk | Doesn't know why gap exists | Annotate chart: "End of semester break" |
| **10. Export Chart** | Wants to include in board report | Frustrated if no export | No export option | Add "Download as PNG" or "Print" |

**Key Touchpoints:**
- Dashboard (Cash Flow widget)
- Chart view toggles (daily/weekly/monthly)
- Tooltip on hover
- Payment recording flow (updates chart in real-time)

**Emotional Journey:**
- Start: Curious → Analyzing (explore chart)
- Middle: Informed → Concerned (identify risks)
- End: Strategic → Empowered (plan based on projections)

**Success Metrics:**
- Chart interaction rate (hover/toggle) > 50% of dashboard visits
- Accuracy of projections vs actual payments > 85%
- Users report improved cash planning (survey)

---

### Story 6.3: Commission Breakdown by College

**User Story:**
As an **Agency Admin**,
I want **to see commission breakdown by college/branch**,
So that **I know which institutions are most valuable and can prioritize relationships**.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** I access the commission breakdown widget
**Then** I see a table or chart showing commission earned per college/branch

**And** each row shows: college name, branch name, total expected commission, total earned commission, outstanding commission
**And** the list is sortable by any column
**And** I can filter by time period (all time, this year, this quarter, this month)
**And** clicking a college/branch drills down to see associated payment plans
**And** the widget highlights top-performing colleges

#### User Journey Map

**Persona:** Elena - Agency Admin (Relationship Manager)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Dashboard Access** | Scrolls to Commission Breakdown widget | Strategic, relationship-focused | May be buried below other widgets | Pin frequently-used widgets to top |
| **2. Initial View** | Sees table: 12 colleges listed, sorted by earned commission DESC | Scanning for insights | Long list is hard to scan | Highlight top 3, collapse rest |
| **3. Top Performer** | Sees "MIT Australia - Sydney: $18,500 earned" at top | Pleased, validating relationship | Doesn't know context: is this good over what period? | Show time period clearly: "This Year" |
| **4. Filter by Quarter** | Clicks "This Quarter" filter | Seeking recent performance | Page reloads, loses scroll position | AJAX refresh, maintain scroll |
| **5. Sort by Outstanding** | Clicks "Outstanding Commission" column header to sort DESC | Identifying who owes most | Doesn't know if outstanding is overdue | Add "Overdue %" column |
| **6. Identify Low Performer** | Sees "College XYZ - Melbourne: $500 earned, $5,000 outstanding" | Concerned, needs attention | No indication of collection issues | Flag: "80% overdue, needs follow-up" |
| **7. Click College** | Clicks "College XYZ" to drill down | Investigating | Navigates to generic college page, not commission-specific | Deep link to payment plans for this college |
| **8. Review Payment Plans** | Sees 8 payment plans for College XYZ, 6 have overdue installments | Understanding root cause | Scattered info, hard to see pattern | Summary panel: "6 of 8 plans have overdue items" |
| **9. Return to Dashboard** | Returns to commission breakdown | Deciding next action | Lost filter selection (This Quarter) | Preserve filter state in URL |
| **10. Export for Meeting** | Wants to share top 5 colleges with team | Needs data out of system | No export option | Add "Export to CSV/PDF" |

**Key Touchpoints:**
- Dashboard (Commission Breakdown widget)
- Time period filter (all time, year, quarter, month)
- Sortable table columns
- Drill-down to college detail page

**Emotional Journey:**
- Start: Strategic → Scanning (assess performance)
- Middle: Pleased → Concerned (identify issues)
- End: Informed → Decisive (prioritize actions)

**Success Metrics:**
- Widget usage rate > 40% of Agency Admins weekly
- Users correctly identify top/bottom performers in < 30 seconds
- Commission collection improves for flagged low performers

---

### Story 6.4: Recent Activity Feed

**User Story:**
As an **Agency User**,
I want **to see a feed of recent activity in the system**,
So that **I'm aware of what's happening and can stay in sync with my team**.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** the page loads
**Then** I see a chronological feed of recent activities such as:

**And** payments recorded
**And** new payment plans created
**And** new students added
**And** new enrollments added
**And** installments marked as overdue
**And** each activity shows: timestamp, action description, user who performed it (if applicable)
**And** the feed shows the most recent 20 activities

#### User Journey Map

**Persona:** Jake - Agency User (Team Member, Remote Worker)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Login (Morning)** | Logs in, sees activity feed in sidebar/bottom of dashboard | Catching up, seeking context | Feed may be cluttered with irrelevant items | Filter by activity type |
| **2. Scan Feed** | Scans 20 recent items in 10 seconds | Staying informed | Hard to distinguish important vs routine | Highlight high-value activities (payments) |
| **3. Recent Payment** | Sees "Sarah recorded payment of $1,200 for John Doe - 2 hours ago" | Pleased, team is active | Doesn't know if this was expected | Link to payment plan context |
| **4. New Student** | Sees "Marcus added new student: Jane Smith - 5 hours ago" | Neutral, routine | May not care about new students | User preference: show/hide activity types |
| **5. Overdue Alert** | Sees "System marked installment overdue: Lisa Brown - $800 - 1 hour ago" | Alert, concerned | System activities mixed with user actions | Separate system vs user activities |
| **6. Click Activity** | Clicks on overdue alert | Investigating | Generic link to payment plan, not specific installment | Deep link to exact installment |
| **7. Review Context** | Views payment plan, sees overdue installment details | Informed, taking action | Had to navigate away from dashboard | Consider modal/overlay for quick view |
| **8. Return to Feed** | Returns to activity feed | Continuing catch-up | Feed hasn't updated, may miss new items | Auto-refresh every 60 seconds |
| **9. Yesterday's Activity** | Scrolls down, sees activities from yesterday | Thorough, diligent | Feed ends at 20 items, may need more history | "Load more" button or pagination |
| **10. Filter by User** | Wants to see only Sarah's activities (training new user) | Mentoring, reviewing | No filter by user available | Add user filter dropdown |

**Key Touchpoints:**
- Dashboard (Activity Feed widget/sidebar)
- Activity item links (to payment plans, students, etc.)
- Auto-refresh mechanism

**Emotional Journey:**
- Start: Catching up → Scanning (what happened?)
- Middle: Informed → Alert (notice important items)
- End: In sync → Confident (team is working)

**Success Metrics:**
- Activity feed viewed by 70% of users daily
- Click-through rate on activities > 30%
- Feed helps users discover 5+ actions per week

---

### Story 6.5: Overdue Payments Summary Widget

**User Story:**
As an **Agency User**,
I want **a dedicated widget highlighting all overdue payments**,
So that **I can immediately focus on the most urgent follow-ups**.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** overdue payments exist
**Then** I see a prominent widget listing all overdue installments

**And** the widget shows: student name, college, amount, days overdue
**And** the list is sorted by days overdue (most urgent first)
**And** each item is clickable and navigates to the payment plan detail
**And** the widget shows total count and total amount overdue
**And** if no overdue payments exist, the widget shows a success message

#### User Journey Map

**Persona:** Nina - Agency User (Collections Specialist)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Dashboard Access** | Logs in, immediately sees red "Overdue Payments" widget at top | Alert, focused | Widget may be visually alarming | Use urgent-but-not-panic design |
| **2. Read Summary** | Sees "5 Overdue Payments - $6,800 Total" | Assessing workload | Doesn't know if this is better/worse than yesterday | Show trend: "↓ 2 from yesterday" |
| **3. Scan List** | Reviews 5 items, sorted by days overdue | Prioritizing | List may be long, hard to see all | Show top 5, "View all 12" if more |
| **4. Most Urgent** | Sees "Alex Chen - MIT Sydney - $1,500 - 45 days overdue" | Very concerned, urgent action needed | 45 days is severe, needs escalation flag | Highlight 30+ days in red |
| **5. Click Item** | Clicks on Alex Chen's overdue item | Taking immediate action | Navigates to full payment plan, loses dashboard view | Side panel or modal for quick action |
| **6. Review History** | Views payment plan, sees 2 of 4 installments overdue | Understanding pattern | Doesn't know if student has been contacted | Show: "Last contacted: 3 days ago" |
| **7. Record Contact** | Calls student, wants to log "Contacted on [date]" | Accountable, tracking efforts | No way to log contact attempts | Add "Log Contact" action to plan |
| **8. Return to Widget** | Returns to overdue widget | Continuing through list | Alex still shows as overdue (no status change yet) | Visual indicator: "Contacted today" |
| **9. Second Item** | Tackles "Maria Lopez - $800 - 12 days overdue" | Methodical, working through list | Context switching between calls/app | Mobile-friendly for calling on phone |
| **10. All Clear** | Completes follow-ups, next day sees: "No overdue payments! 🎉" | Relieved, accomplished | Celebration may feel trivial | Gamification: "5-day streak!" |

**Key Touchpoints:**
- Dashboard (Overdue Payments widget - prominent placement)
- Overdue item detail view
- Contact logging (future feature)

**Emotional Journey:**
- Start: Alert → Focused (see overdue count)
- Middle: Concerned → Methodical (work through list)
- End: Accomplished → Relieved (all clear)

**Success Metrics:**
- Overdue items are followed up within average 6 hours of login
- Average days overdue decreases by 30% after widget launch
- Collections specialist satisfaction score > 4.5/5


## Epic 7: Reporting & Export

**Epic Goal:** Enable agencies to generate ad-hoc reports and export data for accounting software integration and stakeholder communication.

---

### Story 7.1: Payment Plans Report Generator

**User Story:**
As an **Agency User**,
I want **to generate custom reports on payment plans with flexible filtering**,
So that **I can analyze payment data for specific time periods, colleges, or students**.

**Acceptance Criteria:**

**Given** I am viewing the reports page
**When** I configure a payment plans report
**Then** I can filter by: date range, college/branch, student, payment status, commission status

**And** I can select which columns to include in the report
**And** the report displays in a table with sorting and pagination
**And** the report shows summary totals at the bottom (total amount, total paid, total commission)
**And** I can preview the report before exporting
**And** the report respects RLS and only shows my agency's data

#### User Journey Map

**Persona:** Oliver - Agency User (Financial Analyst)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Navigate to Reports** | Clicks "Reports" in main navigation | Task-oriented, analytical mindset | Reports may be buried in submenu | Prominent nav placement |
| **2. Select Report Type** | Chooses "Payment Plans Report" from dropdown | Deciding | May not know which report type to use | Descriptions for each report type |
| **3. Set Date Range** | Selects "This Year" from preset, then customizes to Jan 1 - Oct 31 | Precise, methodical | Date picker may be clunky | Quick presets + custom range |
| **4. Filter by College** | Checks "MIT Australia" and "University of Sydney" | Focusing scope | Long list of colleges is hard to scan | Search/filter colleges dropdown |
| **5. Select Columns** | Checks: Student, College, Total, Paid, Outstanding, Commission Earned, Days Overdue | Customizing output | Too many column options (20+) is overwhelming | Group columns logically, defaults selected |
| **6. Preview Report** | Clicks "Preview" button | Validating before export | Preview loads slowly if large dataset | Show row count estimate, paginate preview |
| **7. Review Preview** | Scans 50 rows in table, checks totals at bottom | Verifying accuracy | Hard to tell if filter worked correctly | Summary panel: "87 payment plans, 2 colleges" |
| **8. Adjust Filters** | Notices too many results, adds filter: "Status = Active" | Refining | Clears preview, have to click "Preview" again | Auto-refresh preview on filter change |
| **9. Sort Results** | Clicks "Outstanding" column to sort DESC | Analyzing | Sort resets pagination to page 1 | Expected behavior, OK |
| **10. Satisfied** | Totals look correct, data is what's needed | Confident, ready to export | Can't save filter configuration for next time | "Save as Template" feature |

**Key Touchpoints:**
- Reports page navigation
- Report builder form (filters, column selection)
- Preview table
- Summary totals panel

**Emotional Journey:**
- Start: Task-oriented → Deciding (choose report type)
- Middle: Methodical → Refining (configure filters)
- End: Confident → Satisfied (validated output)

**Success Metrics:**
- Report generation time < 5 seconds for 95% of queries
- Users successfully create desired report in < 3 minutes
- 60% of users save reports as templates (future)

---

### Story 7.2: CSV Export Functionality

**User Story:**
As an **Agency User**,
I want **to export reports to CSV format**,
So that **I can import payment data into Excel or accounting software**.

**Acceptance Criteria:**

**Given** I have generated a report
**When** I click "Export to CSV"
**Then** a CSV file is downloaded with all report data

**And** the CSV includes column headers
**And** the CSV respects the selected columns and filters
**And** currency amounts are formatted correctly
**And** dates are in ISO format (YYYY-MM-DD)
**And** the filename includes the report type and timestamp (e.g., "payment_plans_2025-11-10.csv")

#### User Journey Map

**Persona:** Priya - Agency Admin (Accounting Integration)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Generate Report** | Follows Story 7.1 to create payment plans report | Routine, efficient | Repetitive if doing weekly | Scheduled report delivery |
| **2. Click Export** | Clicks "Export to CSV" button | Expecting quick download | Button may be hard to find | Prominent placement, icon button |
| **3. Download Starts** | Browser downloads file: "payment_plans_2025-11-10_143022.csv" | Satisfied, automated | Filename with timestamp is verbose | OK for uniqueness |
| **4. Open in Excel** | Opens CSV in Excel | Validating | UTF-8 encoding may break in Excel (accented chars) | Include BOM for Excel compatibility |
| **5. Check Headers** | Sees proper column headers: "Student Name", "College", "Total Amount", etc. | Pleased, clear | Headers may not match accounting software | Allow custom header mapping |
| **6. Check Formatting** | Sees amounts: "1500.00" (no currency symbol) | Neutral | Amounts lack $ symbol, dates OK (ISO) | Document format for predictability |
| **7. Import to Xero** | Imports CSV into Xero accounting software | Hopeful | Xero rejects: "Amount column must be numeric" | Already numeric, Xero config issue |
| **8. Troubleshoot** | Checks CSV format, realizes Xero needs different headers | Frustrated, blocked | No guidance on accounting software formats | Provide export templates for Xero, QuickBooks |
| **9. Manual Mapping** | Manually maps columns in Xero import wizard | Tedious, time-consuming | Defeats purpose of automation | Future: direct API integration |
| **10. Success** | Data imports correctly, can reconcile payments | Relieved, completed task | Process took 15 minutes, should be 2 | Streamline with export presets |

**Key Touchpoints:**
- "Export to CSV" button
- Browser download
- Excel/accounting software import

**Emotional Journey:**
- Start: Routine → Expecting (click export)
- Middle: Frustrated → Problem-solving (format issues)
- End: Relieved → Accomplished (data imported)

**Success Metrics:**
- CSV download success rate > 99%
- CSV files open correctly in Excel/Google Sheets 100%
- Reduce accounting import time by 50%

---

### Story 7.3: PDF Export Functionality

**User Story:**
As an **Agency Admin**,
I want **to export reports to PDF format**,
So that **I can share professional-looking reports with stakeholders or college partners**.

**Acceptance Criteria:**

**Given** I have generated a report
**When** I click "Export to PDF"
**Then** a PDF file is downloaded with formatted report data

**And** the PDF includes: agency logo/name, report title, generation date, filters applied
**And** the PDF includes a formatted table with the report data
**And** the PDF includes summary totals
**And** the PDF has proper page breaks for large reports
**And** the filename includes the report type and timestamp

#### User Journey Map

**Persona:** Carlos - Agency Admin (External Communication)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Generate Report** | Creates commission report for MIT Australia, Q3 2025 | Preparing for meeting | Needs professional output for college partner | PDF must be polished |
| **2. Click Export PDF** | Clicks "Export to PDF" button | Expecting quality output | Slower than CSV (rendering time) | Show progress indicator |
| **3. PDF Generating** | Sees "Generating PDF..." spinner for 5 seconds | Waiting, hoping it's good | Impatient if takes too long | Optimize for <5 seconds |
| **4. Download Completes** | PDF downloads: "commission_report_2025-11-10.pdf" | Anticipation | Generic filename lacks context | "MIT_Australia_Q3_Commission.pdf" |
| **5. Open PDF** | Opens in PDF viewer | Assessing quality | PDF may look unprofessional if poorly formatted | Professional template design |
| **6. Review Header** | Sees agency logo, "Commission Report - MIT Australia", date | Pleased, branded | Logo is low-resolution or misaligned | High-res logo upload |
| **7. Check Table** | Reviews formatted table: clear columns, aligned numbers | Satisfied, readable | Table may overflow page if too many columns | Auto-adjust font size or landscape |
| **8. Check Page Breaks** | Scrolls to page 2, sees table continues cleanly | Confident | Awkward breaks (row split across pages) | Intelligent page breaks |
| **9. Review Totals** | Sees summary at bottom: "Total Earned: $18,500" | Validating | Totals may be on separate page if table is long | Keep totals with table |
| **10. Share with College** | Emails PDF to MIT Australia finance team | Professional, proud | Manual email is extra step | "Email PDF" button with template |
| **11. College Feedback** | College partner replies: "Looks great, thanks!" | Validated, successful | N/A | Reinforces value of polished output |

**Key Touchpoints:**
- "Export to PDF" button
- PDF generation progress indicator
- PDF viewer (external)
- Email client

**Emotional Journey:**
- Start: Preparing → Expecting (click export)
- Middle: Pleased → Confident (review quality)
- End: Professional → Proud (share with partner)

**Success Metrics:**
- PDF generation time < 10 seconds for 95% of reports
- User satisfaction with PDF quality > 4.5/5
- PDFs shared externally increase partner trust (qualitative)

---

### Story 7.4: Commission Report by College

**User Story:**
As an **Agency Admin**,
I want **to generate commission reports grouped by college/branch**,
So that **I can track what commissions are owed to me and use for claim submissions**.

**Acceptance Criteria:**

**Given** I am viewing the reports page
**When** I generate a commission report
**Then** I see commission breakdown by college and branch for a selected time period

**And** each row shows: college, branch, total paid by students, commission rate, earned commission, outstanding commission
**And** the report includes date range filter
**And** the report is exportable to CSV and PDF
**And** the PDF version is formatted for submission to college partners (clean, professional)
**And** the report shows supporting details: list of students and payment plans contributing to commission

#### User Journey Map

**Persona:** Fatima - Agency Admin (Commission Claims)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Navigate to Reports** | Goes to Reports → "Commission Report" | Monthly routine, preparing claims | Repetitive monthly task | Automate monthly generation |
| **2. Select Date Range** | Selects "Last Month" (October 2025) | Focused, precise | May forget which month already claimed | Show "Last claimed: September" |
| **3. Preview Report** | Clicks "Generate", sees grouped report | Reviewing | Takes 10 seconds to load (complex query) | Cache common date ranges |
| **4. Review MIT Australia** | Sees: MIT Australia - Sydney: $18,500 earned, $2,000 outstanding | Pleased, large commission | Doesn't know how many students/plans | Expand row to see details |
| **5. Expand Details** | Clicks expand arrow, sees 12 students, 15 payment plans | Validated, thorough | Details may be too verbose for PDF | Summarize in PDF, full details in CSV |
| **6. Export to PDF** | Clicks "Export to PDF" for MIT claim submission | Preparing deliverable | Generic PDF template | College-specific template with their logo |
| **7. Review PDF** | Opens PDF, sees clean professional layout | Confident | Missing student list in PDF | Configurable: include/exclude student list |
| **8. Manual Annotation** | Adds sticky note: "Bank details for transfer" | Workaround | Can't add custom fields to PDF | Allow custom note/reference field |
| **9. Email to MIT** | Emails PDF invoice to MIT finance | Professional, expecting payment | Manual process, slow | Future: API submission to college portal |
| **10. Track Claim** | Manually records in spreadsheet: "MIT - Oct - $18.5K - Submitted Nov 10" | Organized, but tedious | No built-in claim tracking | Add claim status: submitted/paid/overdue |
| **11. Repeat for Other Colleges** | Generates separate reports for 8 other colleges | Tedious, repetitive | Takes 2 hours total | Batch export: one PDF per college |

**Key Touchpoints:**
- Reports → Commission Report
- Date range filter
- Expandable row details
- PDF export
- External: email, college finance system

**Emotional Journey:**
- Start: Routine → Focused (generate report)
- Middle: Pleased → Confident (review amounts)
- End: Professional → Tedious (manual process for multiple colleges)

**Success Metrics:**
- Report generation time < 5 seconds
- PDF quality rated 4.5+/5 by colleges
- Claim processing time reduced by 40%

---

### Story 7.5: Student Payment History Report

**User Story:**
As an **Agency User**,
I want **to view and export complete payment history for individual students**,
So that **I can answer student inquiries and maintain records for dispute resolution**.

**Acceptance Criteria:**

**Given** I am viewing a student's detail page
**When** I request a payment history report
**Then** I see a chronological list of all payment plans and installments for that student

**And** each entry shows: date, payment plan, college/branch, amount, payment status, paid date
**And** the report shows total paid to date and total outstanding
**And** the report is exportable to PDF for sharing with the student
**And** the PDF is formatted as a clear payment statement
**And** I can filter by date range (all time, this year, custom)

#### User Journey Map

**Persona:** Aisha - Agency User (Student Support)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Student Inquiry** | Receives email: "Can you send me my payment history?" from student Alex | Helpful, service-oriented | May not remember which plans Alex has | Quick search by student name |
| **2. Search Student** | Searches "Alex Chen" in Students page | Focused | Multiple Alex's, need full name/passport | Disambiguate in search results |
| **3. Open Student Profile** | Clicks on Alex Chen's profile | Reviewing | Profile may not show full payment context | Highlight payment summary at top |
| **4. Click Payment History** | Clicks "Payment History" button | Expecting comprehensive view | Button may be hard to find | Prominent tab or button |
| **5. View History** | Sees chronological list: 3 payment plans, 12 installments | Assessing | Default "All Time" shows too much, back to 2020 | Default to "This Year" |
| **6. Filter to This Year** | Selects "2025" from date filter | Refining | Filter reloads page, loses scroll | AJAX filter, maintain state |
| **7. Review Details** | Sees: MIT Sydney - $6,000 plan, 4 installments (3 paid, 1 pending) | Informed, ready to respond | Installments mixed across 3 plans, hard to track | Group by payment plan |
| **8. Export to PDF** | Clicks "Export PDF" to send to student | Preparing deliverable | Generic statement may confuse student | Student-friendly language |
| **9. Review PDF** | Opens PDF, sees: "Payment Statement for Alex Chen" | Satisfied, professional | Lacks context: "This is for MIT Sydney program" | Include enrollment details |
| **10. Email to Student** | Forwards PDF to student with message | Helpful, responsive | Manual email, context switching | "Email to Student" button pre-fills |
| **11. Student Response** | Student replies: "Thanks! But I thought I paid $1,500 last month?" | Concerned, investigating | Student confused by partial payment | Clearly show partial payments |
| **12. Verify in System** | Returns to payment history, finds partial payment entry | Validating | Partial payment shows as "$1,200 of $1,500 paid" | Good, but needs to be in PDF |
| **13. Regenerate PDF** | Exports updated PDF with partial payment details | Resolved | Had to regenerate, minor inconvenience | Real-time PDF generation is OK |

**Key Touchpoints:**
- Student profile page
- Payment History tab
- Date range filter
- PDF export
- Email client

**Emotional Journey:**
- Start: Helpful → Focused (find student)
- Middle: Informed → Satisfied (review history)
- End: Responsive → Resolved (answer inquiry)

**Success Metrics:**
- Payment history accessed for 20% of students per month
- Student inquiries resolved in < 5 minutes
- Student satisfaction with statements > 4.5/5


## Epic 8: Audit & Compliance Infrastructure

**Epic Goal:** Implement comprehensive audit logging and data governance features that ensure compliance, support dispute resolution, and build trust through complete transparency.

---

### Story 8.1: Comprehensive Audit Logging

**User Story:**
As a **system**,
I want **all critical actions to be automatically logged with full context**,
So that **there's a complete audit trail for compliance, security, and dispute resolution**.

**Acceptance Criteria:**

**Given** users are performing actions in the system
**When** any of the following actions occur:
- User login/logout
- Payment plan creation or modification
- Installment payment recording
- Student/college/enrollment CRUD operations
- User role changes
- Agency settings changes

**Then** an audit log entry is created with: timestamp, user_id, action_type, entity_type, entity_id, old_values (JSON), new_values (JSON), ip_address, user_agent

**And** audit logs are immutable (insert-only, no updates/deletes)
**And** audit logs are retained indefinitely
**And** RLS policies protect audit logs (users can only view their agency's logs)

#### User Journey Map

**Persona:** System (Audit Logging Middleware)

| Journey Stage | System Actions | System State | Pain Points | Opportunities |
|---------------|----------------|--------------|-------------|---------------|
| **1. User Action Initiated** | User (e.g., Sarah) clicks "Record Payment" | Intercepted by middleware | May slow down request | Async logging to avoid latency |
| **2. Capture Context** | Extract: user_id, ip_address, user_agent from request | Gathering metadata | IP may be proxy/VPN, not real user | Log both proxy and X-Forwarded-For |
| **3. Capture Before State** | Query current installment: `{ amount: 1500, status: 'pending', paid_amount: null }` | Preserving history | Extra DB query adds latency | Only log changes, not full record |
| **4. Execute Action** | Update installment: `{ status: 'paid', paid_amount: 1500, paid_date: '2025-11-10' }` | Applying change | Transaction may fail after logging | Log AFTER successful commit |
| **5. Capture After State** | Record new values: `{ amount: 1500, status: 'paid', paid_amount: 1500, paid_date: '2025-11-10' }` | Comparing | Large JSON fields consume storage | Compress or store diffs only |
| **6. Write Audit Log** | INSERT into audit_logs with all captured data | Persisting | Write may fail silently | Use DB trigger as backup |
| **7. Immutable Storage** | Audit log has no UPDATE or DELETE permissions | Protected | No way to fix typos in logs | Accept immutability, log corrections separately |
| **8. RLS Check** | Verify agency_id is set in log for isolation | Compliant | Agency_id may be NULL for system actions | Allow NULL for system, separate from user actions |
| **9. Retention** | Audit log retained indefinitely (no expiration) | Complying | Storage grows unbounded | Archive old logs to cold storage after 7 years |
| **10. Monitoring** | Log success/failure metrics to monitoring service | Observable | High failure rate may go unnoticed | Alert on >1% logging failure rate |

**Key Touchpoints:**
- API middleware (all protected routes)
- Database triggers (backup logging)
- audit_logs table
- Monitoring/alerting service

**Success Metrics:**
- Audit log capture rate > 99.9%
- Zero data loss in audit logs
- Audit logs pass compliance audit (SOC 2, GDPR)

---

### Story 8.2: Audit Log Viewer Interface

**User Story:**
As an **Agency Admin**,
I want **to view and search audit logs for my agency**,
So that **I can investigate issues, verify actions, and ensure accountability**.

**Acceptance Criteria:**

**Given** I am an Agency Admin
**When** I access the audit logs page
**Then** I see a filterable list of all audit events for my agency

**And** I can filter by: date range, user, action type, entity type
**And** I can search by entity ID or keyword
**And** each log entry shows: timestamp, user name, action description, affected entity
**And** I can expand a log entry to see full details including old/new values diff
**And** I can export audit logs to CSV for compliance reporting
**And** the interface shows logs in reverse chronological order (newest first)

#### User Journey Map

**Persona:** Kevin - Agency Admin (Investigating Dispute)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Dispute Arises** | Student claims: "I paid $1,500 but system shows $1,200" | Concerned, need to verify | Manual investigation is time-consuming | Audit logs provide truth |
| **2. Navigate to Audit Logs** | Goes to Settings → Audit Logs | Investigative mindset | Feature may be hard to find | Admin dashboard link |
| **3. Filter by Student** | Searches for student name "Alex Chen" in search box | Focused | Search may not find entity ID | Search across all fields (student name, plan ID) |
| **4. Filter by Date** | Selects date range: October 1-31 (when payment was made) | Narrowing scope | Date picker is clunky | Quick presets: "Last 7 days", "Last 30 days" |
| **5. Filter by Action** | Selects "Payment Recorded" from action type dropdown | Refining | Too many irrelevant logs (logins, etc.) | Action type filter is key |
| **6. View Results** | Sees 2 audit logs: Oct 15 and Oct 22 | Analyzing | Need to click each to see details | Show key info in list: amount changed |
| **7. Expand First Log** | Clicks Oct 15 log, sees diff: `paid_amount: null → 1200` | Verifying | Diff view may be cryptic (raw JSON) | Human-readable diff: "$0 → $1,200" |
| **8. Expand Second Log** | Clicks Oct 22 log, sees diff: `paid_amount: 1200 → 1500` | Aha moment! | Who made the change? | Show user name prominently |
| **9. Identify User** | Sees "Changed by: Sarah Johnson" | Understanding | Why did Sarah update? No comment field | Future: require notes on edits |
| **10. Resolve Dispute** | Calls student: "I see two payments: $1,200 on Oct 15, then corrected to $1,500 on Oct 22" | Confident, authoritative | Manual phone call, slow | Screenshot/export single log entry |
| **11. Export for Records** | Exports audit logs to CSV for documentation | Covering bases | CSV export includes all logs, not just filtered | Export respects current filters |

**Key Touchpoints:**
- Settings → Audit Logs page
- Search/filter form
- Expandable log entry (diff view)
- CSV export

**Emotional Journey:**
- Start: Concerned → Investigative (dispute arises)
- Middle: Focused → Aha moment (find evidence)
- End: Confident → Resolved (answer student)

**Success Metrics:**
- Dispute resolution time reduced by 60%
- Audit logs accessed 10+ times per month per admin
- Zero disputes unresolved due to lack of audit trail

---

### Story 8.3: Data Retention Policy Configuration

**User Story:**
As an **Agency Admin**,
I want **to configure data retention policies for my agency**,
So that **I can comply with data protection regulations and manage storage**.

**Acceptance Criteria:**

**Given** I am an Agency Admin
**When** I access data retention settings
**Then** I can configure retention periods for: completed payment plans, cancelled enrollments, inactive students

**And** I can preview what data will be affected by retention policies
**And** I can manually trigger archival or deletion of old data
**And** the system warns me before deleting any data
**And** audit logs are retained indefinitely regardless of other retention settings
**And** I can export data before deletion

#### User Journey Map

**Persona:** Linda - Agency Admin (Compliance Officer)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Compliance Requirement** | Receives GDPR audit: "Data retention policy must be documented" | Pressure, regulatory concern | Doesn't know what pleeno's default policy is | Clear documentation in app |
| **2. Navigate to Settings** | Goes to Settings → Data Retention | Task-oriented | Setting may be hard to find | Admin dashboard checklist |
| **3. Review Current Policy** | Sees: "Completed plans: Keep forever, Cancelled enrollments: Keep forever, Inactive students: Keep forever" | Concerned, non-compliant | "Keep forever" violates GDPR "storage limitation" | Suggest defaults: 7 years |
| **4. Research Requirements** | Checks GDPR guidance: "Keep financial records 7 years, personal data as needed" | Informed, planning | Complex regulations, uncertainty | Link to compliance resources |
| **5. Configure Policy** | Sets: Completed plans: 7 years, Cancelled enrollments: 3 years, Inactive students: 5 years | Decisive, compliant | Fear of deleting wrong data | Preview affected records |
| **6. Preview Affected Data** | Clicks "Preview", sees: "12 completed plans from 2016-2018 (7+ years old)" | Cautious, verifying | Large number may be alarming | Reassure: export before delete |
| **7. Export Before Deletion** | Clicks "Export Data" to save archive | Prudent, cautious | Export takes 30 seconds, impatient | Show progress, explain importance |
| **8. Review Warning** | Sees warning modal: "This will permanently delete 12 payment plans. Continue?" | Nervous, final check | Can't undo, high stakes | Soft delete option (recoverable for 30 days) |
| **9. Confirm Deletion** | Types "DELETE" to confirm, clicks "Delete Data" | Committed, anxious | Immediate deletion is scary | Implement soft delete with grace period |
| **10. Deletion Complete** | Sees success message: "12 payment plans archived and deleted" | Relieved, compliant | "Deleted" sounds permanent | Clarify: "Archived to [location], removed from active database" |
| **11. Audit Log** | Checks audit log, sees deletion event with user, timestamp, record count | Validated, accountable | Audit log doesn't show WHAT was deleted | Include archive file reference in log |

**Key Touchpoints:**
- Settings → Data Retention
- Retention policy form
- Preview affected data
- Export/archive process
- Confirmation modal
- Audit log

**Emotional Journey:**
- Start: Pressure → Task-oriented (compliance requirement)
- Middle: Cautious → Verifying (preview and export)
- End: Anxious → Relieved (deletion complete, compliant)

**Success Metrics:**
- 100% of agencies configure retention policy within 6 months
- Zero accidental data loss due to retention
- Compliance audit pass rate 100%

---

### Story 8.4: Change History for Payment Plans

**User Story:**
As an **Agency User**,
I want **to view the complete change history for any payment plan**,
So that **I can track modifications and resolve disputes about payment terms**.

**Acceptance Criteria:**

**Given** I am viewing a payment plan detail page
**When** I access the change history section
**Then** I see a timeline of all modifications made to the payment plan

**And** each entry shows: timestamp, user who made the change, what changed (field-level diff)
**And** the timeline includes: plan creation, installment additions/edits, payment recordings, status changes
**And** I can expand each entry to see before/after values
**And** the timeline is read-only (cannot modify history)
**And** the change history includes system-generated changes (e.g., automated status updates)

#### User Journey Map

**Persona:** Ryan - Agency User (Dispute Resolution Specialist)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. College Dispute** | MIT finance emails: "Your commission claim shows $18,500 but our records show $16,000" | Alert, need evidence | Manual verification is slow | Change history provides proof |
| **2. Open Payment Plan** | Searches for MIT payment plans, finds relevant plan #4521 | Investigating | May have dozens of MIT plans, hard to find | Better search: plan by amount or date |
| **3. Review Current State** | Sees plan total: $185,000, commission rate: 10%, expected commission: $18,500 | Confirming | Current state matches claim, but MIT disputes it | Need historical view |
| **4. Click Change History** | Clicks "Change History" tab | Seeking evidence | Tab may be hidden or not obvious | Prominent tab on plan detail page |
| **5. View Timeline** | Sees chronological timeline: 8 events from plan creation to today | Scanning | Long timeline is hard to scan | Highlight key changes (amount, rate) |
| **6. Identify Creation** | Sees first event: "Sep 1 - Plan created by Sarah - Total: $150,000, Rate: 10%" | Baseline established | Original values may not be the issue | Continue timeline |
| **7. Find Modification** | Sees event: "Oct 15 - Plan updated by Marcus - Total: $150,000 → $185,000" | Aha moment! | Doesn't explain WHY it changed | Notes field: "Added 3 additional semesters" |
| **8. Expand Details** | Clicks expand on Oct 15 event, sees full diff: old vs new JSON | Validating | JSON diff is technical, hard to read | Human-readable: "Total increased by $35,000" |
| **9. Check Commission Calc** | Confirms: $185,000 × 10% = $18,500 (correct) | Confident, armed with proof | MIT may not have updated their records | Screenshot timeline to send |
| **10. Respond to MIT** | Emails MIT: "Plan was updated on Oct 15 to add semesters, see attached screenshot" | Authoritative, resolving | Manual screenshot, email is extra work | "Export Timeline as PDF" button |
| **11. MIT Acknowledgment** | MIT replies: "Confirmed, our records were outdated. $18,500 approved." | Relieved, successful | Dispute took 2 hours, stressful | Change history saved the day |

**Key Touchpoints:**
- Payment plan detail page
- Change History tab
- Timeline view (chronological events)
- Expandable diff view
- Screenshot/export functionality

**Emotional Journey:**
- Start: Alert → Investigating (dispute arises)
- Middle: Scanning → Aha moment (find proof)
- End: Confident → Relieved (dispute resolved)

**Success Metrics:**
- Disputes resolved with change history in < 30 minutes
- Change history accessed for 15% of payment plans
- Zero disputes lost due to lack of evidence

---

### Story 8.5: Data Export for Compliance

**User Story:**
As an **Agency Admin**,
I want **to export all agency data for compliance and backup purposes**,
So that **I can meet data portability requirements and maintain offline backups**.

**Acceptance Criteria:**

**Given** I am an Agency Admin
**When** I request a full data export
**Then** the system generates a complete export of all my agency's data in JSON format

**And** the export includes: agency settings, users, students, colleges, branches, enrollments, payment plans, installments, payments
**And** the export excludes: audit logs (separate export), deleted/archived records (optional)
**And** the export is downloadable as a ZIP file with structured JSON files
**And** the export includes a manifest file listing all included data
**And** I can schedule automatic monthly exports to cloud storage (optional)
**And** the export process runs asynchronously with email notification when complete

#### User Journey Map

**Persona:** Susan - Agency Admin (Risk Management)

| Journey Stage | User Actions | Thoughts & Feelings | Pain Points | Opportunities |
|---------------|-------------|---------------------|-------------|---------------|
| **1. Backup Strategy** | Decides: "We need offline backups in case of data breach or system failure" | Proactive, risk-aware | Doesn't know if pleeno has backup features | Onboarding: promote data export |
| **2. Navigate to Export** | Goes to Settings → Data Export | Seeking control | Feature may be buried in settings | Admin dashboard: "Backup Your Data" |
| **3. Review Options** | Sees: "Full Data Export" and "Audit Logs Export" as separate options | Understanding | Doesn't know what's included in "Full" | Clear description of included entities |
| **4. Request Full Export** | Clicks "Request Full Data Export" | Initiating | Expects instant download, may be disappointed | Set expectation: "Takes 2-5 minutes" |
| **5. Processing Notification** | Sees: "Your export is being generated. You'll receive an email when it's ready." | Waiting, hopeful | Can't track progress | Show progress bar or ETA |
| **6. Email Notification** | Receives email 3 minutes later: "Your pleeno data export is ready for download" | Relieved, efficient | Email may go to spam | Use authenticated sender, clear subject |
| **7. Download ZIP** | Clicks link in email, downloads "pleeno_export_2025-11-10_agency-123.zip" (15 MB) | Anticipating | Large file size may be slow | Compress efficiently |
| **8. Extract ZIP** | Extracts ZIP, sees 10 JSON files: manifest.json, students.json, payment_plans.json, etc. | Organized, impressed | May not know how to use JSON files | Include README.txt with instructions |
| **9. Review Manifest** | Opens manifest.json, sees: `{ "export_date": "2025-11-10", "agency_id": "123", "record_counts": { "students": 120, "payment_plans": 87, ... } }` | Validated, thorough | JSON format is technical | Also include manifest.txt for readability |
| **10. Store Backup** | Uploads ZIP to Google Drive for safekeeping | Satisfied, prepared | Manual upload is extra step | Future: auto-export to Google Drive/Dropbox |
| **11. Schedule Monthly** | Returns to pleeno, enables "Automatic Monthly Exports" | Automating, empowered | Doesn't know where auto-exports are stored | Cloud storage integration or email delivery |
| **12. Compliance Audit** | During audit, provides export files as evidence of data portability | Confident, compliant | Auditor may question JSON format | Provide CSV option or conversion tool |

**Key Touchpoints:**
- Settings → Data Export
- Export request form
- Email notification
- Download link (secure, expiring)
- ZIP file with JSON data

**Emotional Journey:**
- Start: Proactive → Seeking control (need backups)
- Middle: Waiting → Relieved (export ready)
- End: Satisfied → Confident (backup secured, compliant)

**Success Metrics:**
- Export completion rate > 99%
- Export completion time < 5 minutes for 95% of agencies
- 40% of agencies enable automatic monthly exports
- Zero data loss in exports (validated by checksums)

---

**End of User Journey Maps Document**

This document provides comprehensive user journey mapping for all user stories in EPICs 5-8, capturing the emotional journeys, pain points, and opportunities for each persona interacting with pleeno's intelligent automation, business intelligence, reporting, and compliance features.
