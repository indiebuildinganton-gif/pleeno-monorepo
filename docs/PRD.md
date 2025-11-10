# Pleeno - Product Requirements Document

**Author:** anton
**Date:** 2025-11-10
**Version:** 1.0

---

## Executive Summary

Pleeno is an intelligent financial command center for international study agencies—transforming how they manage student payments, commission tracking, and cash flow across the complex three-party relationship between students, agencies, and educational institutions.

The platform replaces fragmented spreadsheet-based workflows with automated tracking, predictive intelligence, and complete financial visibility—enabling agencies to recover lost revenue, save 10-20 hours per week, and scale confidently.

### What Makes This Special

**The Magic of Pleeno:**

Pleeno transforms agencies from a state of perpetual financial anxiety—"Sunday night spreadsheet dread" and the "sickening feeling of missed money"—into confident, data-driven operations where every dollar is tracked, every commission is recovered, and cash flow is predictable.

**The moment that makes people go "wow":**

When an agency owner opens their dashboard Monday morning and instantly sees:
- 3 payments auto-updated to "Paid" over the weekend (no manual work)
- 2 installments flagged "Due Soon" (proactive, not reactive)
- 1 overdue payment auto-flagged (nothing falls through cracks)
- 90-day cash flow projection showing exactly when $67K in commissions will arrive

**This is the transformation:** From chaos and uncertainty to clarity and control—in seconds, not hours.

---

## Project Classification

**Technical Type:** SaaS B2B Web Application
**Domain:** Business/Financial Operations (International Education Sector)
**Complexity:** Medium

**Project Classification Details:**

Pleeno is a multi-tenant B2B SaaS platform targeting small-to-medium international study agencies (10-500 students/year). The platform combines:
- **Data management**: Multi-entity relational data (agencies, colleges, students, payment plans, installments)
- **Automated intelligence**: Time-based status tracking and predictive cash flow analysis
- **Business intelligence**: Real-time dashboards, KPIs, and actionable insights
- **Enterprise security**: Row-Level Security, audit logging, role-based access control

The domain is specialized (international education commission tracking) but not heavily regulated—no healthcare compliance, no financial services licensing, no government certification required. Primary concerns are data security, multi-tenant isolation, and calculation accuracy.

---

## Success Criteria

**What winning looks like for Pleeno:**

### User Success Metrics

1. **Time Freedom Delivered**
   - Agencies save 10-20 hours/week on payment tracking and reconciliation
   - Payment status queries answered in <30 seconds (vs. 5-15 minutes with spreadsheets)
   - Weekly admin burden reduced by 50%+

2. **Financial Control Restored**
   - Zero missed commission claims (100% tracking accuracy)
   - 10-15% increase in recovered revenue from previously "lost" commissions
   - Cash flow visibility: agencies can project 90-day revenue with confidence

3. **Professional Confidence Gained**
   - Instant payment status answers to students, colleges, and team members
   - Clean commission documentation reduces college payment delays
   - Audit trail eliminates disputes and "he said, she said" conflicts

4. **Growth Enablement**
   - Platform scales effortlessly from 50 to 500+ students without performance degradation
   - Multi-user collaboration with role-based access replaces single-spreadsheet bottleneck
   - Strategic insights (top colleges, trends) inform business decisions

### Business Objectives

1. **Become the standard operating system for international study agencies**
   - Replace spreadsheet-based financial management across the industry
   - Target: 40%+ market penetration in English-speaking markets within 3 years

2. **Deliver measurable ROI within first month**
   - Pilot agencies report 50%+ time savings in first 30 days
   - At least 2 pilot agencies discover and recover "lost" commissions through Pleeno tracking
   - 80%+ of pilot agencies would recommend to peers

3. **Validate product-market fit**
   - 5-10 pilot agencies successfully migrate from spreadsheets
   - 90%+ pilot agencies convert to paying customers post-trial
   - Churn rate <5% annually

### Product Performance Metrics

- Dashboard load time: <2 seconds
- Report generation: <5 seconds for standard reports
- System uptime: 99.9%
- Data accuracy: Zero calculation errors in commission logic
- Multi-tenant isolation: Zero data leakage between agencies

**Success means:** Agency owners experience the "wow moment" of complete financial clarity and never want to go back to spreadsheets.

---

## Product Scope

### MVP - Minimum Viable Product

**Core Value Proposition:**
Complete payment tracking visibility and automated status intelligence for agencies—enabling them to recover lost revenue, save time, and gain cash flow certainty.

**MVP Features:**

**1. Data Centralization Foundation**
- Multi-agency registry with complete data isolation (Row-Level Security)
- Role-based access: Admin and Agency User roles
- User profile management
- College directory with commercial terms (commission %, GST settings, bonus structures)
- Branch management per college
- Student database with contact info and visa status (linked to payment plans only)

**2. Flexible Payment Plan Management**
- Create multiple payment plans per student
- Manual and automated installment creation
- Flexible installment scheduling (dates, amounts)
- Edit existing plans with full audit trail
- Advanced filtering: by status, college, date range, student
- Quick search for specific payment plans
- Commission calculation engine (auto-calculate commissionable value, deduct materials/admin fees, handle GST)

**3. Automated Payment Status Tracking (The Intelligent Bot)**
- Automatic status updates based on dates and payment confirmation:
  - Draft: Payment plan being created
  - Pending: Not paid, before due date
  - Due Soon: Auto-flagged N days before due date (configurable, default 5 days)
  - Overdue: Auto-flagged after 5pm on due date
  - Paid: Student payment confirmed
  - Completed: Agency received commission from college
- Centralized notes system attached to installments
- Payment agreements and special terms documented
- Manual status override capabilities

**4. Business Intelligence Dashboard**
- Key KPIs panel:
  - Total commissions due
  - Total overdue amounts
  - Income received to date
  - 90-day cash flow projection
- Cash flow visualization: timeline chart (past, present, future payments stacked by status)
- Action modules:
  - Overdue payments list (proactive follow-up)
  - Upcoming due dates list (proactive management)
  - Quick-action buttons
- Strategic analysis charts:
  - Top 5 colleges by revenue
  - New payment plans per month (growth tracking)
  - Trend visualizations

**5. Enterprise Security & Audit Infrastructure**
- Multi-tenant architecture with Row-Level Security (RLS)
- Comprehensive audit log (track all create/edit/delete operations)
- Entities logged: Colleges, Students, Payment Plans, Installments, User Profiles
- Record: Who, What, When for compliance and dispute resolution

**6. Flexible Reporting Engine**
- Report builder: filter by dates, colleges, students, status
- Ad-hoc report generation
- CSV export for accounting software integration
- PDF export for stakeholder sharing
- Pre-built analytics and charts (eliminate need for Excel/Power BI)

**MVP Success Criteria:**
- 5-10 pilot agencies migrate successfully
- 50%+ time savings reported
- <30 second payment status query response time
- Zero critical calculation errors
- Dashboard used weekly by 90%+ of users

### Growth Features (Post-MVP)

**Phase 2: Automation & Integration (Months 6-9)**
- Automated email notifications (payment reminders to students, commission claim alerts)
- Bank reconciliation integration (auto-match payments to installments)
- Accounting software sync (QuickBooks, Xero)
- Automated commission claim generation and submission to colleges
- Workflow automation rules (if X then Y logic)

**Phase 3: Ecosystem Expansion (Months 9-15)**
- Student self-service portal (view payment plans, make payments, download receipts)
- College partner portal (receive commission claims, submit payments, view analytics)
- Agency network features (benchmark against industry averages)
- CRM integration (Salesforce, HubSpot)
- Email platform integrations

**Phase 4: Mobile & Multi-Currency (Months 15-18)**
- Native iOS/Android mobile apps
- Multi-currency support with conversion tracking
- Offline capability for mobile users

### Vision (Future)

**Phase 5: Advanced Intelligence (Year 2)**
- AI-powered cash flow forecasting (machine learning on payment patterns)
- Predictive risk scoring (identify students likely to default)
- Automated college performance insights (payment timeliness analysis)
- Smart recommendations (optimal payment plan structures based on historical data)
- Natural language query interface ("Show me overdue payments from Australian colleges")

**Phase 6: Platform Play (Year 2-3)**
- White-label version for large agency networks
- Open API platform for third-party integrations
- Marketplace for agency services (insurance, visa, accommodation)
- Advanced financial features (invoicing, expense tracking, P&L reporting)

---

## SaaS B2B Specific Requirements

### Multi-Tenancy Architecture

**Requirement:** Complete data isolation between agencies with enterprise-grade security

**Technical Implementation:**
- PostgreSQL Row-Level Security (RLS) policies enforce tenant isolation at database layer
- Every table includes `agency_id` foreign key
- All queries automatically filtered by authenticated user's agency
- Zero data leakage between agencies (verified through security testing)

**User Experience:**
- Each agency has unique subdomain or tenant identifier
- Users only see data belonging to their agency
- No cross-agency queries or data access possible

### Role-Based Access Control (RBAC)

**MVP Roles:**

1. **Admin Role**
   - Full access to all agency data
   - Manage users (invite, remove, change roles)
   - Configure agency settings (commission structures, default terms)
   - Access audit logs
   - Export reports
   - Typical users: Agency owner, finance manager

2. **Agency User Role**
   - View and edit payment plans
   - Add/edit students and colleges
   - View dashboards and reports
   - Add notes to installments
   - Cannot manage users or access audit logs
   - Typical users: Student counselors, administrative staff

**Future Roles (Post-MVP):**
- Read-Only Viewer: View dashboards and reports only
- Student Portal User: Students viewing their own payment plans
- College Partner User: College finance teams accessing commission claims

### Subscription & Billing Model (For Reference)

**Pricing Strategy (TBD - requires market research):**

Potential models:
1. Per-user pricing: $49-99/user/month
2. Per-student pricing: $2-5/active student/month
3. Tiered pricing: Starter ($99/mo for 1-50 students), Growth ($299/mo for 51-200), Enterprise (custom)

**Billing Requirements (Future):**
- Subscription management integration (Stripe Billing)
- Usage tracking and metering
- Invoice generation
- Payment method management

### Onboarding & Data Migration

**Critical for MVP Success:**

**Onboarding Flow:**
1. Agency signup and account creation
2. Admin user invited, sets password
3. Guided setup wizard:
   - Import college directory (CSV upload or manual entry)
   - Add team members with roles
   - Configure agency settings (default commission %, GST rules)
4. Data migration from spreadsheets:
   - Download CSV template
   - Map columns (student name, college, installment dates, amounts)
   - Upload and validate data
   - Review and confirm import
5. First dashboard view (immediate value)

**Data Migration Tools:**
- CSV import with column mapping
- Data validation and error reporting
- Rollback capability if import fails
- Manual entry fallback for small datasets

**Onboarding Success Metrics:**
- Time to first dashboard view: <15 minutes
- Data migration completion rate: 80%+
- User reaches "aha moment" (sees auto-flagged overdue payment or cash flow projection) within first session

### Integration Requirements

**MVP Integrations:**
- CSV export (accounting software compatibility)
- PDF export (stakeholder reporting)

**Post-MVP Integrations:**
- Accounting: QuickBooks, Xero (bi-directional sync)
- Bank feeds: Automated bank reconciliation (Plaid, Yodlee)
- Email platforms: Gmail, Outlook (payment reminders, commission claims)
- CRM: Salesforce, HubSpot (student data sync)
- Payment gateways: Stripe, PayPal (direct payment processing)

### Tenant Management & Administration

**Agency Settings:**
- Agency profile (name, logo, contact info)
- Default commission structure (%, GST rules)
- Payment status automation rules (due-soon threshold, overdue trigger time)
- User management (invite, remove, change roles)
- Notification preferences (email alerts, frequency)

**User Management:**
- Invite users via email
- Assign roles (Admin, Agency User)
- Deactivate users (retain audit trail)
- Password reset and account recovery

**Audit & Compliance:**
- Comprehensive audit log accessible to Admins
- Filter audit log by entity, user, date range
- Export audit log for compliance reporting
- Immutable log entries (cannot be deleted or modified)

---

## User Experience Principles

**Design Philosophy: Clarity, Speed, and Confidence**

Pleeno's UX should reinforce the transformation from chaos to control through:

### Visual Personality

**Professional yet approachable:**
- Clean, modern dashboard aesthetic (not sterile corporate, not playful startup)
- Data-forward design: numbers, charts, and insights take center stage
- Color coding for status (red for overdue, yellow for due soon, green for paid)
- Visual hierarchy: KPIs prominent, details accessible but not overwhelming

**Inspiration:**
- Stripe Dashboard (clean, data-rich, professional)
- Linear (fast, keyboard-driven, minimal friction)
- Notion (flexible, intuitive, human-friendly)

### Key Interaction Patterns

**1. Dashboard-First Experience**
- Every login lands on the main dashboard (immediate visibility)
- Dashboard is the "home base"—all navigation radiates from here
- Glanceable KPIs answer "How is my business doing?" in 3 seconds

**2. Progressive Disclosure**
- Summary → Details → Actions
- Dashboard shows overdue count → Click to see overdue list → Click installment to see details/add notes
- Minimize cognitive load: show what matters now, hide the rest until needed

**3. Contextual Actions**
- Quick actions available where needed (no hunting through menus)
- Inline editing: click amount to edit, click date to reschedule
- Hover states reveal actions (edit, delete, add note)

**4. Search & Filter Everywhere**
- Global search bar (find any student, college, payment plan instantly)
- Filter panels on all list views (payment plans, students, colleges)
- Saved filters for common queries ("Show me overdue payments from Australian colleges")

**5. Keyboard-Friendly**
- Common actions accessible via keyboard shortcuts (future enhancement)
- Tab navigation works intuitively
- Fast data entry for power users

### Critical User Flows

**Flow 1: Answer Payment Status Query (Target: <30 seconds)**

Scenario: Student calls asking "What's my payment status?"

1. User types student name in global search (2 seconds)
2. Student profile appears, showing active payment plans (2 seconds)
3. Click payment plan to see installment details with statuses (3 seconds)
4. View notes if needed for context (5 seconds)
5. Answer student confidently with exact dates and amounts

**Flow 2: Identify Overdue Payments (Target: <10 seconds)**

Scenario: Monday morning, user wants to see which payments are overdue

1. User opens dashboard (2 seconds to load)
2. Overdue KPI shows count (immediate visibility)
3. Click "Overdue Payments" action module (1 second)
4. See prioritized list with college, student, amount, days overdue
5. Click installment to add follow-up note or mark as paid

**Flow 3: Create New Payment Plan (Target: <3 minutes)**

Scenario: New student enrolled, agency needs to set up payment tracking

1. Navigate to Payment Plans → "New Payment Plan" (2 clicks)
2. Select student (search or create new)
3. Select college (search existing)
4. Enter payment details:
   - Gross tuition amount
   - Materials fee (auto-deducted)
   - Admin fee (auto-deducted)
   - GST setting (auto-applied from college default)
   - Commission % (auto-applied from college default)
5. Create installments:
   - Choose "Auto-create equal installments" (enter count, start date)
   - OR manually add installment rows (date, amount)
6. Review commissionable value calculation (auto-displayed)
7. Save payment plan → Installments auto-set to "Draft" status
8. Status bot begins monitoring (auto-transitions to "Pending" when dates reached)

**Flow 4: Review Cash Flow Projection (Target: <5 seconds)**

Scenario: Friday planning, agency owner wants to forecast next 90 days

1. Dashboard already open (or loads in <2 seconds)
2. Scroll to cash flow visualization chart (immediate visibility)
3. Chart shows timeline: Past payments (green), Pending (yellow), Projected (blue dashed)
4. Hover over bars to see exact amounts by week/month
5. 90-day projection KPI shows total expected revenue
6. Identify cash flow gaps and plan accordingly

### Responsive Design Considerations

**MVP Target:** Web browser (desktop and tablet)
- Desktop-first design (primary use case: office computer)
- Tablet-responsive (iPad landscape for on-the-go access)
- Mobile browser functional but not optimized (native mobile apps in Phase 4)

**Responsive Breakpoints:**
- Desktop: 1280px+ (full dashboard, side-by-side panels)
- Tablet: 768-1279px (stacked panels, collapsible sidebar)
- Mobile: <768px (single column, essential features only)

### Accessibility Considerations

**WCAG 2.1 Level AA Compliance:**
- Color contrast ratios meet accessibility standards
- Keyboard navigation for all interactive elements
- Screen reader compatibility (semantic HTML, ARIA labels)
- Focus indicators visible and clear
- Error messages descriptive and actionable

**Inclusive Design:**
- Large clickable areas (44px minimum touch targets)
- Clear typography (16px minimum body text)
- Status communicated through color + icons + text (not color alone)
- Avoid flashing/moving content that could trigger seizures

---

## Functional Requirements

### FR-1: User Authentication & Authorization

**FR-1.1: User Registration & Login**
- Agency admin creates account (email + password)
- Email verification required for account activation
- Secure login with password (OAuth 2.0, bcrypt password hashing)
- "Remember me" option for trusted devices
- Password reset via email link
- Session timeout after 30 minutes of inactivity (configurable)

**FR-1.2: Multi-Factor Authentication (Future)**
- SMS or authenticator app-based MFA (post-MVP)
- Enforce MFA for admin users (security best practice)

**FR-1.3: Role-Based Access Control**
- Two roles in MVP: Admin, Agency User
- Admins can manage users (invite, remove, change roles)
- Agency Users have limited permissions (no user management, no audit log access)
- Permissions enforced at API layer and UI layer

**FR-1.4: User Invitation Flow**
- Admin invites new user via email
- Invitation email contains unique signup link
- New user sets password and completes profile
- User assigned role by inviting admin

**Acceptance Criteria:**
- User can create account and verify email within 5 minutes
- Login successful with correct credentials
- Invalid login shows clear error message
- Password reset link expires after 24 hours
- Role permissions enforced (Agency User cannot access admin features)

---

### FR-2: Agency Management

**FR-2.1: Agency Profile**
- Agency name, logo, contact information
- Default commission structure (% rate, GST rules)
- Default automation settings (due-soon threshold, overdue trigger time)
- Timezone setting (for accurate date/time calculations)

**FR-2.2: User Management (Admin Only)**
- View all agency users (name, email, role, status)
- Invite new users (send invitation email)
- Change user roles (Admin ↔ Agency User)
- Deactivate users (retain audit trail, prevent login)
- Reactivate users

**FR-2.3: Agency Settings Configuration**
- Default commission percentage (applied to new colleges)
- Default GST setting (GST inclusive, exclusive, or no GST)
- Payment status automation rules:
  - "Due Soon" threshold (N days before due date, default 5)
  - "Overdue" trigger time (default 5pm on due date)
- Notification preferences (future: email alert settings)

**Acceptance Criteria:**
- Admin can update agency profile and settings
- Changes to default settings apply to new entities (not retroactive)
- User invitation email sent successfully
- Deactivated users cannot login
- Agency User cannot access admin functions

---

### FR-3: College Management

**FR-3.1: College Directory**
- Create college profile:
  - College name
  - Country/region
  - Contact information (primary contact name, email, phone)
  - Commercial terms:
    - Default commission percentage
    - GST setting (inclusive, exclusive, none)
    - Bonus structure (optional: tiered bonuses, performance incentives)
  - Payment terms (typical payment delay, e.g., "60 days after student enrollment")
- Edit college profile (audit logged)
- Delete college (soft delete if associated payment plans exist)
- View college details and associated payment plans

**FR-3.2: Branch Management**
- Add multiple branches per college
- Branch-specific commission rates (override default)
- Track payment plans by branch
- Example: "University of Sydney - Sydney Campus" vs "University of Sydney - Melbourne Campus"

**FR-3.3: College Search & Filtering**
- Search colleges by name or country
- Filter by region, GST setting, commission rate range
- Sort by name, country, date created

**FR-3.4: Commission Calculation Rules**
- Configurable commission structure per college:
  - Percentage-based: X% of commissionable value
  - Flat fee: Fixed amount per student
  - Tiered: Different rates for different tuition ranges
  - Bonus: Additional payment for meeting targets (e.g., 10+ students → +2%)
- Materials cost deduction (specify amount or % to deduct before commission calculation)
- Admin fee deduction (specify amount to deduct before commission calculation)
- GST handling:
  - GST inclusive: Commission calculated on amount including GST
  - GST exclusive: Commission calculated on amount excluding GST
  - No GST: No GST consideration

**Acceptance Criteria:**
- User can create college with all required fields
- Commission percentage and GST settings saved correctly
- Branch-specific rates override default college rate
- Search returns relevant colleges
- Soft-deleted colleges hidden from lists but retained in database

---

### FR-4: Student Management

**FR-4.1: Student Database**
- Create student profile:
  - Full name
  - Email, phone
  - Visa status (e.g., "Applied", "Approved", "Enrolled", "Rejected")
  - Country of origin
  - Notes (free text field)
- Edit student profile (audit logged)
- Delete student (soft delete if associated payment plans exist)
- View student details and associated payment plans

**FR-4.2: Student Search & Filtering**
- Search students by name, email, phone
- Filter by visa status, country of origin, college
- Sort by name, date created, visa status

**FR-4.3: Linked Payment Plans**
- Student profile shows all associated payment plans
- Quick navigation to payment plan details from student profile
- Visual indicator of payment status (e.g., "3 pending, 1 overdue")

**Acceptance Criteria:**
- User can create student with all required fields
- Visa status tracked and searchable
- Student profile displays all linked payment plans
- Search returns relevant students
- Soft-deleted students hidden but retained in database

---

### FR-5: Payment Plan Management

**FR-5.1: Payment Plan Creation**
- Create new payment plan:
  - Select student (search existing or create new)
  - Select college (search existing)
  - Select branch (if applicable)
  - Enter payment details:
    - Gross tuition amount
    - Materials cost (deducted from commissionable value)
    - Admin fee (deducted from commissionable value)
    - Commission percentage (default from college, editable)
    - GST setting (default from college, editable)
  - **Commissionable value auto-calculated:** Gross tuition - Materials - Admin fee, then apply commission % and GST rules
  - Create installments:
    - **Auto-create:** Number of installments, start date, frequency (monthly, quarterly, custom) → System generates equal installments
    - **Manual create:** Add installment rows (due date, amount, description)
- Save payment plan → Installments set to "Draft" status initially

**FR-5.2: Payment Plan Editing**
- Edit payment plan details (tuition amount, fees, commission %, GST setting)
- Recalculate commissionable value when plan edited
- Add, edit, delete installments
- Change installment dates or amounts
- All changes audit logged (who, what, when)

**FR-5.3: Payment Plan View**
- View payment plan summary:
  - Student name, college, branch
  - Gross tuition, materials cost, admin fee
  - Commissionable value (calculated)
  - Expected agency commission (calculated)
  - Commission percentage and GST setting
- View installment list:
  - Due date, amount, status (Draft, Pending, Due Soon, Overdue, Paid, Completed)
  - Notes attached to each installment
  - Visual status indicators (color coding)
- View audit log for payment plan (admin only)

**FR-5.4: Payment Plan Search & Filtering**
- Search by student name, college name
- Filter by:
  - Status (Draft, Pending, Due Soon, Overdue, Paid, Completed)
  - College
  - Date range (created, due dates, payment dates)
  - Commission amount range
- Sort by created date, due date, commission amount, status
- Saved filters (future enhancement)

**FR-5.5: Commission Calculation Engine**
- Formula: `Commissionable Value = Gross Tuition - Materials Cost - Admin Fee`
- Apply GST rules:
  - If GST inclusive: Calculate commission on full amount
  - If GST exclusive: Calculate commission after GST removed
  - If no GST: Calculate commission on full amount
- Apply commission percentage: `Agency Commission = Commissionable Value × Commission %`
- Support for bonus structures (future enhancement):
  - Tiered bonuses: If 10+ students enrolled → +2% commission
  - Performance incentives: If payment within 30 days → +1% bonus
- Display calculated commission on payment plan view
- Recalculate when plan details change

**Acceptance Criteria:**
- User can create payment plan with auto-generated equal installments
- User can manually add/edit individual installments
- Commissionable value calculated correctly based on formula
- Commission calculation respects GST rules
- Changes to payment plan trigger recalculation
- All edits audit logged
- Search and filtering return accurate results

---

### FR-6: Automated Payment Status Tracking

**FR-6.1: Status Workflow**

Installment status lifecycle:

1. **Draft**: Initial state when installment created
2. **Pending**: Auto-transition when current date < due date AND status = Draft
3. **Due Soon**: Auto-flagged when current date = (due date - N days), configurable threshold (default 5 days)
4. **Overdue**: Auto-flagged when current date > due date AND status != Paid/Completed
   - Trigger time: Default 5pm on due date (configurable)
5. **Paid**: Manually marked by user when student payment confirmed
6. **Completed**: Manually marked by user when agency receives commission from college

**FR-6.2: Automated Status Bot**
- Background job runs daily (or hourly) to check all installments
- Auto-transition statuses based on current date and due dates:
  - Draft → Pending (when due date in future)
  - Pending → Due Soon (when N days before due date)
  - Pending/Due Soon → Overdue (when past due date and not Paid/Completed)
- Status changes logged in audit trail
- Manual overrides allowed (user can manually change status if needed)

**FR-6.3: Manual Status Updates**
- User can manually mark installment as "Paid" (student paid)
  - Optional: Add payment date, payment method, reference number
- User can manually mark installment as "Completed" (agency received commission)
  - Optional: Add completion date, payment reference
- User can manually override status (e.g., set to "Pending" if accidentally marked "Paid")
- All manual status changes audit logged

**FR-6.4: Notes & Payment Agreements**
- Add notes to individual installments:
  - Free text field (unlimited length)
  - Timestamp and user attribution (who added note, when)
  - Edit/delete notes (audit logged)
- Attach payment agreements or special terms:
  - Document upload (PDF, image) (future enhancement)
  - Link to external payment terms (URL)
- Notes displayed chronologically (newest first)

**FR-6.5: Status Notifications (Future)**
- Email alerts when installment becomes "Due Soon" or "Overdue"
- Configurable notification rules (who gets notified, frequency)
- In-app notifications (badge counts, notification center)

**Acceptance Criteria:**
- Status bot runs on schedule (daily minimum)
- Statuses auto-transition based on dates
- Manual status updates work correctly
- Notes saved and displayed with timestamp
- Audit log captures all status changes (auto and manual)

---

### FR-7: Business Intelligence Dashboard

**FR-7.1: Key KPIs Panel**

Display prominently at top of dashboard:

1. **Total Commissions Due**
   - Sum of commissionable value for all installments with status: Pending, Due Soon, Overdue, Paid (not yet Completed)
   - Visual: Large number, currency formatted
   - Comparison to previous period (future: "↑ 12% vs last month")

2. **Total Overdue**
   - Sum of commissionable value for installments with status: Overdue
   - Visual: Red-highlighted number (urgency)
   - Count of overdue installments (e.g., "$12,450 across 8 payments")

3. **Income Received**
   - Sum of commissionable value for installments with status: Completed
   - Filter by date range (MTD, QTD, YTD, custom)
   - Visual: Green number (success)

4. **90-Day Projection**
   - Sum of commissionable value for installments due in next 90 days (status: Pending, Due Soon)
   - Visual: Blue number, forward-looking indicator
   - Breakdown by month (hover to see monthly projection)

**FR-7.2: Cash Flow Visualization**

Timeline chart showing payment flow over time:

- **X-axis**: Time (past 90 days ← today → next 90 days)
- **Y-axis**: Commission amount ($)
- **Bars/lines stacked by status**:
  - Past: Paid (green), Completed (dark green)
  - Present: Overdue (red)
  - Future: Due Soon (yellow), Pending (blue), Projected (blue dashed)
- **Interactivity**:
  - Hover over bar to see details (date, amount, count of installments)
  - Click bar to drill down into installment list
- **Configurable time range**: 30/60/90/180 days past/future

**FR-7.3: Action Modules**

**Overdue Payments List:**
- Table showing all overdue installments
- Columns: Student, College, Amount, Days Overdue, Due Date
- Sort by days overdue (most urgent first)
- Quick actions: Mark as Paid, Add Note, View Details
- Visual urgency indicator (red background, exclamation icon)

**Upcoming Due Dates List:**
- Table showing installments flagged "Due Soon" (next N days, configurable)
- Columns: Student, College, Amount, Due Date, Days Until Due
- Sort by due date (soonest first)
- Quick actions: Mark as Paid, Add Note, View Details
- Visual: Yellow background, calendar icon

**FR-7.4: Strategic Analysis Charts**

**Top 5 Colleges by Revenue:**
- Horizontal bar chart
- Show colleges ranked by total commission revenue (Completed installments)
- Filter by date range (MTD, QTD, YTD, all time)
- Click college to see all payment plans for that college

**New Payment Plans per Month:**
- Line or bar chart showing payment plan creation trend
- X-axis: Months (last 12 months)
- Y-axis: Count of payment plans created
- Visual: Growth trajectory, identify seasonal patterns

**Commission Status Breakdown:**
- Pie or donut chart showing percentage of commissions by status:
  - Completed (%)
  - Paid (%)
  - Pending (%)
  - Overdue (%)
- Visual: At-a-glance health check

**FR-7.5: Dashboard Interactivity**

- All charts clickable to drill down into details
- Hover states show tooltips with exact values
- Date range filters apply to all charts simultaneously
- Real-time refresh (or refresh button to update data)
- Responsive layout (charts stack on tablet/mobile)

**Acceptance Criteria:**
- Dashboard loads in <2 seconds
- KPIs calculate correctly based on current installment statuses
- Cash flow chart displays past and future payments accurately
- Overdue and upcoming lists show correct installments
- Charts interactive and responsive
- Date range filters work across all dashboard components

---

### FR-8: Reporting Engine

**FR-8.1: Report Builder**

Ad-hoc report generation with filters:

- **Filters:**
  - Date range: Created date, due date, payment date (start/end)
  - College: Select one or multiple colleges
  - Student: Select one or multiple students
  - Status: Select one or multiple statuses
  - Commission amount: Min/max range
  - Branch: Select specific branch (if applicable)
- **Output Fields (customizable):**
  - Student name, email
  - College name, branch
  - Payment plan created date
  - Installment due date, amount, status
  - Commission percentage, commissionable value
  - Notes
- **Preview:** Show report results in table view before export
- **Save Filter Presets:** Save commonly used filter combinations (future enhancement)

**FR-8.2: Export Options**

**CSV Export:**
- Export report results to CSV file
- Includes all selected columns
- Currency formatted as numbers (no symbols for Excel compatibility)
- Date formatted as YYYY-MM-DD (ISO 8601)
- UTF-8 encoding (international character support)
- Filename: `pleeno-report-YYYY-MM-DD.csv`

**PDF Export (Future):**
- Export report to formatted PDF
- Include agency logo and branding
- Professional layout with headers and footers
- Page breaks for long reports
- Filename: `pleeno-report-YYYY-MM-DD.pdf`

**FR-8.3: Pre-Built Reports**

**Commission Summary Report:**
- Total commissions by status (Pending, Overdue, Paid, Completed)
- Total commission revenue (Completed only)
- Average commission per payment plan
- Filter by date range, college

**College Performance Report:**
- List of colleges with commission totals
- Average payment delay (days between "Paid" and "Completed")
- Count of overdue commissions per college
- Sort by total revenue, overdue count

**Student Payment History Report:**
- All payment plans for selected student(s)
- Installment details with status and dates
- Total paid, total pending, total overdue
- Export to CSV for student records

**Overdue Commissions Report:**
- All installments with status "Overdue"
- Grouped by college
- Days overdue, total overdue amount
- Actionable follow-up list

**Acceptance Criteria:**
- Report builder filters work correctly
- Preview shows accurate results before export
- CSV export downloads successfully with correct formatting
- Pre-built reports generate in <5 seconds
- Exported reports open in Excel/accounting software without errors

---

### FR-9: Audit Log & Compliance

**FR-9.1: Comprehensive Audit Trail**

Track all data modifications for compliance and dispute resolution:

**Entities Logged:**
- Colleges (create, edit, delete)
- Students (create, edit, delete)
- Payment Plans (create, edit, delete)
- Installments (create, edit, delete, status changes)
- User Profiles (create, edit, role changes, deactivation)

**Log Entry Fields:**
- Timestamp (date and time, timezone-aware)
- User (who made the change)
- Entity type (College, Student, Payment Plan, etc.)
- Entity ID (unique identifier)
- Action (create, edit, delete)
- Changes:
  - Old value (before change)
  - New value (after change)
  - Field name (which field changed)
- IP address (optional, for security auditing)

**FR-9.2: Audit Log Access (Admin Only)**

- View audit log in table format
- Filter by:
  - Date range
  - User (who made change)
  - Entity type
  - Action type (create/edit/delete)
- Search by entity ID or entity name
- Sort by timestamp (newest first default)
- Export audit log to CSV for compliance reporting

**FR-9.3: Immutable Audit Log**

- Audit log entries cannot be edited or deleted (immutable)
- Retained indefinitely (or per data retention policy)
- Separate database table with restricted access
- Audit log visible to admins only (not agency users)

**FR-9.4: Data Retention & Privacy**

- Agency can request data export (all data in CSV/JSON format)
- Agency can request data deletion (GDPR compliance)
  - Soft delete: Archive data, anonymize personally identifiable information
  - Retain audit log for compliance (anonymized)
- Data backup and disaster recovery procedures documented

**Acceptance Criteria:**
- All data modifications logged automatically
- Audit log entries immutable (cannot be edited/deleted)
- Admin can filter and search audit log
- Audit log export includes all required fields
- Data retention and deletion policies implemented

---

### FR-10: Multi-Tenant Security & Isolation

**FR-10.1: Row-Level Security (RLS)**

- PostgreSQL RLS policies enforce tenant isolation
- Every table includes `agency_id` foreign key
- Database queries auto-filtered by authenticated user's `agency_id`
- No manual filtering required in application code (database enforces isolation)

**FR-10.2: Data Isolation Verification**

- Security testing: Verify zero data leakage between agencies
- Test scenarios:
  - User A (Agency 1) attempts to access User B's data (Agency 2) → Denied
  - API endpoint called with Agency 1 credentials → Returns only Agency 1 data
  - Direct database query (without RLS) → Returns all data (RLS bypassed only for superuser)
- Automated tests run on every deployment

**FR-10.3: Authentication & Session Management**

- Secure session tokens (JWT or server-side sessions)
- Token expiration and refresh
- Session timeout after inactivity
- Logout invalidates session token
- Prevent session fixation attacks

**FR-10.4: Data Encryption**

- Data at rest: Database encryption (AES-256)
- Data in transit: HTTPS/TLS 1.3 for all API requests
- Password storage: bcrypt hashing with salt
- Sensitive fields (payment info) encrypted in database (future enhancement)

**Acceptance Criteria:**
- RLS policies enforce tenant isolation
- Zero data leakage verified through security testing
- All API requests over HTTPS
- Passwords never stored in plaintext
- Session tokens expire and refresh correctly

---

## Non-Functional Requirements

### Performance

**Dashboard Load Time:**
- Target: <2 seconds for initial dashboard load
- Measured from: User clicks "Dashboard" → All KPIs and charts displayed
- Optimization strategies:
  - Database query optimization (indexed columns, aggregation queries)
  - Caching frequently accessed data (KPIs, dashboard charts)
  - Lazy loading for charts (load KPIs first, charts render progressively)
  - CDN for static assets (JavaScript, CSS, images)

**Report Generation:**
- Target: <5 seconds for standard reports (up to 1000 rows)
- Measured from: User clicks "Generate Report" → CSV download ready
- Large reports (1000+ rows): Display progress indicator, background job for generation

**Search & Filter:**
- Target: <1 second for search results
- Auto-suggest search (typeahead) with <500ms response time
- Indexed database columns for fast filtering

**API Response Time:**
- Target: 95th percentile <500ms for read operations
- Target: 95th percentile <1s for write operations (create/update/delete)
- Monitor and alert on performance degradation

**Scalability:**
- Support 100+ concurrent users per agency without performance degradation
- Support 50+ active payment plans per agency (up to 500 installments)
- Database partitioning strategy for large datasets (1M+ installments)

### Security

**Authentication & Authorization:**
- Secure password requirements (8+ characters, uppercase, lowercase, number, special character)
- Password reset via email with time-limited token
- Session timeout after 30 minutes of inactivity
- Role-based access control enforced at API and UI layers
- Multi-factor authentication (future enhancement)

**Data Protection:**
- HTTPS/TLS 1.3 for all data in transit
- Database encryption at rest (AES-256)
- Password hashing with bcrypt (salt + hash)
- Prevent SQL injection (parameterized queries)
- Prevent XSS attacks (input sanitization, output encoding)
- Prevent CSRF attacks (CSRF tokens)

**Multi-Tenant Isolation:**
- Row-Level Security (RLS) enforces tenant isolation at database layer
- Zero data leakage between agencies (verified through security testing)
- Audit log tracks all data access and modifications

**Compliance:**
- GDPR compliance: Data export, data deletion, consent management
- SOC 2 Type II audit (future, for enterprise customers)
- Regular security audits and penetration testing

**Backup & Disaster Recovery:**
- Automated daily database backups
- Point-in-time recovery (restore to any point in last 30 days)
- Off-site backup storage (separate region/availability zone)
- Disaster recovery plan with <24 hour RTO (Recovery Time Objective)

### Scalability

**Multi-Tenant Architecture:**
- Support 1000+ agencies on shared infrastructure
- Horizontal scaling: Add application servers as load increases
- Database connection pooling to handle concurrent requests efficiently

**Database Scalability:**
- Indexed columns for fast queries (agency_id, student_id, college_id, due_date, status)
- Database partitioning strategy for large datasets (partition by agency_id)
- Read replicas for reporting and dashboard queries (reduce load on primary database)

**Background Jobs:**
- Status automation bot runs as scheduled background job (daily or hourly)
- Job queue for asynchronous tasks (report generation, email notifications)
- Horizontal scaling of job workers as task volume increases

**Caching Strategy:**
- Cache dashboard KPIs (TTL: 5 minutes)
- Cache college/student lists for search auto-suggest (TTL: 15 minutes)
- Invalidate cache on data modification (e.g., when payment plan updated)

### Accessibility

**WCAG 2.1 Level AA Compliance:**
- Color contrast ratios meet accessibility standards (4.5:1 for text)
- Keyboard navigation for all interactive elements (tab order, focus indicators)
- Screen reader compatibility (semantic HTML, ARIA labels)
- Alternative text for images and icons
- Form labels and error messages descriptive and actionable

**Inclusive Design:**
- Large clickable areas (44px minimum touch targets)
- Clear typography (16px minimum body text, readable font family)
- Status communicated through color + icons + text (not color alone)
- Avoid flashing/moving content
- Support browser zoom (up to 200%)

### Integration

**MVP Integrations:**
- CSV export (accounting software compatibility: QuickBooks, Xero)
- PDF export (stakeholder reporting)

**Post-MVP Integrations:**
- REST API for third-party integrations
- Webhook support for real-time notifications (payment status changes)
- Accounting software sync: QuickBooks, Xero (OAuth 2.0 authentication, bi-directional sync)
- Bank feeds: Plaid, Yodlee (automated bank reconciliation)
- Email platforms: Gmail API, Outlook API (send payment reminders, commission claims)
- Payment gateways: Stripe, PayPal (direct payment processing)

**API Design Principles:**
- RESTful API design (GET, POST, PUT, DELETE)
- JSON request/response format
- API versioning (v1, v2) to support backward compatibility
- Rate limiting (prevent abuse)
- API documentation (OpenAPI/Swagger)

---

## Implementation Planning

### Epic Breakdown Required

The functional and non-functional requirements above must be decomposed into implementable epics and bite-sized user stories (200k context limit for development agents).

**Recommended Epic Structure:**

1. **Epic 1: Foundation & Multi-Tenant Architecture**
   - Database schema design
   - Row-Level Security (RLS) setup
   - User authentication and authorization
   - Agency and user management

2. **Epic 2: Core Entity Management (Colleges, Students)**
   - College CRUD operations
   - Branch management
   - Student CRUD operations
   - Search and filtering

3. **Epic 3: Payment Plan Engine**
   - Payment plan creation and editing
   - Commission calculation engine
   - Installment management
   - Audit logging for payment plans

4. **Epic 4: Automated Status Tracking**
   - Status workflow implementation
   - Background job for status automation
   - Manual status updates
   - Notes and payment agreements

5. **Epic 5: Business Intelligence Dashboard**
   - KPI panel (commissions due, overdue, received, 90-day projection)
   - Cash flow visualization chart
   - Action modules (overdue list, upcoming list)
   - Strategic analysis charts (top colleges, trends)

6. **Epic 6: Reporting Engine**
   - Report builder with filters
   - CSV export
   - Pre-built reports (commission summary, college performance)

7. **Epic 7: Security, Audit, & Compliance**
   - Comprehensive audit log
   - Admin-only audit log access
   - Data retention and privacy features
   - Security testing and verification

8. **Epic 8: UI/UX & Polish**
   - Responsive design implementation
   - Accessibility improvements (WCAG 2.1 AA)
   - Dashboard interactivity and animations
   - Performance optimization

**Next Step:** Run `workflow create-epics-and-stories` to create the implementation breakdown.

---

## References

- Product Brief: [product-brief-pleeno-2025-11-10.md](docs/product-brief-pleeno-2025-11-10.md)

---

## Next Steps

1. **Epic & Story Breakdown** - Run: `workflow create-epics-and-stories`
2. **UX Design** (if UI) - Run: `workflow ux-design`
3. **Architecture** - Run: `workflow create-architecture`

---

_This PRD captures the essence of Pleeno - transforming financial chaos into clarity and control for international study agencies._

_Created through collaborative discovery between anton and AI facilitator._
