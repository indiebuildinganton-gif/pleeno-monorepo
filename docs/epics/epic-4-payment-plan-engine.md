# Epic 4: Payment Plan Engine - Comprehensive Specification

**Author:** Brent / Claude
**Date:** 2025-11-30
**Version:** 2.0 (Expanded with real-world offer letter analysis)
**Status:** Draft - Awaiting Requirements Clarification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Domain Understanding](#domain-understanding)
4. [Real-World Offer Letter Analysis](#real-world-offer-letter-analysis)
5. [Payment Plan Data Model](#payment-plan-data-model)
6. [Commission Calculation Rules](#commission-calculation-rules)
7. [User Stories](#user-stories)
8. [Open Questions](#open-questions)
9. [Technical Implementation Notes](#technical-implementation-notes)
10. [Acceptance Criteria Summary](#acceptance-criteria-summary)

---

## Executive Summary

The Payment Plan Engine is the **core value driver** of Pleeno. It transforms how international study agencies track student payments, calculate commissions, and manage cash flow. This epic covers the creation, management, and tracking of payment plans derived from college offer letters—documents that vary significantly in structure, detail level, and fee breakdown across institutions.

### Why This Epic Matters

- **Revenue Protection**: Agencies lose commissions when payments aren't tracked properly
- **Time Savings**: Manual entry from offer letters takes 15-30 minutes per student; this can be reduced to 2-3 minutes
- **Accuracy**: Commission calculations must correctly exclude non-commissionable fees (materials, admin, enrollment)
- **Flexibility**: Each college structures offer letters differently; the system must accommodate all variations

---

## Problem Statement

### Current State (Spreadsheet Chaos)

International study agencies receive offer letters from colleges in various formats:
- Some provide detailed fee breakdowns (enrollment, materials, tuition separated)
- Some bundle everything into a single "Total Fees" amount
- Payment schedules vary: monthly, quarterly, or completely custom
- Payment dates are irregular (not always the same day each month)

Agency staff must:
1. Manually read each PDF offer letter
2. Extract relevant payment information
3. Calculate commission-eligible amounts (excluding non-commissionable fees)
4. Enter data into spreadsheets
5. Track payment status manually
6. Remember to follow up on overdue payments

### Desired State (Pleeno)

1. Upload offer letter PDF → AI extracts key data (Premium feature)
2. Review extracted data in guided wizard
3. System calculates commission automatically
4. Payment tracking is automated
5. Overdue payments flagged proactively

---

## Domain Understanding

### The Three-Party Financial Relationship

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   STUDENT   │ ──pays──▶│   COLLEGE   │ ──pays──▶│   AGENCY    │
│             │         │             │  commission│             │
│  Pays total │         │  Receives   │         │  Receives   │
│  course fee │         │  tuition    │         │  % of       │
│             │         │             │         │  tuition    │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Key Terminology

| Term | Definition |
|------|------------|
| **Offer Letter** | Official document from college outlining course, fees, and payment schedule |
| **Payment Plan** | Pleeno's record tracking all payments for a student's enrollment |
| **Installment** | Individual payment within a payment plan |
| **Initial Payment/Deposit** | First payment required for enrollment (often includes materials + admin + partial tuition) |
| **Commissionable Value** | Amount on which agency commission is calculated (total - non-commissionable fees) |
| **Materials Fee** | Non-commissionable fee for course materials |
| **Admin/Enrollment Fee** | Non-commissionable fee for administrative processing |
| **GST** | Australian Goods & Services Tax (10%) - affects commission calculation |
| **Student Lead Time** | Days before college due date when student must pay |
| **eCoE** | Electronic Confirmation of Enrollment (issued after deposit received) |

### Payment Flow Timeline

```
Day 0: Student accepts offer, pays deposit
       ↓
Day 1-7: College issues eCoE
       ↓
Course Start: Student begins studying
       ↓
Ongoing: Student pays installments per schedule
       ↓
After each student payment: Agency claims commission from college
       ↓
30-90 days later: College pays commission to agency
```

---

## Real-World Offer Letter Analysis

Based on analysis of actual offer letters, here's what we've learned about the variation in payment plan structures:

### Example 1: Academique (Minimal Detail)

**Characteristics:**
- Provides only total amount and installment schedule
- Fee breakdown NOT provided (unknown what's in the $5,200)
- Simple payment structure: Initial + 6 monthly payments

**Extracted Data:**
| Field | Value |
|-------|-------|
| Course | General English – Elementary to Advanced |
| CRICOS Code | 097218B |
| Duration | 26 study weeks plus holidays |
| Total Tuition | $5,200.00 AUD |
| Start Date | 29/01/2024 |
| End Date | 23/08/2024 |
| Initial Payment | $500.00 |
| Installments | 6 monthly payments of $783.33 |
| Payment Start | 20/02/2024 |
| Payment End | 20/07/2024 |

**Challenge for Pleeno:**
- Cannot automatically calculate commission-eligible amount
- User must manually specify which portion is commissionable
- System should flag as "incomplete fee breakdown"

---

### Example 2: International House (Course Splitting)

**Characteristics:**
- Same course split into multiple enrollment periods
- Holidays built in between course segments
- Fees separated: Enrollment, Online Resources, Tuition
- Payments aligned with course segment starts

**Extracted Data:**
| Field | Value |
|-------|-------|
| Course | GE General English Semi-intensive Evening |
| Campus | IH Sydney City |
| Enrollment Fee | $225.00 |
| Online Resources | $225.00 |
| Tuition Fee | $9,180.00 |
| **Total** | **$9,630.00** |

**Course Segments:**
| Segment | Start | End | Duration | Fee |
|---------|-------|-----|----------|-----|
| 1 | 03/06/2024 | 23/08/2024 | 12 weeks | $3,060.00 |
| 2 | 23/09/2024 | 13/12/2024 | 12 weeks | $3,060.00 |
| 3 | 13/01/2025 | 04/04/2025 | 12 weeks | $3,060.00 |

**Payment Schedule:**
| # | Due Date | Amount | Notes |
|---|----------|--------|-------|
| Initial | Now | $3,510.00 | Enrollment + Resources + First segment |
| 1 | 05/08/2024 | $3,060.00 | Before segment 2 starts |
| 2 | 25/11/2024 | $3,060.00 | Before segment 3 starts |

**Commission Calculation:**
- Commissionable: $9,180.00 (Tuition only)
- Non-commissionable: $450.00 (Enrollment $225 + Resources $225)

---

### Example 3: QIIT - Queensland International Institute of Technology (Paired Payments)

**Characteristics:**
- Detailed fee breakdown with each item dated
- Multiple fees due on the same date (paired)
- Material fee charged mid-course
- Long payment schedule (11 payments)

**Payment Schedule:**
| Date | Items | Amount |
|------|-------|--------|
| 01/12/2023 | Enrollment Fee | $250.00 |
| 01/12/2023 | Payment 01 | $250.00 |
| 12/01/2024 | Material Fee | $850.00 |
| 12/01/2024 | Payment 02 | $665.00 |
| 09/02/2024 | Payment 03 | $665.00 |
| 08/03/2024 | Payment 04 | $665.00 |
| 05/04/2024 | Payment 05 | $665.00 |
| 03/05/2024 | Payment 06 | $665.00 |
| 31/05/2024 | Payment 07 | $665.00 |
| 28/06/2024 | Payment 08 | $665.00 |
| 26/07/2024 | Payment 09 | $665.00 |
| 23/08/2024 | Payment 10 | $665.00 |
| 20/09/2024 | Payment 11 | $665.00 |
| **Total** | | **$8,000.00** |

**Key Observations:**
- Payment dates are NOT the same day each month
- Material fee charged separately mid-course
- Enrollment and first payment same day but separate line items

**Commission Calculation:**
- Total: $8,000.00
- Non-commissionable: Enrollment ($250) + Materials ($850) = $1,100.00
- **Commissionable: $6,900.00**

---

### Example 4: Greenwich College (Discounts & GST)

**Characteristics:**
- Clear fee separation with discount applied
- GST explicitly included in total
- Material fee separate from tuition
- Simple 2-payment structure

**Fee Structure:**
| Item | Amount |
|------|--------|
| General English Evening (Course 1) | $3,380.00 |
| Material Fee | $390.00 |
| General English Evening (Course 2) | $3,120.00 |
| Discount/Scholarship | -$260.00 |
| **Total (includes GST)** | **$6,890.00** |

**Payment Schedule:**
| Due Date | Item | Amount |
|----------|------|--------|
| 19/04/2024 | General English Evening | $3,380.00 |
| Upon acceptance | Material Fee (deposit) | $390.00 |
| 19/07/2024 | General English Evening | $3,120.00 |

**Commission Calculation:**
- Total tuition: $3,380 + $3,120 = $6,500.00
- After discount: $6,500 - $260 = $6,240.00
- Non-commissionable: Materials $390.00
- **Commissionable: $6,240.00** (or $6,500 before discount - needs clarification)

**Open Question:** Does the discount apply to commissionable or total amount?

---

### Example 5: Imagine Education (Most Detailed)

**Characteristics:**
- Clearest fee breakdown of all examples
- Deposit requirements explicitly shown
- Commission-eligible vs non-eligible clearly identifiable
- Multiple course segments with specific dates

**Student Information:**
| Field | Value |
|-------|-------|
| Student Name | Fanny Marlene Quinonez Aponte |
| Student ID | 0003012993 |
| Date of Birth | 27/07/2000 |
| Orientation Date | 16/09/2024 |

**Course Program (3 segments):**
| Course | CRICOS | Start | End | Duration |
|--------|--------|-------|-----|----------|
| General English (Beginners - Advanced) | 056501E | 16/09/2024 | 06/12/2024 | 12 weeks |
| General English (Beginners - Advanced) | 056501E | 06/01/2025 | 28/03/2025 | 12 weeks |
| General English (Beginners - Advanced) | 056501E | 28/04/2025 | 18/07/2025 | 12 weeks |

**Fee Breakdown:**
| Item | Amount | Commissionable? |
|------|--------|-----------------|
| Enrollment Fee | $250.00 | NO |
| Materials Fee ($10 p.w.) | $250.00 | NO |
| GE Night Segment 1 (12 weeks) | $2,750.00 | YES |
| GE Night Segment 2 (12 weeks) | $3,000.00 | YES |
| GE Night Segment 3 (12 weeks) | $3,000.00 | YES |
| **Total** | **$9,250.00** | |

**Deposit Required for eCoE:**
| Due Date | Item | Amount |
|----------|------|--------|
| 16/08/2024 | General English Night | $2,750.00 |
| 16/08/2024 | Enrollment Fee | $250.00 |
| 16/08/2024 | Materials Fee | $250.00 |
| **Total Deposit** | | **$3,250.00** |

**Full Payment Schedule:**
| Due Date | Item | Amount |
|----------|------|--------|
| 16/08/2024 | Enrollment Fee | $250.00 |
| 16/08/2024 | General English Night | $2,750.00 |
| 16/08/2024 | Materials Fee | $250.00 |
| 06/12/2024 | General English Night | $3,000.00 |
| 28/03/2025 | General English Night | $3,000.00 |

**Commission Calculation:**
- Total: $9,250.00
- Non-commissionable: Enrollment ($250) + Materials ($250) = $500.00
- **Commissionable: $8,750.00**
- At 30% commission rate: Agency earns **$2,625.00**

**Key Insight:** Only $2,750 of the $3,250 deposit is commission-eligible!

---

## Payment Plan Data Model

### Understanding the Structure

Based on the offer letter analysis, here's the comprehensive data model:

```
Payment Plan
├── General Information
│   ├── Student (FK)
│   ├── College/Branch (via student enrollment)
│   ├── Course Name
│   ├── CRICOS Code (optional)
│   ├── Course Start Date
│   ├── Course End Date
│   ├── Duration (weeks)
│   └── Reference Number (offer letter #)
│
├── Financial Details
│   ├── Total Course Value
│   ├── Non-Commissionable Fees
│   │   ├── Materials Cost
│   │   ├── Admin/Enrollment Fee
│   │   └── Other Fees
│   ├── Discount/Scholarship Amount
│   ├── Commissionable Value (calculated)
│   ├── Commission Rate (%)
│   ├── Expected Commission (calculated)
│   └── GST Settings
│       ├── GST Inclusive? (boolean)
│       └── GST Rate (default 10%)
│
├── Payment Configuration
│   ├── Initial Payment Amount
│   ├── Initial Payment Due Date
│   ├── Initial Payment Paid? (boolean)
│   ├── Number of Installments
│   ├── Payment Frequency (monthly/quarterly/custom)
│   ├── First Installment College Due Date
│   ├── Student Lead Time (days)
│   └── Fee Breakdown Known? (boolean flag)
│
└── Installments[]
    ├── Installment Number (0 = initial)
    ├── Description/Label
    ├── Amount
    ├── Student Due Date
    ├── College Due Date
    ├── Is Initial Payment? (boolean)
    ├── Generates Commission? (boolean)
    ├── Status (draft/pending/due_soon/overdue/paid/completed)
    ├── Paid Date
    ├── Paid Amount
    └── Notes
```

### Handling Variations

| Scenario | How Pleeno Handles It |
|----------|----------------------|
| **Minimal detail (Academique)** | Flag as "incomplete breakdown", user manually enters commissionable amount |
| **Course splitting (IH)** | Support multiple course segments within single payment plan |
| **Paired payments (QIIT)** | Allow multiple installments with same due date |
| **Discounts (Greenwich)** | Separate discount field, user specifies if applies to commission base |
| **Detailed breakdown (Imagine)** | Full automatic calculation with clear commission tracking |

---

## Commission Calculation Rules

### Standard Formula

```
Commissionable Value = Total Course Value
                     - Materials Cost
                     - Admin/Enrollment Fee
                     - Other Non-Commissionable Fees
                     ± Discount (depending on application)

Expected Commission = Commissionable Value × Commission Rate (%)

Earned Commission = (Paid Amount / Total Amount) × Expected Commission
```

### GST Handling

| GST Setting | Calculation |
|-------------|-------------|
| GST Inclusive | Commission calculated on amount INCLUDING GST |
| GST Exclusive | Commission calculated on amount EXCLUDING GST |
| No GST | Commission calculated on full amount |

### Example Calculation (Imagine Education)

```
Total Course Value:     $9,250.00
- Enrollment Fee:       -$250.00
- Materials Fee:        -$250.00
= Commissionable Value: $8,750.00

Commission Rate:        30%
Expected Commission:    $8,750 × 0.30 = $2,625.00

After first payment ($3,250):
- Commissionable portion: $2,750 (tuition only)
- Earned Commission: ($2,750 / $8,750) × $2,625 = $825.00
```

---

## User Stories

### Story 4.1: Payment Plan Creation Wizard - Step 1: General Information

As an **Agency User**,
I want **to enter basic payment plan details in a guided wizard**,
So that **I can accurately track a student's course enrollment and fees**.

**Acceptance Criteria:**

**Given** I am creating a new payment plan
**When** I am on Step 1: General Information
**Then** I can:

- [ ] Select a student from dropdown (pre-populated with agency's students)
- [ ] See college/branch auto-populated from student's enrollment
- [ ] Enter or select course name
- [ ] Enter optional CRICOS code
- [ ] Enter total course value
- [ ] Enter commission rate (0-100% or 0-1 decimal with helper text)
- [ ] Select course start date
- [ ] Select course end date
- [ ] Enter optional reference number (offer letter #)
- [ ] See validation errors for required fields
- [ ] Proceed to Step 2 when valid

**Prerequisites:** Story 3.3 (Student-College Enrollment)

---

### Story 4.2: Payment Plan Creation Wizard - Step 2: Fee Breakdown

As an **Agency User**,
I want **to specify which fees are commissionable vs non-commissionable**,
So that **commission calculations are accurate**.

**Acceptance Criteria:**

**Given** I am on Step 2: Fee Breakdown
**When** I configure the fee structure
**Then** I can:

- [ ] Toggle "Fee breakdown known?" (Yes/No)
- [ ] If YES, enter individual non-commissionable fees:
  - Materials Cost
  - Admin/Enrollment Fee
  - Other Fees (with description field)
- [ ] If NO, manually enter the commissionable amount directly
- [ ] Enter optional discount/scholarship amount
- [ ] Specify if discount applies to: "Total fees" or "Commissionable only"
- [ ] Toggle "GST Inclusive" (Yes/No)
- [ ] See real-time calculation of:
  - Total Non-Commissionable Fees
  - Commissionable Value
  - Expected Commission (in green)
- [ ] See warning if calculations don't reconcile
- [ ] Proceed to Step 3 when valid

**Business Rule:** Sum of (Commissionable + Non-Commissionable ± Discount) must equal Total Course Value

---

### Story 4.3: Payment Plan Creation Wizard - Step 3: Payment Structure

As an **Agency User**,
I want **to define the payment schedule with flexible options**,
So that **I can accommodate any college's payment structure**.

**Acceptance Criteria:**

**Given** I am on Step 3: Payment Structure
**When** I configure payments
**Then** I can:

**Initial Payment:**
- [ ] Enter initial payment amount
- [ ] Enter initial payment due date
- [ ] Toggle "Initial payment already paid?" (Yes/No)
- [ ] See breakdown of what's included in initial payment

**Installment Configuration:**
- [ ] Enter number of installments (excluding initial)
- [ ] Select frequency: Monthly, Quarterly, or Custom
- [ ] For Monthly/Quarterly: system auto-generates dates
- [ ] Enter first installment college due date
- [ ] Enter student lead time in days
- [ ] See auto-calculated student due dates

**Real-time Summary:**
- [ ] Total amount across all payments
- [ ] Validation: total must equal Total Course Value
- [ ] Per-installment commission breakdown

---

### Story 4.4: Payment Plan Creation Wizard - Step 4: Installment Schedule Review

As an **Agency User**,
I want **to review and customize individual installments before saving**,
So that **I can match exactly what the offer letter specifies**.

**Acceptance Criteria:**

**Given** I am on Step 4: Review & Confirmation
**When** I review the installment schedule
**Then** I can:

**Installment Table:**
- [ ] See all installments in table format:
  - Row 0: Initial Payment (highlighted)
  - Rows 1-N: Regular installments
- [ ] Columns: #, Description, Amount, Student Due, College Due, Commission?, Status
- [ ] Edit any individual installment inline:
  - Change amount
  - Change due date
  - Add/edit description
  - Toggle "generates commission" flag
- [ ] Add new installment row (for irregular schedules like QIIT)
- [ ] Delete installment row
- [ ] Reorder installments

**Summary Section:**
- [ ] Selected Student name
- [ ] College/Branch
- [ ] Course name and dates
- [ ] Total Value
- [ ] Non-Commissionable Fees
- [ ] **Commissionable Value** (highlighted)
- [ ] **Expected Commission** (green, prominent)
- [ ] GST status

**Validation:**
- [ ] Sum of all installments = Total Course Value
- [ ] No future dates in the past (warning only)
- [ ] At least one payment exists

**Actions:**
- [ ] "Back" to edit previous steps
- [ ] "Save as Draft" (doesn't activate tracking)
- [ ] "Save & Activate" (starts automated tracking)

---

### Story 4.5: Handling Irregular Payment Dates

As an **Agency User**,
I want **to create payment plans with non-standard due dates**,
So that **I can accurately track colleges like QIIT that have irregular schedules**.

**Acceptance Criteria:**

**Given** I am creating a payment plan with custom dates
**When** the college has irregular payment dates (e.g., 10th, 8th, 11th of different months)
**Then** I can:

- [ ] Select "Custom" frequency to disable auto-generation
- [ ] Manually enter each installment's due date
- [ ] Have multiple installments on the same due date (paired payments)
- [ ] See a calendar view option showing payment dates
- [ ] Import dates from CSV if many installments

**Example Use Case (QIIT):**
```
Date        | Items on this date
01/12/2023  | Enrollment Fee ($250), Payment 01 ($250)
12/01/2024  | Material Fee ($850), Payment 02 ($665)
09/02/2024  | Payment 03 ($665)
... etc
```

---

### Story 4.6: Payment Plan with Course Segments

As an **Agency User**,
I want **to track payment plans for courses split into multiple segments**,
So that **I can handle colleges like International House that structure courses this way**.

**Acceptance Criteria:**

**Given** a student is enrolled in a course with multiple segments
**When** I create the payment plan
**Then** I can:

- [ ] Add course segment details:
  - Segment name/number
  - Segment start date
  - Segment end date
  - Segment fee amount
- [ ] Link installments to specific segments
- [ ] See visual representation of course timeline
- [ ] Track which segments are paid vs pending

**Alternative Approach:**
- [ ] Create separate payment plans for each segment
- [ ] Link plans together as "related plans"
- [ ] See consolidated view across related plans

---

### Story 4.7: Discount and Scholarship Handling

As an **Agency User**,
I want **to properly record discounts and scholarships**,
So that **commission calculations reflect the actual amounts paid**.

**Acceptance Criteria:**

**Given** a payment plan includes a discount
**When** I enter discount details
**Then** I can:

- [ ] Enter discount amount (positive number)
- [ ] Enter discount description/reason
- [ ] Specify discount type:
  - "Reduces total fees" (affects what student pays)
  - "Reduces commission base" (affects agency commission)
  - "Applied to specific fee" (e.g., only tuition)
- [ ] See adjusted totals reflecting discount
- [ ] Generate reports showing discounts applied

**Business Logic:**
- If discount "Reduces total fees": Student pays less, commission based on full pre-discount amount
- If discount "Reduces commission base": Commission calculated on post-discount amount
- This must be configurable per payment plan based on college policy

---

### Story 4.8: Payment Plan List and Search

As an **Agency User**,
I want **to find and filter payment plans quickly**,
So that **I can answer student/college queries in under 30 seconds**.

**Acceptance Criteria:**

**Given** I am on the Payment Plans page
**When** I search and filter
**Then** I can:

**Filters (combinable):**
- [ ] Status: Active, Completed, Cancelled, Draft
- [ ] Student name (autocomplete)
- [ ] College (dropdown)
- [ ] Branch (dropdown, filtered by college)
- [ ] Total amount range (min/max)
- [ ] Number of installments (range)
- [ ] Due date range (next payment due)
- [ ] Overdue only (toggle)
- [ ] Created date range

**Search:**
- [ ] Global text search across: student name, course name, reference number

**Display:**
- [ ] List view with columns: Student, College, Course, Total, Next Due, Status, Actions
- [ ] Quick status badges (color-coded)
- [ ] Sort by any column
- [ ] Pagination (25, 50, 100 per page)
- [ ] "Clear all filters" button

**Quick Actions:**
- [ ] Record payment
- [ ] View details
- [ ] Export to PDF

---

### Story 4.9: AI-Powered Offer Letter Extraction (Premium)

As an **Agency User on Premium tier**,
I want **to upload offer letter PDFs and have data extracted automatically**,
So that **I can create payment plans in minutes instead of 15-30 minutes**.

**Acceptance Criteria:**

**Given** I am on Premium or Enterprise subscription tier
**When** I upload an offer letter PDF
**Then** the system:

**Extraction:**
- [ ] Accepts PDF files up to 10MB
- [ ] Processes using AI (GPT-4 Vision / Claude / Document AI)
- [ ] Extracts with confidence scores:
  - Student name, DOB, passport number
  - College name, campus/branch
  - Course name, CRICOS code
  - Start date, end date, duration
  - Total fees, fee breakdown
  - Payment schedule (dates and amounts)
- [ ] Completes extraction in <30 seconds

**Matching:**
- [ ] Fuzzy matches college name to existing colleges
- [ ] Suggests existing student if passport number matches
- [ ] Highlights low-confidence fields for review

**Review Wizard:**
- [ ] Pre-populates creation wizard with extracted data
- [ ] Marks fields with confidence indicators (green/yellow/red)
- [ ] Allows user to correct any field before saving
- [ ] Stores original PDF attached to payment plan

**Edge Cases:**
- [ ] Handles minimal-detail offer letters (like Academique)
- [ ] Flags "incomplete fee breakdown" for manual entry
- [ ] Supports multi-page documents
- [ ] Graceful fallback to manual entry on extraction failure

**Feature Gating:**
- [ ] Basic tier: Feature disabled, shows upgrade prompt
- [ ] Premium tier: Full access
- [ ] Enterprise tier: Full access + batch processing

---

### Story 4.10: Manual Payment Recording

As an **Agency User**,
I want **to record when students make payments**,
So that **payment status stays accurate and commissions are tracked**.

**Acceptance Criteria:**

**Given** I am viewing a payment plan with pending installments
**When** I record a payment
**Then** I can:

- [ ] Select installment(s) being paid
- [ ] Enter payment date
- [ ] Enter payment amount
- [ ] Handle partial payments (amount < installment amount)
- [ ] Handle overpayments (amount > installment amount)
- [ ] Select payment method (optional): Bank Transfer, Card, Cash, Other
- [ ] Enter reference number (optional)
- [ ] Add payment notes
- [ ] See updated status after saving

**Status Transitions:**
- Installment: pending/due_soon/overdue → paid
- Payment Plan: If all installments paid → completed

**Audit:**
- [ ] Payment recording creates audit log entry
- [ ] Shows who recorded payment and when

---

### Story 4.11: Commission Tracking per Payment

As an **Agency Admin**,
I want **to track earned commission as payments are received**,
So that **I know exactly how much to claim from each college**.

**Acceptance Criteria:**

**Given** payments are being recorded
**When** I view commission information
**Then** I can see:

**Per Payment Plan:**
- [ ] Expected commission (total)
- [ ] Earned commission (from paid installments)
- [ ] Pending commission (from unpaid installments)
- [ ] Commission per installment breakdown

**Per College:**
- [ ] Total expected commission
- [ ] Total earned commission
- [ ] Total pending commission
- [ ] Breakdown by student

**Calculation Logic:**
```
For each installment where generates_commission = true:
  If status = 'paid':
    earned_commission += (paid_amount / installment_amount) × installment_commission_share
```

**Commission Claim Status:**
- [ ] Track whether agency has claimed commission from college
- [ ] Record claim date and amount
- [ ] Mark installment as "completed" when agency receives commission

---

## Open Questions

### Critical Questions (Block Implementation)

These questions must be answered before development can proceed:

#### Q1: AI Extraction Accuracy for Minimal-Detail Offer Letters

**Context:** Some colleges (like Academique) don't provide fee breakdowns in their offer letters. The AI might not be able to distinguish commissionable from non-commissionable amounts.

**Question:** What should the system do when fee breakdown is not available?

**Options:**
- A) Flag as "incomplete data" and require manual entry of commissionable amount
- B) Assume entire amount is commissionable (risky, may overstate commission)
- C) Use college-level default split (e.g., "80% tuition, 20% fees")
- D) Prompt user to upload additional documentation

**Recommendation:** Option A - Flag for manual entry to ensure accuracy

---

#### Q2: Multiple Courses per Student - Single or Multiple Payment Plans?

**Context:** Students at International House are enrolled in what appears to be one course split into 3 segments with holidays between them. Other students may genuinely take multiple different courses at the same or different colleges.

**Question:** How should multiple courses be handled?

**Options:**
- A) One payment plan with multiple course segments (complex but unified view)
- B) Separate payment plans, linked together as "related"
- C) Separate payment plans, completely independent
- D) User chooses case-by-case

**Recommendation:** Option D - Let user decide based on how the college structures it

---

#### Q3: Variable Payment Dates - Generation Approach

**Context:** QIIT example shows payments on 10th, 8th, 11th, 9th, 5th, 3rd, 31st, 28th, 26th, 23rd, 20th of consecutive months - clearly not a fixed pattern.

**Question:** For "Custom" frequency, how should the system help users?

**Options:**
- A) Fully manual entry for each date (current plan)
- B) Generate dates, allow bulk adjustment
- C) Pattern detection (e.g., "last Friday of month")
- D) CSV import for dates
- E) All of the above

**Recommendation:** Option E - Provide multiple input methods for flexibility

---

#### Q4: Paired Payments on Same Due Date

**Context:** QIIT shows Enrollment Fee and Payment 01 both due on 01/12/2023. Greenwich shows multiple items due 16/08/2024.

**Question:** How should same-date payments be represented?

**Options:**
- A) Multiple installment rows with same date (transparent, matches offer letter)
- B) Single combined installment with line-item breakdown (simpler list view)
- C) User chooses how to structure

**Recommendation:** Option A - Multiple rows for transparency and easier tracking

---

#### Q5: Discount Application to Commission Base

**Context:** Greenwich shows a $260 discount. It's unclear if this discount reduces the commission base or just the student's payment.

**Question:** How should discounts affect commission calculations?

**Options:**
- A) Always reduce commission base (conservative for agency)
- B) Never reduce commission base (favorable for agency)
- C) Configurable per payment plan
- D) Configurable per college (default setting)

**Recommendation:** Option C - Configurable per payment plan (each case varies)

---

### Important Questions (Inform Design Decisions)

#### Q6: Commission Claim Workflow

**Question:** Should Pleeno track the full commission claim lifecycle?

**Proposed Workflow:**
1. Student pays → Installment marked "Paid"
2. Agency claims commission → Installment marked "Claimed"
3. College pays commission → Installment marked "Completed"

**Related Questions:**
- Should the system generate commission claim documents?
- Should there be a "Commission Claims" section separate from payment plans?

---

#### Q7: GST Handling Variations

**Context:** Different colleges handle GST differently. Greenwich explicitly includes GST, others don't mention it.

**Question:** How granular should GST tracking be?

**Options:**
- A) Simple toggle: GST Inclusive Yes/No
- B) GST amount field: Enter actual GST amount
- C) GST rate field: System calculates (default 10%)
- D) Per-installment GST tracking

**Recommendation:** Start with Option A, expand if needed

---

#### Q8: Offer Letter Document Storage

**Question:** Should every payment plan have the source offer letter attached?

**Options:**
- A) Required attachment
- B) Optional but encouraged
- C) Optional, no prompting
- D) Separate document management system

**Recommendation:** Option B - Optional but show prominent upload prompt

---

### Nice-to-Have Questions (Future Considerations)

#### Q9: Bulk Payment Plan Creation

**Question:** Should agencies be able to create multiple payment plans at once from a batch of offer letters?

**Use Case:** Agency receives 20 offer letters for new semester, wants to process all at once.

---

#### Q10: Payment Plan Templates

**Question:** Should agencies be able to create templates for common college payment structures?

**Use Case:** Agency works with 5 main colleges, each has consistent payment structure. Template could pre-fill standard values.

---

#### Q11: Student Self-Service

**Question:** In future phases, should students be able to view their own payment plans?

**Use Case:** Student logs into portal, sees upcoming payments, downloads payment receipts.

---

## Technical Implementation Notes

### Database Schema Extensions

```sql
-- Extend payment_plans table
ALTER TABLE payment_plans ADD COLUMN fee_breakdown_known BOOLEAN DEFAULT true;
ALTER TABLE payment_plans ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE payment_plans ADD COLUMN discount_type VARCHAR(50); -- 'total_fees', 'commission_base', 'specific_fee'
ALTER TABLE payment_plans ADD COLUMN discount_description TEXT;
ALTER TABLE payment_plans ADD COLUMN offer_letter_url TEXT;
ALTER TABLE payment_plans ADD COLUMN offer_letter_filename VARCHAR(255);
ALTER TABLE payment_plans ADD COLUMN cricos_code VARCHAR(20);
ALTER TABLE payment_plans ADD COLUMN duration_weeks INTEGER;

-- Course segments (for split courses like IH)
CREATE TABLE payment_plan_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_plan_id UUID REFERENCES payment_plans(id),
    agency_id UUID REFERENCES agencies(id),
    segment_number INTEGER NOT NULL,
    segment_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    fee_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend installments table
ALTER TABLE installments ADD COLUMN description TEXT;
ALTER TABLE installments ADD COLUMN segment_id UUID REFERENCES payment_plan_segments(id);
ALTER TABLE installments ADD COLUMN commission_claim_date DATE;
ALTER TABLE installments ADD COLUMN commission_received_date DATE;

-- AI extraction logs (for Premium feature)
CREATE TABLE offer_letter_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id),
    user_id UUID REFERENCES users(id),
    payment_plan_id UUID REFERENCES payment_plans(id),
    original_filename VARCHAR(255),
    file_url TEXT,
    extracted_data JSONB,
    confidence_scores JSONB,
    extraction_status VARCHAR(50), -- 'success', 'partial', 'failed'
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

```
POST   /api/payment-plans                    # Create payment plan (full wizard data)
GET    /api/payment-plans                    # List with filters
GET    /api/payment-plans/:id                # Get details
PATCH  /api/payment-plans/:id                # Update plan
DELETE /api/payment-plans/:id                # Soft delete

POST   /api/payment-plans/:id/installments   # Add installment
PATCH  /api/installments/:id                 # Update installment
DELETE /api/installments/:id                 # Remove installment

POST   /api/installments/:id/record-payment  # Record payment
POST   /api/installments/:id/claim-commission # Mark commission claimed
POST   /api/installments/:id/complete        # Mark commission received

POST   /api/offer-letters/extract            # AI extraction (Premium)
GET    /api/offer-letters/extractions        # List past extractions

GET    /api/reports/commissions              # Commission report by college
GET    /api/reports/payment-plans            # Payment plans report
```

### UI Components

```
/payment-plans                       # List page with filters
/payment-plans/new                   # Creation wizard
/payment-plans/new/from-offer-letter # AI extraction flow (Premium)
/payment-plans/:id                   # Detail view
/payment-plans/:id/edit              # Edit mode
/payment-plans/:id/record-payment    # Payment recording modal/page
```

---

## Acceptance Criteria Summary

### MVP Must-Have

- [ ] Create payment plan with basic fields
- [ ] Specify non-commissionable fees
- [ ] Calculate commission automatically
- [ ] Generate installment schedule (auto or custom)
- [ ] Handle irregular payment dates
- [ ] Handle multiple installments on same date
- [ ] Record payments manually
- [ ] Track earned vs pending commission
- [ ] List/search/filter payment plans
- [ ] View payment plan details

### MVP Should-Have

- [ ] Course segment tracking
- [ ] Discount/scholarship handling
- [ ] Offer letter attachment
- [ ] Commission claim tracking workflow
- [ ] Export payment plan to PDF

### Post-MVP (Premium/Future)

- [ ] AI offer letter extraction
- [ ] Batch payment plan creation
- [ ] Payment plan templates
- [ ] Student self-service portal
- [ ] Automated commission claim generation

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Anton | Initial epic in epics.md |
| 2.0 | 2025-11-30 | Brent/Claude | Expanded with real-world offer letter analysis, detailed data model, comprehensive stories, open questions |

---

_This document serves as the comprehensive specification for Epic 4: Payment Plan Engine. All user stories should be validated against the real-world examples analyzed above to ensure the implementation handles all documented variations._
