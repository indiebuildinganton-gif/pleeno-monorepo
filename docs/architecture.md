# Pleeno - System Architecture Document

## Executive Summary

Pleeno is built using a modern microfrontend architecture with Next.js 15 multi-zones, backed by a domain-driven Supabase PostgreSQL database. The architecture prioritizes multi-tenant security, developer velocity through independent deployments, and AI agent consistency through comprehensive implementation patterns.

**Key Architectural Decisions:**
- **Frontend:** Turborepo monorepo with 5 independent Next.js zones
- **Backend:** Supabase PostgreSQL with domain-driven schema organization
- **State Management:** Zustand for client state, TanStack Query for server state
- **Deployment:** Vercel Edge with independent zone deployments
- **Security:** PostgreSQL Row-Level Security (RLS) enforcing multi-tenant isolation

## Project Initialization

**First implementation story should execute:**

```bash
# Step 1: Initialize Turborepo monorepo
npx create-turbo@latest pleeno-monorepo
cd pleeno-monorepo

# Step 2: Create Next.js 15 zones
cd apps
npx create-next-app@latest shell --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest dashboard --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest agency --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest entities --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest payments --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest reports --typescript --tailwind --app --use-npm --eslint

# Step 3: Initialize Supabase (requires Docker running)
cd ../supabase
npx supabase init
npx supabase start

# Step 4: Install shared dependencies
npm install -w packages/database @supabase/supabase-js @supabase/ssr
npm install -w packages/ui zustand @tanstack/react-query react-hook-form @hookform/resolvers zod
npm install -w packages/ui date-fns date-fns-tz recharts @tanstack/react-table
npm install -w packages/ui @react-pdf/renderer resend
```

This establishes the base architecture with these decisions already made:
- **Language:** TypeScript (strict mode)
- **Framework:** Next.js 15 (App Router) with Turborepo
- **Styling:** Tailwind CSS + Shadcn UI
- **Database:** PostgreSQL via Supabase with RLS
- **Auth:** Supabase Auth with multi-tenant JWT claims
- **Monorepo:** Turborepo for build caching and orchestration

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Frontend Framework** | Next.js | 15.x | All Epics | App Router for React Server Components, excellent Vercel integration |
| **Language** | TypeScript | 5.x | All Epics | Type safety for complex domain logic (commissions, dates) |
| **Monorepo** | Turborepo | Latest | All Epics | Build caching, shared packages, independent deployments |
| **Architecture** | Multi-Zones Microfrontends | N/A | Epics 2,3,4,6,7 | Independent team velocity, smaller bundles, domain isolation |
| **Database** | PostgreSQL (Supabase) | 15+ | All Epics | RLS for multi-tenancy, proven reliability, rich ecosystem |
| **Auth** | Supabase Auth | Latest | Epic 1,2 | Built-in RLS integration, JWT claims, email/social login |
| **State Management** | Zustand | 5.0.8 | All Epics | Lightweight, perfect for dashboard state, easy learning curve |
| **Server State** | TanStack Query | 5.90.7 | All Epics | Caching, optimistic updates, excellent DX with mutations |
| **Forms** | React Hook Form | 7.66.0 | Epics 2,3,4 | Performance for multi-step wizards, minimal re-renders |
| **Validation** | Zod | 4.x | All Epics | TypeScript-first, type inference, complex validation (commission rules) |
| **Date/Time** | date-fns | 4.1.0 | All Epics | Tree-shakeable, timezone support, relative timestamps |
| **Charts** | Recharts | 3.3.0 | Epic 6 | React-native, composable, perfect for dashboard visualizations |
| **Tables** | TanStack Table | 8.21.3 | All Epics | Headless, Tailwind styling, powerful filtering/sorting |
| **Email** | Resend | 6.4.2 | Epic 5 | React Email templates, modern API, reliable deliverability |
| **PDF Generation** | @react-pdf/renderer | 4.3.1 | Epic 7 | React components to PDF, server-compatible |
| **Background Jobs** | Supabase Edge Functions + pg_cron | Built-in | Epic 5,8 | PostgreSQL-native scheduling, Edge Functions for logic |
| **UI Components** | Shadcn UI | Latest | All Epics | Radix UI (WCAG AA), Tailwind-based, copy-paste ownership |
| **Styling** | Tailwind CSS | 4.x | All Epics | Utility-first, excellent DX, tree-shakeable |
| **Testing** | Vitest + RTL + Playwright | Latest | All Epics | Fast unit tests, component tests, E2E for critical flows |

## Project Structure

### Monorepo Architecture (Turborepo + Multi-Zones)

```
pleeno-monorepo/
├── apps/
│   ├── shell/                          # Main entry point & routing
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── page.tsx               # Redirect to /dashboard
│   │   │   └── (auth)/                # Auth pages
│   │   │       ├── login/
│   │   │       ├── signup/
│   │   │       └── reset-password/
│   │   ├── middleware.ts              # Auth checks + zone routing
│   │   └── next.config.js             # Multi-zone rewrites
│   │
│   ├── dashboard/                     # Epic 6: Dashboard Zone
│   │   ├── app/
│   │   │   ├── page.tsx              # Main dashboard with KPIs
│   │   │   ├── layout.tsx            # Dashboard navigation
│   │   │   └── components/
│   │   │       ├── KPIWidget.tsx
│   │   │       ├── CashFlowChart.tsx
│   │   │       └── OverduePayments.tsx
│   │   └── next.config.js            # basePath: /dashboard
│   │
│   ├── agency/                        # Epic 2: Agency & Users Zone
│   │   ├── app/
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx          # Agency settings
│   │   │   │   └── components/
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          # User management
│   │   │   │   ├── new/
│   │   │   │   └── components/
│   │   │   └── profile/
│   │   │       └── page.tsx          # User profile
│   │   └── next.config.js            # basePath: /agency
│   │
│   ├── entities/                      # Epic 3: Core Entities Zone
│   │   ├── app/
│   │   │   ├── colleges/
│   │   │   │   ├── page.tsx          # College list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx      # College detail
│   │   │   │   ├── new/
│   │   │   │   └── components/
│   │   │   └── students/
│   │   │       ├── page.tsx          # Student list
│   │   │       ├── [id]/
│   │   │       │   └── page.tsx      # Student detail
│   │   │       ├── new/
│   │   │       └── components/
│   │   └── next.config.js            # basePath: /entities
│   │
│   ├── payments/                      # Epic 4: Payment Plans Zone
│   │   ├── app/
│   │   │   ├── plans/
│   │   │   │   ├── page.tsx          # Payment plans list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx      # Plan detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # Multi-step wizard
│   │   │   ├── installments/
│   │   │   └── components/
│   │   │       ├── PaymentPlanWizard.tsx
│   │   │       └── InstallmentTable.tsx
│   │   └── next.config.js            # basePath: /payments
│   │
│   └── reports/                       # Epic 7: Reporting Zone
│       ├── app/
│       │   ├── commissions/
│       │   │   └── page.tsx          # Commission reports
│       │   ├── payments/
│       │   │   └── page.tsx          # Payment reports
│       │   └── components/
│       │       ├── ReportBuilder.tsx
│       │       └── PDFExporter.tsx
│       └── next.config.js            # basePath: /reports
│
├── packages/
│   ├── ui/                            # Shared UI components
│   │   ├── src/
│   │   │   ├── components/           # Shadcn UI components
│   │   │   ├── hooks/                # Shared React hooks
│   │   │   └── lib/
│   │   │       └── utils.ts
│   │   └── package.json
│   │
│   ├── database/                      # Supabase client & types
│   │   ├── src/
│   │   │   ├── client.ts             # Client-side Supabase
│   │   │   ├── server.ts             # Server-side Supabase
│   │   │   ├── middleware.ts         # Auth middleware
│   │   │   └── types/
│   │   │       └── database.types.ts # Supabase generated
│   │   └── package.json
│   │
│   ├── auth/                          # Auth utilities
│   │   ├── src/
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   └── utils/
│   │   │       └── session.ts
│   │   └── package.json
│   │
│   ├── validations/                   # Shared Zod schemas
│   │   ├── src/
│   │   │   ├── payment-plan.schema.ts
│   │   │   ├── student.schema.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                         # Business logic utilities
│   │   ├── src/
│   │   │   ├── commission-calculator.ts
│   │   │   ├── commission-calculator.test.ts
│   │   │   ├── date-helpers.ts
│   │   │   └── formatters.ts
│   │   └── package.json
│   │
│   ├── stores/                        # Shared Zustand stores
│   │   ├── src/
│   │   │   ├── dashboard-store.ts
│   │   │   └── filters-store.ts
│   │   └── package.json
│   │
│   └── tsconfig/                      # Shared TypeScript configs
│       └── base.json
│
├── supabase/                          # Backend (Domain-Driven Design)
│   ├── migrations/
│   │   ├── 001_agency_domain/        # Epic 1, 2
│   │   │   ├── 001_agencies_schema.sql
│   │   │   ├── 002_users_schema.sql
│   │   │   ├── 003_user_roles_rls.sql
│   │   │   └── 004_invitations_schema.sql
│   │   │
│   │   ├── 002_entities_domain/      # Epic 3
│   │   │   ├── 001_colleges_schema.sql
│   │   │   ├── 002_branches_schema.sql
│   │   │   ├── 003_students_schema.sql
│   │   │   ├── 004_enrollments_schema.sql
│   │   │   └── 005_entities_rls.sql
│   │   │
│   │   ├── 003_payments_domain/      # Epic 4
│   │   │   ├── 001_payment_plans_schema.sql
│   │   │   ├── 002_installments_schema.sql
│   │   │   ├── 003_commission_functions.sql
│   │   │   ├── 004_status_constraints.sql
│   │   │   └── 005_payments_rls.sql
│   │   │
│   │   ├── 004_notifications_domain/ # Epic 5
│   │   │   ├── 001_notifications_schema.sql
│   │   │   ├── 002_notification_rules_schema.sql
│   │   │   ├── 003_notification_log_schema.sql
│   │   │   ├── 004_email_templates_schema.sql
│   │   │   └── 005_status_update_function.sql
│   │   │
│   │   └── 005_audit_domain/         # Epic 8
│   │       ├── 001_audit_logs_schema.sql
│   │       ├── 002_audit_triggers.sql
│   │       └── 003_retention_policies.sql
│   │
│   ├── functions/                     # Supabase Edge Functions
│   │   ├── payments/
│   │   │   └── status-updater/       # Hourly status automation
│   │   │       ├── index.ts
│   │   │       └── deno.json
│   │   │
│   │   ├── notifications/
│   │   │   └── send-notifications/   # Email sending
│   │   │       ├── index.ts
│   │   │       └── deno.json
│   │   │
│   │   └── reports/
│   │       └── generate-pdf/         # PDF generation
│   │           ├── index.ts
│   │           └── deno.json
│   │
│   └── config.toml                    # Supabase configuration
│
├── emails/                            # React Email templates
│   ├── invitation.tsx
│   ├── payment-reminder.tsx
│   ├── commission-alert.tsx
│   └── overdue-notification.tsx
│
├── __tests__/                         # Integration tests
│   ├── e2e/
│   │   ├── payment-flow.spec.ts
│   │   └── dashboard.spec.ts
│   └── setup/
│       └── test-helpers.ts
│
├── turbo.json                         # Turborepo configuration
├── package.json                       # Root package.json
└── README.md
```

## Epic to Architecture Mapping

| Epic | Microfrontend Zone | Database Domain | Key Components |
|------|-------------------|-----------------|----------------|
| **Epic 1: Foundation** | shell (auth) | agency_domain | RLS policies, auth middleware |
| **Epic 2: Agency & Users** | apps/agency/ | agency_domain | User management, invitations, settings |
| **Epic 3: Core Entities** | apps/entities/ | entities_domain | College/Student CRUD, TanStack Table |
| **Epic 4: Payment Plans** | apps/payments/ | payments_domain | Multi-step wizard, commission calculator |
| **Epic 5: Status Automation** | (background) | notifications_domain | pg_cron job, Edge Functions, Resend |
| **Epic 6: Dashboard** | apps/dashboard/ | (queries all domains) | KPI widgets, Recharts, cash flow chart |
| **Epic 7: Reporting** | apps/reports/ | (queries all domains) | Report builder, PDF exports |
| **Epic 8: Audit & Compliance** | apps/agency/audit-logs/ | audit_domain | Audit viewer, triggers, retention |

## Technology Stack Details

### Core Technologies

**Frontend Stack:**
- **Next.js 15.x** (App Router): React framework with Server Components, streaming, and edge optimization
- **TypeScript 5.x**: Static typing for type safety across complex business logic
- **Turborepo**: Monorepo build system with intelligent caching (3-10x faster builds)
- **Tailwind CSS 4.x**: Utility-first CSS framework with JIT compilation
- **React 19**: Latest React with concurrent features and improved Server Components

**Backend Stack:**
- **Supabase**: Open-source Firebase alternative with PostgreSQL
- **PostgreSQL 15+**: Relational database with Row-Level Security (RLS)
- **Supabase Auth**: JWT-based authentication with social providers
- **Supabase Storage**: File storage for student documents/offer letters
- **Supabase Edge Functions**: Deno-based serverless functions at the edge

**State Management:**
- **Zustand 5.0.8**: Client-side state (dashboard filters, UI state)
- **TanStack Query 5.90.7**: Server state (API caching, mutations, optimistic updates)
- **React Hook Form 7.66.0**: Form state with minimal re-renders

**Data & Validation:**
- **Zod 4.x**: TypeScript-first schema validation (14x faster parsing)
- **date-fns 4.1.0**: Date manipulation with first-class timezone support

**UI Libraries:**
- **Shadcn UI**: Copy-paste component library built on Radix UI
- **Radix UI**: Unstyled, accessible UI primitives (WCAG 2.1 AA compliant)
- **Recharts 3.3.0**: Composable charting library for dashboards
- **TanStack Table 8.21.3**: Headless table library for data grids

**Communication & Integration:**
- **Resend 6.4.2**: Email API with React Email template support
- **@react-pdf/renderer 4.3.1**: Generate PDFs from React components
- **pg_cron**: PostgreSQL extension for scheduled jobs

### Integration Points

**Multi-Zone Communication:**
- **Navigation:** Hard navigation between zones via URL rewrites
- **Shared State:** URL parameters, Supabase Realtime subscriptions
- **Shared Packages:** `packages/ui`, `packages/database`, `packages/utils`
- **Session Sharing:** HTTP-only cookies via middleware (works across zones)

**Database to Frontend:**
- **Server Components:** Direct Supabase queries with RLS auto-applied
- **API Routes:** Next.js API routes for mutations and complex logic
- **TanStack Query:** Client-side caching and optimistic updates
- **Realtime:** Supabase Realtime for live dashboard updates (optional)

**Background Jobs to Database:**
- **pg_cron:** Schedules PostgreSQL functions (runs every hour)
- **Edge Functions:** Called via HTTP from pg_cron or database triggers
- **Webhooks:** Supabase webhooks for external integrations (future)

**Email Integration:**
- **React Email:** Templates in `emails/` directory
- **Resend API:** Sends via Edge Functions or API routes
- **Database Tracking:** `notification_log` table prevents duplicate sends

## Novel Pattern Designs

### Pattern 1: Multi-Stakeholder Notification System

**Purpose:** Send different notifications to different stakeholders based on configurable rules

**Problem Solved:**
- Single event (installment overdue) needs to notify 4 stakeholder types
- Each stakeholder needs different message templates
- Time-based pre-notifications (36 hours before due, at 5 AM)
- Conditional sending (only if enabled per agency)
- One-time-only rule (prevent duplicate emails)

**Architecture:**

```sql
-- Notification Rules (per agency configuration)
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  recipient_type TEXT CHECK (recipient_type IN ('agency_user', 'student', 'college', 'sales_agent')),
  event_type TEXT CHECK (event_type IN ('installment_overdue', 'installment_due_soon', 'payment_received')),
  is_enabled BOOLEAN DEFAULT false,
  template_id UUID REFERENCES email_templates(id),
  trigger_config JSONB,  -- { advance_hours?: 36, trigger_time?: "05:00", timezone?: "Australia/Brisbane" }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Log (prevents duplicates)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY,
  installment_id UUID REFERENCES installments(id),
  recipient_type TEXT,
  recipient_email TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(installment_id, recipient_type, recipient_email)
);

-- Email Templates (custom per agency)
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  template_type TEXT,
  subject TEXT,
  body_html TEXT,
  variables JSONB,  -- { "student_name": "{{student.name}}", "amount": "{{installment.amount}}" }
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Implementation Flow:**

```typescript
// Edge Function: send-notifications
export async function sendNotifications(event: NotificationEvent) {
  // 1. Query enabled notification rules for this event
  const rules = await supabase
    .from('notification_rules')
    .select('*, email_templates(*)')
    .eq('agency_id', event.agency_id)
    .eq('event_type', event.event_type)
    .eq('is_enabled', true)

  // 2. For each rule, check if already sent
  for (const rule of rules.data) {
    const recipients = await getRecipients(rule.recipient_type, event)

    for (const recipient of recipients) {
      // Check log to prevent duplicates
      const { data: existingLog } = await supabase
        .from('notification_log')
        .select('id')
        .eq('installment_id', event.installment_id)
        .eq('recipient_type', rule.recipient_type)
        .eq('recipient_email', recipient.email)
        .single()

      if (existingLog) continue  // Already sent

      // 3. Render template with data
      const emailContent = renderTemplate(rule.email_templates, {
        student: event.student,
        installment: event.installment,
        agency: event.agency
      })

      // 4. Send via Resend
      await resend.emails.send({
        from: event.agency.contact_email,
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html
      })

      // 5. Log the send
      await supabase.from('notification_log').insert({
        installment_id: event.installment_id,
        recipient_type: rule.recipient_type,
        recipient_email: recipient.email
      })
    }
  }
}
```

**Affects Epics:** Epic 5 (Intelligent Status Automation)

---

### Pattern 2: Commission Calculation Engine

**Purpose:** Calculate commissions accurately with multi-tier fee deductions and GST handling

**Problem Solved:**
- Total course value includes commission-eligible tuition AND non-commissionable fees
- GST can be inclusive or exclusive (affects calculation base)
- Initial payment + installments have different due dates (student vs college timelines)
- Earned commission calculated proportionally as payments received
- Future: Tiered bonuses based on student count

**Architecture:**

```typescript
// Domain Model
interface PaymentPlan {
  total_course_value: number
  commission_rate: number  // 0-1 format (0.15 = 15%)
  gst_inclusive: boolean

  // Non-commissionable fees
  materials_cost: number
  admin_fees: number
  other_fees: number

  // Calculated (stored)
  commissionable_value: number
  expected_commission: number

  // Calculated (computed on query)
  earned_commission: number
}

interface Installment {
  installment_number: number  // 0 = initial payment
  amount: number
  is_initial_payment: boolean
  generates_commission: boolean

  // Dual timeline
  student_due_date: Date
  college_due_date: Date
  student_lead_time_days: number  // calculated: college_due - student_due

  // Payment tracking
  status: InstallmentStatus
  paid_amount?: number
  paid_date?: Date
}
```

**SQL Implementation:**

```sql
-- Calculation function (reusable in triggers and queries)
CREATE OR REPLACE FUNCTION calculate_commissionable_value(
  total_value DECIMAL,
  materials DECIMAL,
  admin DECIMAL,
  other DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN total_value - materials - admin - other;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_expected_commission(
  commissionable_value DECIMAL,
  commission_rate DECIMAL,
  gst_inclusive BOOLEAN
) RETURNS DECIMAL AS $$
DECLARE
  base_value DECIMAL;
BEGIN
  IF gst_inclusive THEN
    base_value := commissionable_value;
  ELSE
    -- Remove GST (assuming 10% GST rate)
    base_value := commissionable_value / 1.10;
  END IF;

  RETURN base_value * commission_rate;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate on insert/update
CREATE OR REPLACE FUNCTION update_payment_plan_commissions()
RETURNS TRIGGER AS $$
BEGIN
  NEW.commissionable_value := calculate_commissionable_value(
    NEW.total_course_value,
    NEW.materials_cost,
    NEW.admin_fees,
    NEW.other_fees
  );

  NEW.expected_commission := calculate_expected_commission(
    NEW.commissionable_value,
    NEW.commission_rate,
    NEW.gst_inclusive
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_plan_commission_trigger
  BEFORE INSERT OR UPDATE ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_plan_commissions();

-- Earned commission (computed via query or materialized view)
CREATE OR REPLACE FUNCTION calculate_earned_commission(plan_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  plan RECORD;
  total_paid DECIMAL;
  paid_ratio DECIMAL;
BEGIN
  -- Get payment plan
  SELECT * INTO plan FROM payment_plans WHERE id = plan_id;

  -- Sum paid installments (only those generating commission)
  SELECT COALESCE(SUM(paid_amount), 0) INTO total_paid
  FROM installments
  WHERE payment_plan_id = plan_id
    AND generates_commission = true
    AND status = 'paid';

  -- Calculate earned ratio
  paid_ratio := total_paid / NULLIF(plan.commissionable_value, 0);

  RETURN plan.expected_commission * paid_ratio;
END;
$$ LANGUAGE plpgsql;
```

**TypeScript Utilities:**

```typescript
// packages/utils/src/commission-calculator.ts

export function calculateCommissionableValue(plan: {
  total_course_value: number
  materials_cost: number
  admin_fees: number
  other_fees: number
}): number {
  return plan.total_course_value - plan.materials_cost - plan.admin_fees - plan.other_fees
}

export function calculateExpectedCommission(plan: {
  commissionable_value: number
  commission_rate: number
  gst_inclusive: boolean
}): number {
  const baseValue = plan.gst_inclusive
    ? plan.commissionable_value
    : plan.commissionable_value / 1.10  // Remove 10% GST

  return baseValue * plan.commission_rate
}

export function calculateEarnedCommission(
  plan: { expected_commission: number; commissionable_value: number },
  paidInstallments: { paid_amount: number; generates_commission: boolean }[]
): number {
  const totalPaid = paidInstallments
    .filter(i => i.generates_commission)
    .reduce((sum, i) => sum + i.paid_amount, 0)

  const paidRatio = totalPaid / plan.commissionable_value
  return plan.expected_commission * paidRatio
}

// Student vs College Due Date Calculation
export function calculateStudentDueDate(
  collegeDueDate: Date,
  studentLeadTimeDays: number
): Date {
  return subDays(collegeDueDate, studentLeadTimeDays)
}

export function calculateCollegeDueDate(
  studentDueDate: Date,
  studentLeadTimeDays: number
): Date {
  return addDays(studentDueDate, studentLeadTimeDays)
}
```

**Affects Epics:** Epic 4 (Payment Plan Engine), Epic 6 (Dashboard), Epic 7 (Reporting)

---

### Pattern 3: Automated Status State Machine

**Purpose:** Automatically transition installment statuses based on dates and time-of-day

**Problem Solved:**
- Mix of automated and manual state transitions
- Time-of-day awareness (5 PM cutoff, not midnight)
- Agency-specific timezone handling
- Configurable threshold (4-day "due soon" window)
- Must run reliably without duplicate transitions

**Architecture:**

```sql
-- Installment Status Enum
CREATE TYPE installment_status AS ENUM (
  'draft',      -- Created but not active
  'pending',    -- Active, not yet close to due
  'due_soon',   -- Within threshold days of due
  'overdue',    -- Past due date + cutoff time
  'paid',       -- Student paid (manual)
  'completed'   -- Agency received commission (manual)
);

-- Agency Settings
ALTER TABLE agencies ADD COLUMN due_soon_threshold_days INT DEFAULT 4;
ALTER TABLE agencies ADD COLUMN overdue_cutoff_time TIME DEFAULT '17:00';
ALTER TABLE agencies ADD COLUMN timezone TEXT DEFAULT 'Australia/Brisbane';

-- Status Transition Constraints
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allowed transitions map
  IF (OLD.status = 'draft' AND NEW.status NOT IN ('pending')) OR
     (OLD.status = 'pending' AND NEW.status NOT IN ('due_soon', 'overdue', 'paid')) OR
     (OLD.status = 'due_soon' AND NEW.status NOT IN ('overdue', 'paid')) OR
     (OLD.status = 'overdue' AND NEW.status NOT IN ('paid')) OR
     (OLD.status = 'paid' AND NEW.status NOT IN ('completed')) OR
     (OLD.status = 'completed') -- Terminal state
  THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER installment_status_transition_check
  BEFORE UPDATE ON installments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_status_transition();

-- Automated Status Update Function
CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(
  agency_id UUID,
  updated_count INT,
  transitions JSONB
) AS $$
DECLARE
  agency RECORD;
  current_time_in_zone TIMESTAMPTZ;
  draft_to_pending INT;
  pending_to_due_soon INT;
  to_overdue INT;
BEGIN
  -- Loop through each agency (different timezones)
  FOR agency IN
    SELECT id, timezone, due_soon_threshold_days, overdue_cutoff_time
    FROM agencies
  LOOP
    -- Get current time in agency's timezone
    current_time_in_zone := (now() AT TIME ZONE agency.timezone);

    -- Draft → Pending (due date has arrived)
    WITH updated AS (
      UPDATE installments SET status = 'pending'
      WHERE agency_id = agency.id
        AND status = 'draft'
        AND student_due_date <= CURRENT_DATE
      RETURNING id
    )
    SELECT COUNT(*) INTO draft_to_pending FROM updated;

    -- Pending → Due Soon (within threshold)
    WITH updated AS (
      UPDATE installments SET status = 'due_soon'
      WHERE agency_id = agency.id
        AND status = 'pending'
        AND student_due_date <= CURRENT_DATE + agency.due_soon_threshold_days
      RETURNING id
    )
    SELECT COUNT(*) INTO pending_to_due_soon FROM updated;

    -- Pending/Due Soon → Overdue (past due + cutoff time)
    WITH updated AS (
      UPDATE installments SET status = 'overdue'
      WHERE agency_id = agency.id
        AND status IN ('pending', 'due_soon')
        AND (
          student_due_date < CURRENT_DATE
          OR (
            student_due_date = CURRENT_DATE
            AND current_time_in_zone::TIME > agency.overdue_cutoff_time
          )
        )
      RETURNING id
    )
    SELECT COUNT(*) INTO to_overdue FROM updated;

    -- Return results for this agency
    RETURN QUERY SELECT
      agency.id,
      draft_to_pending + pending_to_due_soon + to_overdue,
      jsonb_build_object(
        'draft_to_pending', draft_to_pending,
        'pending_to_due_soon', pending_to_due_soon,
        'to_overdue', to_overdue
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (runs every hour)
SELECT cron.schedule(
  'update-installment-statuses',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT * FROM update_installment_statuses()$$
);

-- Audit trigger for status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      entity_type,
      entity_id,
      agency_id,
      user_id,
      action,
      old_values,
      new_values,
      created_at
    ) VALUES (
      'installment',
      NEW.id,
      NEW.agency_id,
      current_setting('app.current_user_id', TRUE)::UUID,  -- NULL for automated
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER installment_status_audit
  AFTER UPDATE ON installments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_status_change();
```

**Monitoring Query:**

```sql
-- Check status automation health
SELECT
  agency_id,
  status,
  COUNT(*) as count,
  MIN(student_due_date) as earliest_due,
  MAX(student_due_date) as latest_due
FROM installments
WHERE status IN ('pending', 'due_soon', 'overdue')
GROUP BY agency_id, status
ORDER BY agency_id, status;
```

**Affects Epics:** Epic 5 (Intelligent Status Automation), Epic 6 (Dashboard - overdue counts)

## Implementation Patterns

### Naming Conventions

**API Endpoints:**
```typescript
// REST pattern: Plural nouns, kebab-case
GET    /api/payment-plans
POST   /api/payment-plans
GET    /api/payment-plans/:id
PATCH  /api/payment-plans/:id
DELETE /api/payment-plans/:id

// Nested resources
GET    /api/payment-plans/:id/installments
POST   /api/payment-plans/:id/installments

// Actions (non-CRUD)
POST   /api/installments/:id/mark-paid
POST   /api/agencies/:id/export-data
```

**Database:**
```sql
-- Tables: plural, snake_case
agencies, users, payment_plans, installments

-- Columns: snake_case
agency_id, created_at, student_due_date, is_gst_inclusive

-- Functions: snake_case with verb prefix
calculate_commission(), update_installment_statuses()
```

**React Components:**
```typescript
// PascalCase
PaymentPlanForm.tsx
InstallmentTable.tsx

// Hooks: camelCase with 'use' prefix
usePaymentPlans.ts
useAuth.ts

// Types: PascalCase
type PaymentPlan = { ... }
interface ApiResponse<T> { ... }
```

### Code Organization

**Zone Structure:**
```
apps/{zone}/
├── app/
│   ├── {feature}/
│   │   ├── page.tsx              # Server Component (list view)
│   │   ├── [id]/page.tsx         # Server Component (detail view)
│   │   ├── new/page.tsx          # Server Component (create form)
│   │   └── components/           # Client Components
│   │       ├── {Feature}Form.tsx
│   │       └── {Feature}Table.tsx
│   └── layout.tsx
├── lib/
│   └── api.ts                    # API client functions
└── next.config.js
```

**Shared Package Structure:**
```
packages/{package}/
├── src/
│   ├── index.ts                  # Public API exports
│   ├── {feature}/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── types/
└── package.json
```

### Error Handling

**Custom Error Classes:**
```typescript
// packages/utils/src/errors.ts
export class AppError extends Error {
  constructor(
    public code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVER_ERROR',
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('NOT_FOUND', message)
  }
}
```

**API Response Format:**
```typescript
// Success
type SuccessResponse<T> = {
  success: true
  data: T
}

// Error
type ErrorResponse = {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

// Paginated
type PaginatedResponse<T> = {
  success: true
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}
```

**API Route Error Handler:**
```typescript
// packages/utils/src/api-error-handler.ts
export async function handleApiError(error: unknown): Promise<NextResponse> {
  if (error instanceof AppError) {
    const statusCode = {
      VALIDATION_ERROR: 400,
      NOT_FOUND: 404,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      SERVER_ERROR: 500
    }[error.code]

    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: statusCode })
  }

  // Unexpected errors
  console.error('Unexpected error:', error)
  return NextResponse.json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  }, { status: 500 })
}
```

### Authentication Pattern

**Supabase Client Setup:**
```typescript
// packages/database/src/server.ts
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

**Middleware:**
```typescript
// apps/shell/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/agency/:path*', '/entities/:path*', '/payments/:path*', '/reports/:path*']
}
```

### Database Access Pattern

**Server Component Query:**
```typescript
// apps/dashboard/app/page.tsx
import { createServerClient } from '@/packages/database'

export default async function DashboardPage() {
  const supabase = createServerClient()

  // RLS automatically filters by user's agency_id
  const { data: kpis, error } = await supabase
    .from('payment_plans')
    .select('*, installments(*)')
    .eq('status', 'active')

  if (error) throw error

  return <DashboardView kpis={kpis} />
}
```

**Client Component Query (TanStack Query):**
```typescript
// apps/payments/app/plans/components/PaymentPlanList.tsx
'use client'
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/packages/database'

export function PaymentPlanList() {
  const supabase = useSupabase()

  const { data, isLoading } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*, students(*), colleges(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  if (isLoading) return <Skeleton />

  return <Table data={data} />
}
```

### Form Handling Pattern

```typescript
// apps/payments/app/plans/new/components/PaymentPlanForm.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { paymentPlanSchema } from '@/packages/validations'

type FormData = z.infer<typeof paymentPlanSchema>

export function PaymentPlanForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(paymentPlanSchema),
    defaultValues: {
      total_course_value: 0,
      commission_rate: 0.15,
      materials_cost: 0,
      admin_fees: 0,
      other_fees: 0,
      gst_inclusive: true
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/payment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      toast.success('Payment plan created')
      router.push('/payments/plans')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => mutation.mutate(data))}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### Date Handling Pattern

```typescript
// packages/utils/src/date-helpers.ts
import { format, formatDistanceToNow, subDays, addDays } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

export function formatDateInAgencyTimezone(
  date: Date,
  timezone: string,
  formatStr: string = 'PPpp'
): string {
  return formatInTimeZone(date, timezone, formatStr)
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function calculateStudentDueDate(
  collegeDueDate: Date,
  leadTimeDays: number
): Date {
  return subDays(collegeDueDate, leadTimeDays)
}

export function isOverdue(
  dueDate: Date,
  cutoffTime: string, // "17:00"
  timezone: string
): boolean {
  const now = toZonedTime(new Date(), timezone)
  const due = toZonedTime(dueDate, timezone)

  if (now < due) return false
  if (now.getDate() > due.getDate()) return true

  // Same day - check cutoff time
  const [hours, minutes] = cutoffTime.split(':').map(Number)
  const cutoff = new Date(now)
  cutoff.setHours(hours, minutes, 0, 0)

  return now >= cutoff
}

// Always store in UTC
export function toUTC(date: Date): string {
  return date.toISOString()
}
```

### Logging Pattern

```typescript
// packages/utils/src/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  user_id?: string
  agency_id?: string
  request_id?: string
  action?: string
  [key: string]: any
}

export function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
) {
  const logEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    context,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console[level](JSON.stringify(logEntry, null, 2))
  } else {
    console[level](JSON.stringify(logEntry))
  }
}
```

## Data Architecture

### Domain-Driven Database Schema

**Agency Domain (Epic 1, 2):**
```sql
-- Core multi-tenancy table
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  currency TEXT DEFAULT 'AUD',
  timezone TEXT DEFAULT 'Australia/Brisbane',
  due_soon_threshold_days INT DEFAULT 4,
  overdue_cutoff_time TIME DEFAULT '17:00',
  subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')) DEFAULT 'basic',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users with role-based access
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('agency_admin', 'agency_user')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  email_notifications_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('agency_admin', 'agency_user')) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agency"
  ON agencies FOR SELECT
  USING (id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view users in their agency"
  ON users FOR SELECT
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage users in their agency"
  ON users FOR ALL
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );
```

**Entities Domain (Epic 3):**
```sql
-- Colleges
CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  default_commission_rate_percent DECIMAL(5,2) CHECK (default_commission_rate_percent BETWEEN 0 AND 100),
  gst_status TEXT CHECK (gst_status IN ('included', 'excluded')) DEFAULT 'included',
  contract_expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Branches (campuses)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  commission_rate_percent DECIMAL(5,2),  -- Overrides college default
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- College contacts
CREATE TABLE college_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role_department TEXT,
  position_title TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  passport_number TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,
  visa_status TEXT CHECK (visa_status IN ('in_process', 'approved', 'denied', 'expired')),
  assigned_user_id UUID REFERENCES users(id),  -- Sales agent
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, passport_number)
);

-- Student documents
CREATE TABLE student_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('offer_letter', 'passport', 'visa', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enrollments (links students to colleges/branches)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  program_name TEXT,
  start_date DATE,
  expected_end_date DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies (apply to all tables)
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ... (apply agency_id filter to all)

CREATE POLICY "Users access their agency data"
  ON colleges FOR ALL
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

**Payments Domain (Epic 4, 5):**
```sql
-- Payment plans
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,

  -- Financial details
  total_course_value DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL CHECK (commission_rate BETWEEN 0 AND 1),  -- 0-1 format
  gst_inclusive BOOLEAN DEFAULT true,

  -- Non-commissionable fees
  materials_cost DECIMAL(12,2) DEFAULT 0,
  admin_fees DECIMAL(12,2) DEFAULT 0,
  other_fees DECIMAL(12,2) DEFAULT 0,

  -- Calculated (auto-updated by trigger)
  commissionable_value DECIMAL(12,2),
  expected_commission DECIMAL(12,2),

  -- Timeline
  first_college_due_date DATE,
  student_lead_time_days INT DEFAULT 0,

  -- Status
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  reference_number TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Installments
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,

  installment_number INT NOT NULL,  -- 0 = initial payment
  amount DECIMAL(12,2) NOT NULL,
  is_initial_payment BOOLEAN DEFAULT false,
  generates_commission BOOLEAN DEFAULT true,

  -- Dual timeline
  student_due_date DATE NOT NULL,
  college_due_date DATE NOT NULL,

  -- Status
  status installment_status DEFAULT 'draft',

  -- Payment tracking
  paid_amount DECIMAL(12,2),
  paid_date DATE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(payment_plan_id, installment_number)
);

-- Installment notes
CREATE TABLE installment_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_id UUID REFERENCES installments(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_installments_status ON installments(agency_id, status);
CREATE INDEX idx_installments_due_date ON installments(agency_id, student_due_date);
CREATE INDEX idx_payment_plans_status ON payment_plans(agency_id, status);
```

**Notifications Domain (Epic 5):**
```sql
-- Notification rules (per agency configuration)
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  recipient_type TEXT CHECK (recipient_type IN ('agency_user', 'student', 'college', 'sales_agent')),
  event_type TEXT CHECK (event_type IN ('installment_overdue', 'installment_due_soon', 'payment_received')),
  is_enabled BOOLEAN DEFAULT false,
  template_id UUID REFERENCES email_templates(id),
  trigger_config JSONB,  -- { advance_hours?: 36, trigger_time?: "05:00" }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email templates (custom per agency)
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  template_type TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB,  -- Variable placeholders
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notification log (prevents duplicates)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_id UUID REFERENCES installments(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(installment_id, recipient_type, recipient_email)
);
```

**Audit Domain (Epic 8):**
```sql
-- Comprehensive audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),  -- NULL for automated

  -- What changed
  entity_type TEXT NOT NULL,  -- 'payment_plan', 'installment', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'status_change'

  -- Change details
  old_values JSONB,
  new_values JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_audit_logs_entity ON audit_logs(agency_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(agency_id, created_at DESC);

-- Immutable (insert-only)
CREATE POLICY "Audit logs are insert-only"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );
```

### Data Relationships

```
agencies (1) ─── (M) users
agencies (1) ─── (M) colleges
colleges (1) ─── (M) branches
colleges (1) ─── (M) college_contacts
agencies (1) ─── (M) students
students (1) ─── (M) student_documents
students (1) ─── (M) enrollments ─── (1) branches
enrollments (1) ─── (M) payment_plans
payment_plans (1) ─── (M) installments
installments (1) ─── (M) installment_notes
agencies (1) ─── (M) notification_rules
agencies (1) ─── (M) email_templates
installments (1) ─── (M) notification_log
agencies (1) ─── (M) audit_logs
```

## API Contracts

### Authentication Endpoints

```typescript
POST /api/auth/signup
Request: {
  email: string
  password: string
  full_name: string
}
Response: {
  success: true
  data: { user: User, session: Session }
}

POST /api/auth/login
Request: {
  email: string
  password: string
}
Response: {
  success: true
  data: { user: User, session: Session }
}

POST /api/auth/logout
Response: {
  success: true
}

POST /api/auth/reset-password
Request: {
  email: string
}
Response: {
  success: true
  data: { message: "Password reset email sent" }
}
```

### Payment Plans Endpoints

```typescript
GET /api/payment-plans
Query: {
  status?: 'active' | 'completed' | 'cancelled'
  student_id?: string
  college_id?: string
  page?: number
  per_page?: number
}
Response: {
  success: true
  data: PaymentPlan[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

POST /api/payment-plans
Request: {
  enrollment_id: string
  total_course_value: number
  commission_rate: number  // 0-1 format
  gst_inclusive: boolean
  materials_cost: number
  admin_fees: number
  other_fees: number
  first_college_due_date: string  // ISO date
  student_lead_time_days: number
  installments: Array<{
    installment_number: number
    amount: number
    is_initial_payment: boolean
    generates_commission: boolean
  }>
}
Response: {
  success: true
  data: PaymentPlan
}

GET /api/payment-plans/:id
Response: {
  success: true
  data: PaymentPlan & {
    installments: Installment[]
    enrollment: Enrollment & {
      student: Student
      branch: Branch & { college: College }
    }
  }
}

PATCH /api/payment-plans/:id
Request: Partial<PaymentPlan>
Response: {
  success: true
  data: PaymentPlan
}
```

### Installments Endpoints

```typescript
POST /api/installments/:id/mark-paid
Request: {
  paid_amount: number
  paid_date: string  // ISO date
  notes?: string
}
Response: {
  success: true
  data: Installment
}

POST /api/installments/:id/mark-completed
Request: {
  completion_date: string  // ISO date
  payment_reference?: string
}
Response: {
  success: true
  data: Installment
}

POST /api/installments/:id/notes
Request: {
  content: string  // max 2000 chars
}
Response: {
  success: true
  data: InstallmentNote
}
```

### Dashboard Endpoints

```typescript
GET /api/dashboard/kpis
Response: {
  success: true
  data: {
    total_active_students: number
    total_active_payment_plans: number
    total_outstanding_amount: number
    total_earned_commission: number
    payment_collection_rate: number
    total_overdue_amount: number
    overdue_count: number
    projection_90_days: number
  }
}

GET /api/dashboard/cash-flow
Query: {
  days?: number  // default: 90
  group_by?: 'day' | 'week' | 'month'  // default: 'week'
}
Response: {
  success: true
  data: Array<{
    date: string
    expected_amount: number
    paid_amount: number
    count_installments: number
  }>
}

GET /api/dashboard/commission-by-college
Query: {
  period?: 'all' | 'year' | 'quarter' | 'month'
  college_id?: string
  branch_id?: string
}
Response: {
  success: true
  data: Array<{
    college_name: string
    branch_name: string
    city: string
    total_commissions: number
    total_gst: number
    total_with_gst: number
    expected_commission: number
    earned_commission: number
    outstanding_commission: number
  }>
}
```

### Reports Endpoints

```typescript
POST /api/reports/payment-plans
Request: {
  filters: {
    date_from?: string
    date_to?: string
    college_id?: string
    student_id?: string
    status?: string[]
  }
  columns: string[]
  format: 'preview' | 'csv' | 'pdf'
}
Response: {
  success: true
  data: PaymentPlan[] | { download_url: string }
}

POST /api/reports/commissions
Request: {
  filters: {
    date_from?: string
    date_to?: string
    college_id?: string
  }
  format: 'preview' | 'csv' | 'pdf'
}
Response: {
  success: true
  data: CommissionReport[] | { download_url: string }
}
```

## Security Architecture

### Multi-Tenant Isolation (Row-Level Security)

**RLS Policy Pattern:**
```sql
-- Apply to ALL tenant-scoped tables
CREATE POLICY "tenant_isolation"
  ON {table_name} FOR ALL
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

**JWT Claims:**
```json
{
  "sub": "user-uuid",
  "email": "user@agency.com",
  "agency_id": "agency-uuid",
  "role": "agency_admin" | "agency_user",
  "exp": 1234567890
}
```

**RLS Context Setting:**
- Supabase Auth automatically sets `auth.uid()` from JWT
- RLS policies reference `auth.uid()` to filter by agency
- Impossible to query other agencies' data (enforced at DB level)

### Authentication Flow

1. User submits login (email/password) → Supabase Auth
2. Supabase returns JWT with user_id claim
3. JWT stored in HTTP-only cookie
4. Middleware validates JWT on protected routes
5. Server/API requests include JWT → Supabase sets RLS context
6. All queries auto-filtered by user's agency_id

### Authorization Levels

**Agency Admin:**
- Full agency data access
- User management (invite, remove, change roles)
- Agency settings management
- Audit log access
- Email/profile changes for all users

**Agency User:**
- View/edit core entities (colleges, students, payment plans)
- Cannot manage users
- Cannot access audit logs
- Cannot change own email (requires admin)

### Data Encryption

- **At Rest:** PostgreSQL database encryption (AES-256)
- **In Transit:** TLS 1.3 (HTTPS) for all API requests
- **Passwords:** bcrypt hashing via Supabase Auth
- **Session Tokens:** HTTP-only cookies (not accessible to JavaScript)
- **Sensitive Fields:** Consider column-level encryption for future (e.g., passport numbers)

### Audit Trail

**Automatic Logging:**
- Database triggers log all CUD operations
- Includes: user_id (NULL for automated), timestamp, old/new values
- Immutable (insert-only) audit_logs table
- Admin-only access via RLS

**Logged Entities:**
- Colleges, Students, Payment Plans, Installments
- User profile changes
- Agency settings changes
- All status transitions (manual and automated)

## Performance Considerations

### Page Load Optimization

**Dashboard (<2s target):**
- Server Components fetch KPIs server-side (0 client roundtrips)
- Parallel data fetching (multiple Supabase queries in parallel)
- Recharts lazy-loaded (code split)
- TanStack Query cache (5-minute stale time for KPIs)
- Skeleton loading states (perceived performance)

**Payment Plans List:**
- Server Component initial render with 20 rows
- TanStack Table handles pagination/sorting client-side
- Infinite scroll for large lists (TanStack Query infinite queries)
- Debounced search (300ms delay)

### Database Query Optimization

**Indexes:**
```sql
-- Critical for RLS performance
CREATE INDEX idx_agencies ON {table}(agency_id);

-- Status queries
CREATE INDEX idx_installments_status ON installments(agency_id, status);
CREATE INDEX idx_installments_due_date ON installments(agency_id, student_due_date);

-- Dashboard queries
CREATE INDEX idx_payment_plans_status ON payment_plans(agency_id, status);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(agency_id, created_at DESC);
```

**Query Patterns:**
```typescript
// Good: Select only needed columns
.select('id, name, created_at')

// Good: Use joins instead of multiple queries
.select('*, students(*), colleges(*)')

// Good: Use single() for one record
.select('*').eq('id', id).single()

// Bad: Select all + manual filtering
.select('*')  // Then filter in JS
```

### Caching Strategy

**TanStack Query:**
```typescript
// KPI data: 5-minute stale time
queryClient.setQueryDefaults(['kpis'], {
  staleTime: 5 * 60 * 1000
})

// Payment plans: 1-minute stale time
queryClient.setQueryDefaults(['payment-plans'], {
  staleTime: 60 * 1000
})

// Static data: 1-hour stale time
queryClient.setQueryDefaults(['colleges'], {
  staleTime: 60 * 60 * 1000
})
```

**Vercel Edge Caching:**
```typescript
// Cache API responses
export const revalidate = 300  // 5 minutes

// Or dynamic:
import { unstable_cache } from 'next/cache'

const getCachedKPIs = unstable_cache(
  async (agencyId) => fetchKPIs(agencyId),
  ['kpis'],
  { revalidate: 300 }
)
```

### Bundle Size Optimization

**Multi-Zone Benefits:**
- Smaller per-zone bundles (~200KB vs 1MB+)
- Shared `packages/ui` reduces duplication
- Tree-shaking via ES modules

**Code Splitting:**
```typescript
// Lazy load heavy components
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  loading: () => <Skeleton />,
  ssr: false
})

// Lazy load charts
const CashFlowChart = dynamic(() => import('./CashFlowChart'))
```

**Image Optimization:**
```typescript
// Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Agency logo"
  priority  // For above-the-fold images
/>
```

## Deployment Architecture

### Vercel Deployment Strategy

**Multi-Zone Deployment:**
```
┌─────────────────────────────────────────────┐
│ Shell App (pleeno.com)                      │
│ ├─ /login, /signup                          │
│ └─ Rewrites to zones                        │
└─────────────────────────────────────────────┘
         │
         ├─> Dashboard Zone (dashboard-pleeno.vercel.app)
         ├─> Agency Zone (agency-pleeno.vercel.app)
         ├─> Entities Zone (entities-pleeno.vercel.app)
         ├─> Payments Zone (payments-pleeno.vercel.app)
         └─> Reports Zone (reports-pleeno.vercel.app)
```

**Deployment Config (vercel.json):**
```json
{
  "version": 2,
  "builds": [
    { "src": "apps/shell/package.json", "use": "@vercel/next" },
    { "src": "apps/dashboard/package.json", "use": "@vercel/next" },
    { "src": "apps/agency/package.json", "use": "@vercel/next" },
    { "src": "apps/entities/package.json", "use": "@vercel/next" },
    { "src": "apps/payments/package.json", "use": "@vercel/next" },
    { "src": "apps/reports/package.json", "use": "@vercel/next" }
  ],
  "routes": [
    { "src": "/dashboard/(.*)", "dest": "apps/dashboard/$1" },
    { "src": "/agency/(.*)", "dest": "apps/agency/$1" },
    { "src": "/entities/(.*)", "dest": "apps/entities/$1" },
    { "src": "/payments/(.*)", "dest": "apps/payments/$1" },
    { "src": "/reports/(.*)", "dest": "apps/reports/$1" },
    { "src": "/(.*)", "dest": "apps/shell/$1" }
  ]
}
```

### Supabase Deployment

**Local Development:**
```bash
supabase start  # Starts local Docker containers
supabase db reset  # Reset database with migrations
supabase functions serve  # Test Edge Functions locally
```

**Staging/Production:**
```bash
# Link to Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy status-updater
supabase functions deploy send-notifications
```

### CI/CD Pipeline

**GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://pleeno.com
NODE_ENV=production
```

## Development Environment

### Prerequisites

- **Node.js:** 18.x or later
- **npm:** 9.x or later
- **Docker:** Latest (for Supabase local development)
- **Git:** Latest

### Setup Commands

```bash
# 1. Clone repository
git clone https://github.com/your-org/pleeno-monorepo.git
cd pleeno-monorepo

# 2. Install dependencies
npm install

# 3. Start Supabase (Docker required)
cd supabase
npx supabase start

# 4. Copy environment variables
cp .env.example .env.local

# 5. Run database migrations
npx supabase db reset

# 6. Generate TypeScript types from database
npx supabase gen types typescript --local > packages/database/src/types/database.types.ts

# 7. Start all zones in development
npm run dev

# This starts:
# - shell:     http://localhost:3000
# - dashboard: http://localhost:3001
# - agency:    http://localhost:3002
# - entities:  http://localhost:3003
# - payments:  http://localhost:3004
# - reports:   http://localhost:3005
```

### Development Workflow

**1. Feature Development:**
```bash
# Create feature branch
git checkout -b feature/payment-plan-wizard

# Work in specific zone
cd apps/payments
npm run dev

# Run tests
npm run test
npm run test:watch

# Lint and format
npm run lint
npm run format
```

**2. Database Changes:**
```bash
# Create migration
npx supabase migration new add_contract_expiration

# Edit migration file in supabase/migrations/

# Apply migration locally
npx supabase db reset

# Test migration
npm run test:integration

# Regenerate types
npx supabase gen types typescript --local > packages/database/src/types/database.types.ts
```

**3. Shared Package Development:**
```bash
# Work on shared UI components
cd packages/ui
npm run dev  # Watch mode

# Import in zone
import { Button } from '@pleeno/ui'
```

## Architecture Decision Records (ADRs)

### ADR-001: Microfrontend Architecture with Multi-Zones

**Status:** Accepted

**Context:**
Pleeno has 8 distinct epics that could be developed by different teams or AI agents. We need to maximize development velocity while maintaining code quality and consistency.

**Decision:**
Use Turborepo monorepo with Next.js Multi-Zones microfrontend architecture, splitting the application into 6 independent zones (shell, dashboard, agency, entities, payments, reports).

**Consequences:**
- ✅ **Pros:** Independent deployments, smaller bundles, team autonomy, faster builds with Turborepo
- ✅ **Pros:** Clear domain boundaries aligned with epics
- ⚠️ **Cons:** Hard navigation between zones (acceptable tradeoff)
- ⚠️ **Cons:** More complex infrastructure (managed by Vercel)

**Alternatives Considered:**
- Single Next.js app with feature folders (rejected: too large, slow builds)
- Module Federation (rejected: more complex than Multi-Zones)

---

### ADR-002: Supabase with PostgreSQL RLS for Multi-Tenancy

**Status:** Accepted

**Context:**
Multi-tenant B2B SaaS requires absolute data isolation between agencies with zero data leakage risk.

**Decision:**
Use Supabase PostgreSQL with Row-Level Security (RLS) policies enforcing tenant isolation at the database layer.

**Consequences:**
- ✅ **Pros:** Database-enforced isolation (impossible to bypass in application code)
- ✅ **Pros:** Automatic filtering via JWT claims (no manual where clauses)
- ✅ **Pros:** Supabase provides auth, storage, edge functions (complete backend)
- ⚠️ **Cons:** RLS adds query overhead (mitigated with proper indexing)
- ⚠️ **Cons:** Vendor lock-in to Supabase/PostgreSQL (acceptable for MVP)

**Alternatives Considered:**
- Separate databases per tenant (rejected: expensive, complex)
- Application-level filtering (rejected: too risky, error-prone)

---

### ADR-003: Domain-Driven Database Schema Organization

**Status:** Accepted

**Context:**
Large database with 15+ tables needs clear organization for maintainability and team collaboration.

**Decision:**
Organize database migrations into domain folders (agency_domain, entities_domain, payments_domain, notifications_domain, audit_domain) aligned with epics.

**Consequences:**
- ✅ **Pros:** Clear domain boundaries
- ✅ **Pros:** Easier to understand and navigate
- ✅ **Pros:** Migrations grouped by feature area
- ✅ **Neutral:** Still a single database (multi-tenancy via RLS)

**Alternatives Considered:**
- Flat migration folder (rejected: hard to navigate)
- Microservices with separate databases (rejected: overkill for MVP)

---

### ADR-004: Zustand + TanStack Query for State Management

**Status:** Accepted

**Context:**
Need lightweight state management for client UI state (filters, dashboard settings) and robust server state management with caching.

**Decision:**
Use Zustand for client state and TanStack Query for server state (API caching, mutations, optimistic updates).

**Consequences:**
- ✅ **Pros:** Zustand is lightweight (5.0KB), easy to learn
- ✅ **Pros:** TanStack Query provides excellent caching and mutation handling
- ✅ **Pros:** Clear separation: client state vs server state
- ⚠️ **Cons:** Two libraries instead of one (acceptable specialization)

**Alternatives Considered:**
- Redux Toolkit (rejected: too much boilerplate for our needs)
- React Context alone (rejected: no caching, performance issues)

---

### ADR-005: Server Components + Client Components Hybrid

**Status:** Accepted

**Context:**
Next.js 15 App Router supports React Server Components for better performance and SEO.

**Decision:**
Use Server Components for initial page loads and data fetching, Client Components for interactivity (forms, tables, charts).

**Consequences:**
- ✅ **Pros:** Faster page loads (less client JavaScript)
- ✅ **Pros:** Direct database access in Server Components (no API routes needed)
- ✅ **Pros:** Better SEO (server-rendered HTML)
- ⚠️ **Cons:** Learning curve (new paradigm)
- ⚠️ **Cons:** Cannot use client hooks (useState, useEffect) in Server Components

**Alternatives Considered:**
- Pure client-side rendering (rejected: slower, worse SEO)
- Pages Router (rejected: Server Components are the future)

---

### ADR-006: pg_cron + Edge Functions for Background Jobs

**Status:** Accepted

**Context:**
Need scheduled jobs for status automation (hourly) and email notifications (daily).

**Decision:**
Use PostgreSQL pg_cron extension for scheduling, calling Supabase Edge Functions for complex logic.

**Consequences:**
- ✅ **Pros:** Built into Supabase (no additional service)
- ✅ **Pros:** Reliable scheduling (PostgreSQL-native)
- ✅ **Pros:** Edge Functions scale independently
- ⚠️ **Cons:** Limited to cron syntax (no complex scheduling)

**Alternatives Considered:**
- Vercel Cron (rejected: limited to 1 job per minute)
- Inngest (rejected: additional service, cost)

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-01-13_
_For: anton_
