# pleeno - Epic Breakdown

**Author:** anton
**Date:** 2025-11-10
**Project Level:** MVP
**Target Scale:** Small-to-medium international study agencies (10-500 students/year)

---

## Overview

This document provides the complete epic and story breakdown for pleeno, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

### Epic Structure

**Epic 1: Foundation & Multi-Tenant Security** (Foundation)
Establish the technical foundation, project infrastructure, and enterprise-grade multi-tenant architecture that enables all subsequent features. This epic delivers the secure, scalable platform on which Pleeno is built.

**Epic 2: Agency & User Management** (Identity & Access)
Enable agency self-service setup and team collaboration through user management, role-based access control, and agency configuration. This delivers the "who can do what" foundation.

**Epic 3: Core Entity Management** (Data Foundation)
Build the college and student registries that serve as the foundational data entities for all payment tracking. This delivers the "what are we tracking" layer.

**Epic 4: Payment Plan Engine** (Core Value)
Create and manage payment plans with flexible installment structures and automated commission calculations. This is where the product begins delivering tangible value—tracking the money.

**Epic 5: Intelligent Status Automation** (The Magic)
Implement the automated status tracking bot that eliminates manual work and provides proactive alerts. This delivers the "wow moment"—automatic flagging of due soon and overdue payments.

**Epic 6: Business Intelligence Dashboard** (Clarity & Control)
Surface critical KPIs, cash flow projections, and actionable insights through an interactive dashboard. This delivers the transformation from chaos to control.

**Epic 7: Reporting & Export** (Integration)
Enable agencies to generate ad-hoc reports and export data for accounting software integration and stakeholder communication.

**Epic 8: Audit & Compliance Infrastructure** (Trust & Safety)
Implement comprehensive audit logging and data governance features that ensure compliance, dispute resolution, and data protection.

---

## Epic 1: Foundation & Multi-Tenant Security

**Goal:** Establish the technical foundation, project infrastructure, and enterprise-grade multi-tenant architecture with Row-Level Security (RLS) that enables secure data isolation for all subsequent features.

### Story 1.1: Project Infrastructure Initialization

As a **developer**,
I want **the core project infrastructure and development environment set up**,
So that **I have a working foundation to build features on**.

**Acceptance Criteria:**

**Given** I am starting a new project
**When** I initialize the repository and deployment pipeline
**Then** I have a working Next.js/React application with TypeScript, a configured PostgreSQL database, basic CI/CD pipeline, and deployment environment

**And** the repository structure follows best practices with clear separation of concerns
**And** all developers can clone, install dependencies, and run the application locally
**And** environment variables are properly configured with example templates

**Prerequisites:** None (foundation story)

**Technical Notes:**
- Next.js 14+ with App Router
- PostgreSQL 15+ for database
- Consider Supabase for managed PostgreSQL with built-in auth and RLS
- Set up Vercel/Railway for deployment
- Configure ESLint, Prettier, TypeScript strict mode
- Create basic folder structure: /app, /lib, /components, /types

---

### Story 1.2: Multi-Tenant Database Schema with RLS

As a **system architect**,
I want **a database schema with Row-Level Security policies enforcing data isolation**,
So that **each agency's data is automatically isolated at the database level without application-layer checks**.

**Acceptance Criteria:**

**Given** the project infrastructure is initialized
**When** I implement the multi-tenant database schema
**Then** the database has a clear tenant isolation model using agency_id as the tenant key

**And** RLS policies are enabled on all tables containing tenant data
**And** RLS policies automatically filter queries to the current user's agency_id
**And** no application code can bypass RLS protections
**And** database migrations are version-controlled and repeatable

**Prerequisites:** Story 1.1

**Technical Notes:**
- Use Supabase RLS or PostgreSQL native RLS
- Create base tables: agencies, users (with agency_id FK)
- Implement RLS policies: `CREATE POLICY agency_isolation ON [table] USING (agency_id = current_setting('app.current_agency_id')::uuid)`
- Set agency_id context per request using JWT claims or session
- Test RLS: verify users cannot access other agencies' data even with direct SQL

---

### Story 1.3: Authentication & Authorization Framework

As a **developer**,
I want **an authentication system with role-based access control**,
So that **users can securely log in and access features based on their roles**.

**Acceptance Criteria:**

**Given** the multi-tenant database schema exists
**When** I implement authentication and authorization
**Then** users can register, log in, and log out securely

**And** user sessions are managed with secure JWT tokens or session cookies
**And** role-based access control (RBAC) distinguishes between Agency Admin and Agency User roles
**And** authentication middleware protects API routes and pages
**And** agency_id is automatically set in the security context on login

**Prerequisites:** Story 1.2

**Technical Notes:**
- Use Supabase Auth or NextAuth.js
- Store roles in users table: role ENUM ('agency_admin', 'agency_user')
- Implement middleware to check authentication and set RLS context
- Create auth utilities: `requireAuth()`, `requireRole()`
- Hash passwords with bcrypt if using custom auth

---

### Story 1.4: Error Handling & Logging Infrastructure

As a **developer**,
I want **standardized error handling and logging throughout the application**,
So that **I can diagnose issues quickly and provide helpful error messages to users**.

**Acceptance Criteria:**

**Given** the authentication framework is in place
**When** I implement error handling and logging
**Then** all API errors return consistent JSON structure with appropriate HTTP status codes

**And** errors are logged with sufficient context (user_id, agency_id, timestamp, stack trace)
**And** sensitive data is never exposed in error messages
**And** client-side error boundaries catch React errors gracefully
**And** logging integrates with monitoring service (e.g., Sentry, LogRocket)

**Prerequisites:** Story 1.3

**Technical Notes:**
- Create custom error classes: `ValidationError`, `AuthorizationError`, `NotFoundError`
- Implement global error handler middleware for API routes
- Use React Error Boundaries for UI error handling
- Configure structured logging with Winston or Pino
- Set up Sentry for error tracking and alerting

---

## Epic 2: Agency & User Management

**Goal:** Enable agency self-service setup, team collaboration through user management, and role-based access control that forms the identity and access foundation for the platform.

### Story 2.1: Agency Profile Setup

As an **Agency Admin**,
I want **to configure my agency's profile with basic information**,
So that **my agency identity is established in the system and my team knows which agency they're working in**.

**Acceptance Criteria:**

**Given** I am an authenticated Agency Admin
**When** I access the agency settings page
**Then** I can view and edit my agency's name, contact information, default currency, and timezone

**And** changes are saved to the database with proper validation
**And** the agency name appears in the application header/navigation
**And** all timestamps display in the agency's configured timezone

**Prerequisites:** Story 1.3

**Technical Notes:**
- Extend agencies table: name, contact_email, contact_phone, currency (default: AUD), timezone
- Create /settings/agency page with form
- Implement API route: PATCH /api/agencies/[id]
- Validate required fields: name, currency, timezone
- Only Agency Admins can edit agency settings

---

### Story 2.2: User Invitation System

As an **Agency Admin**,
I want **to invite team members to join my agency**,
So that **I can build my team and delegate work**.

**Acceptance Criteria:**

**Given** I am an Agency Admin
**When** I invite a new user by email
**Then** an invitation email is sent with a secure signup link

**And** the invitation link expires after 7 days
**And** the invited user can complete registration with the link
**And** the new user is automatically associated with my agency
**And** I can specify their role (Agency Admin or Agency User) during invitation

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create invitations table: id, agency_id, email, role, token, expires_at, invited_by, used_at
- Implement API route: POST /api/invitations
- Generate secure invitation tokens (UUID or signed JWT)
- Send invitation email via SendGrid/Resend
- Create /accept-invitation/[token] page for signup completion
- Validate invitation before allowing registration

---

### Story 2.3: User Management Interface

As an **Agency Admin**,
I want **to view and manage all users in my agency**,
So that **I can control who has access and what roles they have**.

**Acceptance Criteria:**

**Given** I am an Agency Admin
**When** I access the user management page
**Then** I see a list of all users in my agency with their roles and status

**And** I can change a user's role (Admin ↔ User)
**And** I can deactivate or reactivate user accounts
**And** deactivated users cannot log in
**And** I can resend invitation emails for pending invitations
**And** I can delete pending invitations

**Prerequisites:** Story 2.2

**Technical Notes:**
- Create /settings/users page with user list table
- Add users.status field: ENUM ('active', 'inactive')
- Implement API routes: PATCH /api/users/[id]/role, PATCH /api/users/[id]/status
- RLS ensures admins only manage users in their agency
- Prevent admin from deactivating themselves
- Show pending invitations separately from active users

---

### Story 2.4: User Profile Management

As an **Agency User or Admin**,
I want **to manage my own profile information**,
So that **my account information is accurate and I can change my password**.

**Acceptance Criteria:**

**Given** I am an authenticated user
**When** I access my profile settings
**Then** I can update my name, email, and password

**And** email changes require verification
**And** password changes require current password confirmation
**And** password must meet security requirements (min 8 chars, mix of types)
**And** I receive confirmation when profile is updated
**And** I can view my role and agency but cannot change them

**Prerequisites:** Story 2.3

**Technical Notes:**
- Create /settings/profile page
- Implement API routes: PATCH /api/users/me/profile, PATCH /api/users/me/password
- Email verification flow: send verification email, require click to confirm
- Hash new passwords before storage
- Add users.email_verified_at field
- Display read-only agency name and role

---

## Epic 3: Core Entity Management

**Goal:** Build the college and student registries that serve as the foundational data entities for all payment tracking, establishing the "what are we tracking" layer.

### Story 3.1: College Registry

As an **Agency User**,
I want **to create and manage a registry of colleges and their branch locations**,
So that **I can associate students and payment plans with specific institutions and track commissions by branch**.

**Acceptance Criteria:**

**Given** I am an authenticated Agency User
**When** I access the colleges management page
**Then** I can view all colleges in my agency

**And** I can create a new college with name, country, and website
**And** I can edit existing college information
**And** I can add branches to a college with branch name, address, and contact details
**And** I can mark branches as active or inactive
**And** each branch has an associated commission rate (percentage)

**Prerequisites:** Story 2.4

**Technical Notes:**
- Create colleges table: id, agency_id, name, country, website, created_at, updated_at
- Create branches table: id, college_id, agency_id, name, address, contact_email, contact_phone, commission_rate_percent (decimal), is_active, created_at, updated_at
- Implement API routes: GET/POST /api/colleges, PATCH /api/colleges/[id], GET/POST /api/colleges/[id]/branches
- Create /colleges page with list and create form
- Create /colleges/[id] detail page showing branches
- RLS policies on both tables using agency_id
- Validate commission_rate_percent: 0-100

---

### Story 3.2: Student Registry

As an **Agency User**,
I want **to create and manage a database of students**,
So that **I can track which students are enrolled where and link them to payment plans**.

**Acceptance Criteria:**

**Given** I am an authenticated Agency User
**When** I access the students management page
**Then** I can view all students in my agency

**And** I can create a new student with name, email, phone, and passport number
**And** I can edit existing student information
**And** I can see which colleges/branches each student is enrolled in
**And** I can search students by name, email, or passport number
**And** student records are unique by passport number within my agency

**Prerequisites:** Story 3.1

**Technical Notes:**
- Create students table: id, agency_id, first_name, last_name, email, phone, passport_number, date_of_birth, nationality, created_at, updated_at
- Add unique constraint: (agency_id, passport_number)
- Implement API routes: GET/POST /api/students, PATCH /api/students/[id], GET /api/students?search=query
- Create /students page with list, search, and create form
- Create /students/[id] detail page
- RLS policy using agency_id
- Validate required fields: first_name, last_name, passport_number

---

### Story 3.3: Student-College Enrollment Linking

As an **Agency User**,
I want **to link students to their enrolled colleges and branches**,
So that **I can track where each student is studying and enable payment plan creation**.

**Acceptance Criteria:**

**Given** I have existing students and colleges in the system
**When** I enroll a student at a college branch
**Then** the enrollment is recorded with start date and expected end date

**And** I can specify the program/course name
**And** I can view all enrollments for a student
**And** I can view all enrolled students for a college/branch
**And** a student can be enrolled in multiple colleges/branches
**And** I can mark an enrollment as completed or cancelled

**Prerequisites:** Story 3.2

**Technical Notes:**
- Create enrollments table: id, agency_id, student_id, branch_id, program_name, start_date, expected_end_date, status ENUM ('active', 'completed', 'cancelled'), created_at, updated_at
- Implement API routes: POST /api/enrollments, PATCH /api/enrollments/[id], GET /api/students/[id]/enrollments, GET /api/branches/[id]/enrollments
- Add enrollment section to student detail page
- Add enrolled students list to college/branch detail page
- RLS policy using agency_id
- Validate: student and branch must exist and belong to same agency

---

## Epic 4: Payment Plan Engine

**Goal:** Create and manage payment plans with flexible installment structures and automated commission calculations—this is where the product begins delivering tangible value by tracking the money.

### Story 4.1: Payment Plan Creation

As an **Agency User**,
I want **to create a payment plan for a student's enrollment**,
So that **I can track the total amount owed, installment schedule, and expected commission**.

**Acceptance Criteria:**

**Given** I have a student enrolled at a college branch
**When** I create a payment plan
**Then** I specify the total amount in the agency's currency

**And** I select the linked enrollment (student + branch)
**And** I specify a payment start date
**And** I can add notes or reference numbers (e.g., invoice #)
**And** the plan calculates expected commission based on the branch's commission rate
**And** the plan is saved with status "active"

**Prerequisites:** Story 3.3

**Technical Notes:**
- Create payment_plans table: id, agency_id, enrollment_id, total_amount (decimal), currency, start_date, commission_rate_percent (copied from branch at creation), expected_commission (calculated), status ENUM ('active', 'completed', 'cancelled'), notes, reference_number, created_at, updated_at
- expected_commission = total_amount * (commission_rate_percent / 100)
- Implement API routes: POST /api/payment-plans, GET /api/payment-plans/[id]
- Create /payment-plans/new page with form
- Dropdown to select enrollment (shows student name + college/branch)
- Calculate and display expected commission in real-time as user enters amount
- RLS policy using agency_id

---

### Story 4.2: Flexible Installment Structure

As an **Agency User**,
I want **to define flexible installment schedules for each payment plan**,
So that **I can accommodate different payment arrangements (monthly, quarterly, custom)**.

**Acceptance Criteria:**

**Given** I am creating or editing a payment plan
**When** I define the installment structure
**Then** I can choose from preset patterns: monthly, quarterly, or custom

**And** for monthly/quarterly: system auto-generates installments with equal amounts
**And** for custom: I manually add each installment with amount and due date
**And** the sum of installment amounts equals the total payment plan amount
**And** I receive a warning if amounts don't match
**And** I can edit or delete installments before finalizing the plan

**Prerequisites:** Story 4.1

**Technical Notes:**
- Create installments table: id, payment_plan_id, agency_id, installment_number (1, 2, 3...), amount (decimal), due_date, status ENUM ('pending', 'paid', 'overdue', 'cancelled'), paid_date, paid_amount, created_at, updated_at
- Implement API routes: POST /api/payment-plans/[id]/installments (batch create), PATCH /api/installments/[id]
- Create installment builder UI with preset patterns
- Validation: SUM(installments.amount) = payment_plan.total_amount
- RLS policy using agency_id
- Auto-calculate due dates for preset patterns based on start_date

---

### Story 4.3: Payment Plan List and Detail Views

As an **Agency User**,
I want **to view all payment plans and drill into individual plan details**,
So that **I can quickly find plans and see their payment status**.

**Acceptance Criteria:**

**Given** I am an authenticated Agency User
**When** I access the payment plans page
**Then** I see a list of all payment plans in my agency

**And** each list item shows: student name, college/branch, total amount, number of installments, next due date, overall status
**And** I can filter by status (active, completed, cancelled)
**And** I can search by student name or reference number
**And** I can click a plan to view full details
**And** the detail page shows: all plan info, student/enrollment details, commission calculation, and list of all installments with their statuses

**Prerequisites:** Story 4.2

**Technical Notes:**
- Create /payment-plans page with list view
- Implement API route: GET /api/payment-plans?status=&search=
- Join with students, enrollments, branches, colleges for display
- Create /payment-plans/[id] detail page
- Show installments in chronological order with visual status indicators
- Calculate overall plan status: if all installments paid → "completed", if any overdue → highlight
- RLS policy using agency_id

---

### Story 4.4: Manual Payment Recording

As an **Agency User**,
I want **to manually record when an installment is paid**,
So that **I can keep the system up-to-date and track which payments have been received**.

**Acceptance Criteria:**

**Given** I am viewing a payment plan with pending installments
**When** I mark an installment as paid
**Then** I record the payment date and actual amount paid

**And** the installment status changes to "paid"
**And** if all installments are paid, the payment plan status changes to "completed"
**And** I can partially pay an installment (paid_amount < installment amount)
**And** I can add notes to the payment record
**And** the dashboard and reports reflect the updated payment status

**Prerequisites:** Story 4.3

**Technical Notes:**
- Implement API route: POST /api/installments/[id]/record-payment
- Request body: { paid_date, paid_amount, notes }
- Update installment: status = 'paid', paid_date, paid_amount
- Check if all installments paid → update payment_plan.status = 'completed'
- Add payments audit event (Epic 8)
- Create "Mark as Paid" button/modal on installment in detail page
- RLS policy using agency_id
- Validate: paid_date cannot be in future

---

### Story 4.5: Commission Calculation Engine

As an **Agency User**,
I want **commissions to be automatically calculated based on actual payments received**,
So that **I know exactly how much commission I'm entitled to claim from each college**.

**Acceptance Criteria:**

**Given** a payment plan with installments
**When** installments are marked as paid
**Then** the system calculates earned commission based on paid amounts

**And** earned_commission = (paid_amount / total_amount) * expected_commission
**And** I can view total earned commission per payment plan
**And** I can view total earned commission per college/branch
**And** commission is only counted for installments with status "paid"
**And** the dashboard shows total outstanding commission across all plans

**Prerequisites:** Story 4.4

**Technical Notes:**
- Add calculated field to payment_plans: earned_commission (sum of paid installments proportional to total)
- Create database view or compute on query:
  - `earned_commission = SUM(installments.paid_amount WHERE status='paid') / payment_plan.total_amount * payment_plan.expected_commission`
- Implement API route: GET /api/reports/commissions?branch_id=&status=
- Display earned vs expected commission on payment plan detail page
- Create commission summary widget for dashboard
- Consider caching earned_commission on payment_plan record for performance

---

## Epic 5: Intelligent Status Automation

**Goal:** Implement the automated status tracking bot that eliminates manual work and provides proactive alerts—this delivers the "wow moment" where payments are automatically flagged as due soon or overdue.

### Story 5.1: Automated Status Detection Job

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

**Prerequisites:** Story 4.5

**Technical Notes:**
- Implement scheduled job using cron, Node-cron, or platform scheduler (Vercel Cron, Supabase Edge Functions)
- Create API endpoint: POST /api/jobs/update-installment-statuses (protected by API key)
- SQL query: `UPDATE installments SET status = 'overdue' WHERE status = 'pending' AND due_date < CURRENT_DATE`
- Log execution to jobs_log table: id, job_name, started_at, completed_at, records_updated, status, error_message
- Add monitoring/alerting if job fails
- Consider time zones: use UTC consistently

---

### Story 5.2: Due Soon Notification Flags

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

**Prerequisites:** Story 5.1

**Technical Notes:**
- Add computed field or query logic: `is_due_soon = (due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') AND status = 'pending'`
- Update payment plan list/detail UI to show "due soon" badge
- Add agencies.due_soon_threshold_days field (default: 7)
- Implement API route: PATCH /api/agencies/[id]/settings for threshold configuration
- Dashboard widget: count of installments where is_due_soon = true
- Use consistent color coding: yellow/amber for "due soon", red for "overdue"

---

### Story 5.3: Overdue Payment Alerts

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

**Prerequisites:** Story 5.2

**Technical Notes:**
- Create notifications table: id, agency_id, user_id (null for agency-wide), type, message, link, is_read, created_at
- Generate notification when installment status changes to 'overdue' (trigger or in status update job)
- Implement API routes: GET /api/notifications, PATCH /api/notifications/[id]/mark-read
- Add notification bell icon in header with unread count
- Create /notifications page listing all notifications
- Dashboard: highlight overdue section with count and total amount
- Consider email digest option (future enhancement)

---

### Story 5.4: Payment Status Dashboard Widget

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

**Prerequisites:** Story 5.3

**Technical Notes:**
- Create /dashboard page if not exists
- Implement API route: GET /api/dashboard/payment-status-summary
- Return JSON with counts and totals for each status category
- Create React component: PaymentStatusWidget
- Use visual indicators: green for paid, yellow for due soon, red for overdue
- Link each metric to /payment-plans with appropriate filter
- Cache results for performance (e.g., 5-minute cache)

---

### Story 5.5: Automated Email Notifications (Optional Enhancement)

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

**Prerequisites:** Story 5.4

**Technical Notes:**
- Add users.email_notifications_enabled field (default: false)
- Extend status update job to track newly overdue (installments that changed status today)
- Query users with email_notifications_enabled = true and role = 'agency_admin'
- Send email via SendGrid/Resend with summary table
- Create email template for overdue notifications
- Track last_notified_date on installments to prevent duplicate emails
- Add email preferences section to /settings/profile

---

## Epic 6: Business Intelligence Dashboard

**Goal:** Surface critical KPIs, cash flow projections, and actionable insights through an interactive dashboard, delivering the transformation from chaos to control.

### Story 6.1: Key Performance Indicators (KPIs) Widget

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

**Prerequisites:** Story 5.5

**Technical Notes:**
- Implement API route: GET /api/dashboard/kpis
- Calculate metrics:
  - active_students: COUNT(students WHERE enrollments.status = 'active')
  - active_payment_plans: COUNT(payment_plans WHERE status = 'active')
  - outstanding_amount: SUM(installments.amount WHERE status IN ('pending', 'overdue'))
  - earned_commission: SUM across all payment_plans.earned_commission
  - collection_rate: (payments received this month / expected this month) * 100
- Store previous month's values for trend comparison (consider monthly_metrics table)
- Create React component: KPIWidget with trend arrows
- Use color coding: green for positive trends, red for negative

---

### Story 6.2: Cash Flow Projection Chart

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

**Prerequisites:** Story 6.1

**Technical Notes:**
- Implement API route: GET /api/dashboard/cash-flow-projection?days=90&groupBy=week
- Query installments: group by due_date (or week), sum amounts
- Return time series data: [{ date, expected_amount, paid_amount, count_installments }]
- Create React component: CashFlowChart using recharts or Chart.js
- Use stacked bar chart or line chart
- Color code: blue for expected, green for already paid
- Tooltip shows student list for that date/period

---

### Story 6.3: Commission Breakdown by College

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

**Prerequisites:** Story 6.2

**Technical Notes:**
- Implement API route: GET /api/dashboard/commission-by-college?period=all
- Query: JOIN payment_plans → enrollments → branches → colleges
- Aggregate: SUM(expected_commission), SUM(earned_commission) GROUP BY college, branch
- Return sorted by earned_commission DESC
- Create React component: CommissionBreakdownTable
- Add date range filter using query params
- Link college name to /colleges/[id] detail page
- Consider caching for performance

---

### Story 6.4: Recent Activity Feed

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

**Prerequisites:** Story 6.3

**Technical Notes:**
- Create activity_log table: id, agency_id, user_id, entity_type, entity_id, action, description, created_at
- Log activities in relevant API endpoints (payment recording, plan creation, etc.)
- Implement API route: GET /api/activity-log?limit=20
- Create React component: ActivityFeed
- Format descriptions: "John Doe recorded payment of $500 for Student XYZ"
- Use relative timestamps: "2 hours ago", "yesterday"
- Consider auto-refresh every 60 seconds for real-time feel

---

### Story 6.5: Overdue Payments Summary Widget

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

**Prerequisites:** Story 6.4

**Technical Notes:**
- Implement API route: GET /api/dashboard/overdue-payments
- Query: installments WHERE status = 'overdue' ORDER BY due_date ASC
- Calculate days_overdue: CURRENT_DATE - due_date
- Join with students, payment_plans, enrollments, colleges for display
- Create React component: OverduePaymentsWidget
- Use urgent visual styling (red background, bold text)
- Link each item to /payment-plans/[id]
- Show celebratory message when list is empty: "No overdue payments! 🎉"

---

## Epic 7: Reporting & Export

**Goal:** Enable agencies to generate ad-hoc reports and export data for accounting software integration and stakeholder communication.

### Story 7.1: Payment Plans Report Generator

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

**Prerequisites:** Story 6.5

**Technical Notes:**
- Create /reports page with report builder UI
- Implement API route: POST /api/reports/payment-plans (returns JSON)
- Accept filter params: date_from, date_to, college_id, branch_id, student_id, status[]
- Query payment_plans with joins and filters, return paginated results
- Include computed fields: days_until_due, days_overdue, earned_commission
- Create React component: ReportBuilder with filter form
- RLS policy ensures agency_id filtering

---

### Story 7.2: CSV Export Functionality

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

**Prerequisites:** Story 7.1

**Technical Notes:**
- Implement API route: GET /api/reports/payment-plans/export?format=csv (returns file)
- Use csv-stringify or papaparse library
- Set response headers: Content-Type: text/csv, Content-Disposition: attachment
- Include BOM for Excel UTF-8 compatibility
- Stream large datasets instead of loading all into memory
- Apply same filters from report generation

---

### Story 7.3: PDF Export Functionality

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

**Prerequisites:** Story 7.2

**Technical Notes:**
- Implement API route: GET /api/reports/payment-plans/export?format=pdf
- Use PDF generation library: puppeteer, jsPDF, or pdfkit
- Create HTML template for PDF rendering
- Include agency logo from agencies table (add logo_url field)
- Set response headers: Content-Type: application/pdf, Content-Disposition: attachment
- Consider pagination: max 50 rows per page
- Apply same filters from report generation

---

### Story 7.4: Commission Report by College

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

**Prerequisites:** Story 7.3

**Technical Notes:**
- Create /reports/commissions page
- Implement API route: POST /api/reports/commissions
- Query: JOIN payment_plans → enrollments → branches → colleges
- Group by college, branch; aggregate payments and commissions
- Include drill-down: show payment plans and students for each branch
- Create CommissionReportTemplate for PDF with professional formatting
- Export functionality reuses CSV/PDF export logic from Story 7.2/7.3

---

### Story 7.5: Student Payment History Report

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

**Prerequisites:** Story 7.4

**Technical Notes:**
- Add "Payment History" section/button to /students/[id] page
- Implement API route: GET /api/students/[id]/payment-history?date_from=&date_to=
- Query installments for all payment_plans linked to student via enrollments
- Order by installment due_date DESC
- Create StudentPaymentHistoryPDF template
- Include student info header: name, passport, contact
- Format as statement: running balance, clear payment records
- RLS ensures student belongs to user's agency

---

## Epic 8: Audit & Compliance Infrastructure

**Goal:** Implement comprehensive audit logging and data governance features that ensure compliance, support dispute resolution, and build trust through complete transparency.

### Story 8.1: Comprehensive Audit Logging

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

**Prerequisites:** Story 7.5

**Technical Notes:**
- Create audit_logs table: id, agency_id, user_id, timestamp, action_type, entity_type, entity_id, old_values (JSONB), new_values (JSONB), ip_address, user_agent
- Implement audit middleware for API routes
- Capture request context: user from session, IP from headers
- For updates: query current state before update, store as old_values
- Use database triggers for critical tables as backup
- Add index on (agency_id, timestamp) for query performance
- Implement RLS: users only see logs for their agency

---

### Story 8.2: Audit Log Viewer Interface

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

**Prerequisites:** Story 8.1

**Technical Notes:**
- Create /settings/audit-logs page (admin only)
- Implement API route: GET /api/audit-logs?date_from=&date_to=&user_id=&action_type=
- Join with users table to show user names
- Create React component: AuditLogViewer with filters and expandable rows
- Implement diff viewer for old_values vs new_values (use react-diff-viewer or similar)
- Format action descriptions: "John Doe recorded payment of $500 for Payment Plan #123"
- Export to CSV functionality similar to Story 7.2
- Paginate results: 50 per page

---

### Story 8.3: Data Retention Policy Configuration

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

**Prerequisites:** Story 8.2

**Technical Notes:**
- Add agencies table fields: retention_completed_plans_days (default: NULL = keep forever), retention_cancelled_enrollments_days, retention_inactive_students_days
- Create /settings/data-retention page (admin only)
- Implement API route: PATCH /api/agencies/[id]/retention-policy
- Implement preview API: GET /api/agencies/[id]/retention-preview (returns counts of affected records)
- Create scheduled job for automatic archival (runs weekly)
- Before deletion: create archive exports (JSON or CSV) and store in cloud storage
- Implement soft delete: add deleted_at field instead of hard delete
- Log all retention actions in audit_logs

---

### Story 8.4: Change History for Payment Plans

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

**Prerequisites:** Story 8.3

**Technical Notes:**
- Add "Change History" tab to /payment-plans/[id] page
- Implement API route: GET /api/payment-plans/[id]/history
- Query audit_logs WHERE entity_type IN ('payment_plan', 'installment') AND entity_id references the plan
- Also include installment history for installments belonging to the plan
- Create React component: ChangeHistoryTimeline
- Use visual timeline UI (vertical line with nodes)
- Format diffs in human-readable way: "Total amount changed from $5000 to $5500"
- Include system user for automated changes (user_id = NULL)

---

### Story 8.5: Data Export for Compliance

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

**Prerequisites:** Story 8.4

**Technical Notes:**
- Create /settings/data-export page
- Implement API route: POST /api/agencies/[id]/export (triggers async job)
- Create background job: generate JSON files for each entity type
- Use streaming for large datasets
- Create manifest.json with: export_date, agency_id, record_counts, file_list
- Zip all files together
- Upload to cloud storage (S3, GCS) or serve for download
- Implement API route: GET /api/agencies/[id]/exports (list previous exports with download links)
- Send email notification when export is ready
- Clean up old export files after 30 days

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

