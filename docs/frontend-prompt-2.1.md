# Frontend Implementation Prompt: Story 2.1

**Generated:** 2025-11-12
**Epic:** Epic 2: Agency & User Management
**Story:** Story 2.1: Agency Profile Setup
**Author:** anton

---

## Context

### Story Overview

**As an** Agency Admin,
**I want** to configure my agency's profile with basic information,
**So that** my agency identity is established in the system and my team knows which agency they're working in.

### Epic Goal

Enable agency self-service setup, team collaboration through user management, and role-based access control that forms the identity and access foundation for the platform.

### PRD Context

Pleeno is an intelligent financial command center for international study agencies—transforming how they manage student payments, commission tracking, and cash flow. The Agency Profile Setup is the foundational identity establishment that affects how the entire platform behaves for that agency. This is part of the MVP's Data Centralization Foundation, which establishes multi-agency registry with complete data isolation.

**Key Product Principles:**
- Transform agencies from chaos to clarity and control
- Deliver value in seconds, not hours
- Modern SaaS patterns (auto-save, smart defaults, progressive disclosure)
- Conversational tone, not government forms

---

## User Persona & Journey

### User Persona

**Name:** Sarah Chen
**Role:** Agency Admin (Owner/Manager of international study agency)
**Context:** Just completed signup/authentication, eager to start tracking payments
**Technical Skill:** Moderate - comfortable with web apps, not a developer
**Goals:**
- Get set up quickly and start using the system
- Establish agency identity
- Avoid lengthy setup processes
**Pain Points:**
- Frustrated by complex enterprise software onboarding
- Wants to see value quickly, not fill endless forms
- Doesn't know what fields matter yet

### User Journey: Before State

Sarah has just completed authentication (Story 1.3). She's logged into Pleeno for the first time and sees a prompt to set up her agency profile. She's motivated to start tracking her 50+ students and their payment plans, but needs to establish her agency's basic configuration first.

**Starting Point:** Post-authentication, redirected to agency setup
**Prerequisites Met:** User account created, authenticated
**Context Available:** User's email, name from signup

### User Journey: During State (Step-by-Step)

**Step 1: Welcome (2 seconds)**
- Sarah sees a clean welcome screen: "Welcome to Pleeno! Let's set up Sarah's agency"
- Single card/modal appears, not a full intimidating page
- She feels this will be quick

**Step 2: Agency Name (10 seconds)**
- She sees the question: "What should we call your agency?"
- Starts typing "Study Connect Australia"
- **Live feedback:** As she types, she sees a mini preview showing how "Study Connect Australia" appears in the app header
- **Validation:** Green checkmark appears - "That name is available ✓"
- She feels confident and in control

**Step 3: Timezone Confirmation (5 seconds)**
- She notices timezone is already set to "Australia/Sydney"
- Helpful text explains: "Payment due times use 5pm in this timezone"
- She thinks: "Smart, it detected my timezone!" and leaves it as-is

**Step 4: Currency Selection (5 seconds)**
- Default currency shows "AUD" (pre-selected based on timezone)
- Help text: "You can override this for individual payment plans"
- She thinks: "Perfect, that's what I need" and leaves it

**Step 5: Optional Details (skips or 10 seconds)**
- She sees a collapsible section: "Customize contact preferences"
- Decides to expand it
- Email is pre-filled with her signup email
- She adds her phone number for notifications
- Checks box: "Send me weekly payment summaries"

**Step 6: Completion (instant)**
- No explicit "Save" button needed - fields auto-save on blur
- She clicks "Continue →"
- Success message appears: "✓ Agency profile complete!"
- Next action prompts: "Add your first student →" or "Set up colleges →"

**Total Time:** 30-40 seconds

### User Journey: After State (Success)

- Sarah's agency name "Study Connect Australia" now appears in the application header
- All timestamps throughout the app will display in Australia/Sydney timezone
- Default currency for new payment plans is set to AUD
- She can immediately start adding students, colleges, and payment plans
- She sees her agency settings are accessible anytime via Settings > Agency
- She feels confident the system knows who she is and how she operates

**System State Changes:**
- `agencies` table updated with name, timezone, currency
- User's session now includes agency context
- RLS (Row-Level Security) policies activated for her agency_id
- Ready for multi-user collaboration (future team members will see same agency identity)

### Edge Cases & Error Scenarios

**Edge Case 1: Invalid Agency Name**
- User enters special characters or very long name
- **Handling:** Inline validation shows: "Please use letters, numbers, and spaces only (2-100 characters)"
- **Recovery:** User corrects immediately with live feedback

**Edge Case 2: Timezone Detection Fails**
- Browser doesn't provide timezone
- **Handling:** Default to UTC with prominent dropdown to select manually
- **User sees:** "We couldn't detect your timezone. Please select:"

**Edge Case 3: User Wants to Skip**
- Power user wants to explore first, configure later
- **Handling:** "Skip for now" link uses smart defaults (UTC, USD, agency name = "My Agency")
- **User can:** Return to Settings > Agency anytime to complete

**Edge Case 4: Network Error During Save**
- Save request fails due to connectivity
- **Handling:**
  - Error toast: "Couldn't save settings. Check your connection and try again."
  - Form data persists (not lost)
  - Retry button appears

**Edge Case 5: User Changes Mind Mid-Setup**
- User wants to go back or change something
- **Handling:** All fields remain editable, can change any field before clicking Continue
- No locked-in state

**Edge Case 6: Duplicate Agency Name (Future Multi-Tenancy)**
- Though unlikely in MVP, another agency has same name
- **Handling:** Names are not globally unique (each agency isolated by ID)
- No conflict possible in MVP scope

**Edge Case 7: Browser Auto-Fill Conflicts**
- Browser tries to auto-fill phone as credit card
- **Handling:** Proper input types (`type="tel"`) and autocomplete attributes prevent this

---

## UI Component Specifications

### Screens/Pages

**Page: `/setup/agency` or modal overlay on dashboard**

**Layout:**
- Centered card/modal (max-width: 600px)
- Clean white background
- Pleeno logo at top
- Progress indicator (optional): "Step 1 of 2" if onboarding continues

**Visual Design:**
- Modern, friendly SaaS aesthetic (think Linear, Notion)
- Plenty of white space
- Conversational typography
- Subtle shadows and rounded corners
- Primary color: Teal/blue (professional but friendly)

**Sections:**
1. **Header:** Welcome message with user's name
2. **Main Form:** 3-4 fields with smart defaults
3. **Optional Section:** Collapsible contact preferences
4. **Footer:** Continue button + Skip link

### Input Fields & Form Elements

**1. Agency Name Field**
- **Type:** Text input
- **Label:** "What should we call your agency?" (conversational, not "Agency Name*")
- **Placeholder:** "e.g., Study Abroad Experts"
- **Required:** Yes
- **Default Value:** Empty
- **Validation Rules:**
  - Min length: 2 characters
  - Max length: 100 characters
  - Pattern: Alphanumeric + spaces (no special chars)
  - Real-time validation on input
- **Error Messages:**
  - Empty: "Please enter an agency name"
  - Too short: "Agency name must be at least 2 characters"
  - Too long: "Agency name must be 100 characters or less"
  - Invalid chars: "Please use letters, numbers, and spaces only"
- **Success Feedback:** Green checkmark icon + "That name is available ✓"
- **Help Text:** None (self-explanatory)

**2. Timezone Field**
- **Type:** Searchable dropdown (select with search/filter)
- **Label:** "Your timezone"
- **Default Value:** Auto-detected from browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
- **Required:** Yes (but defaulted)
- **Options:** Standard IANA timezone list
  - Australia/Sydney
  - Australia/Melbourne
  - America/New_York
  - America/Los_Angeles
  - Europe/London
  - Asia/Singapore
  - etc.
- **Validation Rules:** Must be valid timezone from list
- **Help Text:** "Payment due times use 5pm in this timezone"
- **Search:** User can type to filter (e.g., "sydney" shows Australia/Sydney)

**3. Default Currency Field**
- **Type:** Dropdown select
- **Label:** "Default currency"
- **Default Value:** Smart default based on timezone:
  - Australia/* → AUD
  - America/* → USD
  - Europe/* → EUR
  - UK/* → GBP
  - New Zealand → NZD
  - Fallback → USD
- **Required:** Yes (but defaulted)
- **Options:**
  - AUD - Australian Dollar
  - USD - US Dollar
  - GBP - British Pound
  - EUR - Euro
  - CAD - Canadian Dollar
  - NZD - New Zealand Dollar
- **Validation Rules:** Must be from list
- **Help Text:** "You can override this for individual payment plans"

**4. Contact Email Field (Optional Section)**
- **Type:** Email input
- **Label:** "Contact email"
- **Default Value:** Pre-filled from user signup email
- **Required:** No (pre-filled, editable)
- **Validation Rules:**
  - Standard email format (RFC 5322)
  - Real-time validation
- **Error Messages:** "Please enter a valid email address"
- **Help Text:** "For notifications and support"

**5. Contact Phone Field (Optional Section)**
- **Type:** Tel input
- **Label:** "Phone (optional)"
- **Placeholder:** "+61 4XX XXX XXX"
- **Default Value:** Empty
- **Required:** No
- **Validation Rules:**
  - Loose validation for MVP (any reasonable phone format)
  - International format accepted
- **Error Messages:** "Please enter a valid phone number"
- **Help Text:** None

**6. Notification Preference Checkbox (Optional Section)**
- **Type:** Checkbox
- **Label:** "Send me weekly payment summaries"
- **Default Value:** Unchecked
- **Required:** No

### Display Components

**1. Live Preview Card**
- **Purpose:** Show how agency name appears in app
- **Location:** Right side or below agency name field
- **Content:** Mini mockup of app header with agency name
- **Behavior:** Updates in real-time as user types
- **Visual:** Subtle border, light background, small mock interface

**2. Welcome Header**
- **Content:** "Welcome to Pleeno! Let's set up [User First Name]'s agency"
- **Typography:** Large, friendly heading (24-28px)
- **Icon:** Optional Pleeno logo or celebration icon

**3. Success Message**
- **Trigger:** After Continue button clicked and save succeeds
- **Content:** "✓ Agency profile complete!"
- **Visual:** Green checkmark, success color
- **Duration:** Show for 1 second, then auto-navigate

**4. Help Text Elements**
- **Timezone help:** "Payment due times use 5pm in this timezone"
- **Currency help:** "You can override this for individual payment plans"
- **Email help:** "For notifications and support"
- **Visual:** Small, gray text below field

### Interactive Components

**1. "Customize contact preferences" Toggle/Expander**
- **Type:** Collapsible section trigger
- **Label:** "Customize contact preferences" with chevron icon
- **Default State:** Collapsed
- **On Click:**
  - Expand to reveal email, phone, notification checkbox
  - Chevron rotates down
  - Smooth animation (200ms)
- **Visual:** Link-style or subtle button

**2. Continue Button**
- **Type:** Primary action button
- **Label:** "Continue →"
- **Position:** Bottom right of form
- **Enabled When:** Agency name is valid (required field met)
- **Disabled When:** Agency name empty or invalid
- **On Click:**
  1. Validate all fields
  2. Show loading spinner on button (replace arrow with spinner)
  3. Send PATCH request to `/api/agencies/[id]`
  4. On success: Show success message, navigate to next step
  5. On error: Show error toast, re-enable button
- **Visual States:**
  - Default: Teal/blue background, white text, subtle shadow
  - Hover: Slightly darker background
  - Disabled: Gray background, gray text, no pointer
  - Loading: Spinner icon, "Saving..." text

**3. "Skip for now" Link**
- **Type:** Secondary action link
- **Label:** "Skip for now"
- **Position:** Bottom left, opposite Continue button
- **On Click:**
  - Use smart defaults (current timezone, USD currency, agency name = user's name + "'s Agency")
  - Save defaults
  - Navigate to dashboard/next step
- **Visual:** Gray text link, underline on hover

**4. Field Auto-Save (Invisible Interaction)**
- **Behavior:** Each field saves on blur (when user leaves field)
- **Feedback:** No explicit UI (seamless background save)
- **Purpose:** Prevent data loss, modern pattern
- **Fallback:** If auto-save fails silently, explicit Continue save catches everything

### Component States

**Form States:**

1. **Initial/Empty State**
   - Agency name field: Empty, cursor blinking
   - Timezone: Pre-filled with detected timezone
   - Currency: Pre-filled with smart default
   - Email: Pre-filled from signup
   - Phone: Empty
   - Continue button: Disabled (agency name required)

2. **Typing State (Agency Name)**
   - Border changes to blue (focus state)
   - Live preview updates with each keystroke
   - Validation runs on debounce (300ms after typing stops)

3. **Valid State**
   - Green checkmark icon appears next to field
   - Border changes to green
   - Success message: "That name is available ✓"
   - Continue button: Enabled

4. **Invalid/Error State**
   - Red border on field
   - Error icon (X or warning)
   - Error message in red text below field
   - Continue button: Disabled

5. **Loading State**
   - Continue button shows spinner + "Saving..."
   - All form fields disabled (prevent editing during save)
   - Subtle overlay or opacity change on form

6. **Success State**
   - Green checkmark + "✓ Agency profile complete!"
   - Brief celebration (1 second)
   - Auto-navigate to next step

7. **Error State (Network)**
   - Red toast notification at top: "Couldn't save settings. Check your connection and try again."
   - Form remains editable
   - Retry button appears or Continue button re-enables

**Field-Specific States:**

**Agency Name Input:**
- Default: Gray border, neutral
- Focus: Blue border, cursor visible
- Typing: Blue border, live preview updating
- Valid: Green border, checkmark icon
- Invalid: Red border, error icon, error message

**Timezone Dropdown:**
- Closed: Shows selected timezone with dropdown arrow
- Open: List of timezones, search box at top
- Searching: Filtered list updates as user types
- Selected: Highlight, dropdown closes

**Currency Dropdown:**
- Closed: Shows selected currency code + name
- Open: List of currencies
- Selected: Highlight, dropdown closes

**Optional Section:**
- Collapsed: "Customize contact preferences >" with chevron right
- Expanded: "Customize contact preferences v" with chevron down, fields visible
- Animation: Smooth 200ms slide down/up

---

## Interaction & Event Specifications

### Button Interactions

**"Continue" Button**

- **Label:** "Continue →"
- **Visual Appearance:** Primary button (teal/blue background, white text, rounded corners, subtle shadow)
- **Enabled When:**
  - Agency name field has valid input (2-100 chars, alphanumeric + spaces)
  - Timezone is selected (defaulted, so always true)
  - Currency is selected (defaulted, so always true)
- **Disabled When:**
  - Agency name is empty
  - Agency name fails validation
- **Visual States:**
  - Disabled: Opacity 0.5, gray background, cursor not-allowed
  - Default: Full opacity, primary color, cursor pointer
  - Hover: Slightly darker shade, subtle scale (1.02x)
  - Active/Click: Scale down (0.98x), darker shade
  - Loading: Spinner replaces arrow, text changes to "Saving...", disabled state

**On Click:**
1. **Immediate UI Feedback:**
   - Button enters loading state
   - Spinner appears, arrow disappears
   - Button text: "Continue →" becomes "Saving..."
   - Button disabled to prevent double-click
   - All form fields disabled

2. **Client-Side Validation:**
   - Re-validate all fields (even though already validated)
   - Check agency name: 2-100 chars, valid pattern
   - Check email format (if provided in optional section)
   - Check phone format (if provided in optional section)

3. **If Validation Fails:**
   - Re-enable button
   - Remove loading state
   - Scroll to first invalid field
   - Show error message(s)
   - Focus on first invalid field

4. **If Validation Passes:**
   - Prepare payload:
     ```json
     {
       "name": "Study Connect Australia",
       "timezone": "Australia/Sydney",
       "currency": "AUD",
       "contact_email": "sarah@studyconnect.com",
       "contact_phone": "+61 412 345 678",
       "email_notifications_enabled": true
     }
     ```

5. **API Call:**
   - Send PATCH request to `/api/agencies/[agency_id]`
   - Headers: Authentication token, Content-Type: application/json
   - Timeout: 10 seconds

6. **On Success (200 response):**
   - Show success message: "✓ Agency profile complete!"
   - Green checkmark animation
   - Wait 1 second for user to see success
   - Store updated agency data in app state/context
   - Navigate to next step: `/dashboard` or `/students/new` (depending on onboarding flow)

7. **On Error (4xx/5xx response):**
   - Re-enable button and form fields
   - Remove loading state
   - Show error toast notification:
     - 400: "Please check your information and try again"
     - 401/403: "Session expired. Please log in again"
     - 409: "An agency with this name already exists in your account"
     - 500/502/503: "Server error. Please try again in a moment"
     - Network error: "Couldn't save settings. Check your connection and try again"
   - Toast appears at top of screen, auto-dismisses after 5 seconds
   - User can dismiss toast manually with X button

8. **Retry Mechanism:**
   - User clicks Continue again
   - Repeat from step 1

---

**"Skip for now" Link**

- **Label:** "Skip for now"
- **Visual Appearance:** Text link, gray color, underline on hover
- **Position:** Bottom left, opposite Continue button
- **Enabled When:** Always
- **Disabled When:** Never

**On Click:**
1. **Immediate Feedback:**
   - Link shows loading ellipsis: "Skipping..."
   - Prevent further clicks

2. **Apply Smart Defaults:**
   - Agency name: `${user.firstName}'s Agency` (e.g., "Sarah's Agency")
   - Timezone: Detected timezone or UTC if detection failed
   - Currency: Smart default based on timezone (AUD/USD/EUR/GBP)
   - Email: User's signup email
   - Phone: null
   - Notifications: false

3. **API Call:**
   - Same PATCH request to `/api/agencies/[agency_id]` with default values

4. **On Success:**
   - No success message (skip is silent)
   - Navigate immediately to dashboard
   - User can complete profile later via Settings

5. **On Error:**
   - Show error toast: "Couldn't skip setup. Please try again"
   - Re-enable link

---

**"Customize contact preferences" Toggle/Expander**

- **Label:** "Customize contact preferences" with chevron icon (> when collapsed, v when expanded)
- **Visual Appearance:** Link-style or subtle button, gray text, no background
- **Default State:** Collapsed

**On Click:**
1. **If Collapsed:**
   - Animate chevron rotation: > to v (200ms smooth)
   - Slide down optional fields section (200ms ease-out)
   - Reveal: Contact email, Contact phone, Notification checkbox
   - Section has subtle border or background to indicate grouping

2. **If Expanded:**
   - Animate chevron rotation: v to > (200ms smooth)
   - Slide up optional fields section (200ms ease-in)
   - Hide optional fields (values preserved if entered)

3. **State Preservation:**
   - If user entered data in optional fields, it persists when collapsed/expanded
   - No data loss

### Field Interactions

**Agency Name Field**

**On Focus:**
- Border color changes from gray to blue
- Cursor appears in field
- Placeholder text fades out (if field empty)
- Live preview card highlights or pulses once to draw attention

**On Input/Change (Real-Time):**
- Debounced validation (300ms after user stops typing)
- Live preview updates immediately with each keystroke
- Character count could appear (optional): "45/100"
- Validation rules checked:
  - Length: 2-100 characters
  - Pattern: Alphanumeric + spaces only
- If valid during typing: No immediate feedback (wait for blur)
- If invalid during typing: No immediate error (wait for blur to avoid annoying user)

**On Blur (When User Leaves Field):**
- Run full validation
- If valid:
  - Show green checkmark icon
  - Show success message: "That name is available ✓"
  - Border turns green briefly, then back to neutral
  - Auto-save in background (PATCH request to save draft)
- If invalid:
  - Show red X icon
  - Show error message below field in red
  - Border turns red
  - Field remains editable for correction
- If empty:
  - Show error: "Please enter an agency name"
  - Red border

**On Error:**
- Error message appears below field: "Please use letters, numbers, and spaces only (2-100 characters)"
- Error persists until field becomes valid
- Error clears immediately when field becomes valid (on next blur)

---

**Timezone Dropdown**

**On Click (Closed Dropdown):**
- Dropdown menu opens below field
- List of timezones appears
- Search input appears at top of dropdown (optional for MVP)
- Current selection is highlighted
- Dropdown has max-height with scroll if needed

**On Search/Filter (If Search Enabled):**
- User types in search box
- List filters in real-time to matching timezones
- Matching logic: contains search term (case-insensitive)
- Example: typing "sydney" shows "Australia/Sydney"

**On Option Select:**
- Clicked timezone becomes selected
- Dropdown closes
- Selected timezone appears in field
- Help text reminds: "Payment due times use 5pm in this timezone"
- Auto-save in background

**On Blur (Clicking Outside):**
- Dropdown closes
- Retains previous selection if no new selection made

---

**Currency Dropdown**

**On Click (Closed Dropdown):**
- Dropdown menu opens below field
- List of currencies appears (6 options for MVP)
- Current selection is highlighted

**On Option Select:**
- Clicked currency becomes selected
- Dropdown closes
- Selected currency code + name appears in field (e.g., "AUD - Australian Dollar")
- Help text reminds: "You can override this for individual payment plans"
- Auto-save in background

**On Blur:**
- Dropdown closes
- Retains previous selection

---

**Contact Email Field (Optional Section)**

**On Focus:**
- Border turns blue
- Cursor appears
- Pre-filled email is editable

**On Input/Change:**
- Real-time email validation (debounced 300ms)
- Check format: valid email pattern

**On Blur:**
- If valid: Green checkmark, border neutral
- If invalid: Red border, error: "Please enter a valid email address"
- If empty: Neutral (field is optional, empty is ok)
- Auto-save in background

---

**Contact Phone Field (Optional Section)**

**On Focus:**
- Border turns blue
- Cursor appears
- Placeholder shows: "+61 4XX XXX XXX"

**On Input/Change:**
- Loose validation (accept most phone formats)
- No strict pattern for MVP (international numbers vary)

**On Blur:**
- If appears valid: Neutral border (no explicit success checkmark to keep UI clean)
- If clearly invalid (e.g., letters): Red border, error: "Please enter a valid phone number"
- If empty: Neutral (optional field)
- Auto-save in background

---

**Notification Checkbox**

**On Click:**
- Toggle checked/unchecked state
- Checkmark appears/disappears
- Auto-save in background
- No other feedback needed (checkbox state is self-evident)

### Navigation Flows

**Flow 1: Complete Setup → Dashboard**
1. User completes all required fields
2. Clicks "Continue" button
3. Success message appears
4. After 1 second, navigates to `/dashboard`
5. Dashboard shows welcome message: "Welcome to Pleeno, Study Connect Australia!"
6. Agency name appears in header

**Flow 2: Skip Setup → Dashboard**
1. User clicks "Skip for now"
2. Smart defaults applied silently
3. Immediate navigation to `/dashboard`
4. User can access Settings > Agency later to complete profile

**Flow 3: Part of Onboarding Wizard (Multi-Step)**
1. User completes agency setup
2. Clicks "Continue"
3. Navigates to next onboarding step (e.g., "Add your first college" or "Invite team members")
4. Progress indicator updates: "Step 2 of 3"

**Flow 4: Edit Later (Post-Onboarding)**
1. User navigates to Settings > Agency from sidebar
2. Same form appears, but all fields pre-filled with current values
3. User edits any field
4. Changes auto-save on blur
5. Success toast: "Agency settings updated"
6. User stays on settings page or navigates away

**Flow 5: Error → Retry**
1. User clicks Continue
2. Network error occurs
3. Error toast appears
4. User fixes issue (e.g., reconnects to internet)
5. User clicks Continue again
6. Success path resumes

**Flow 6: Session Expired During Setup**
1. User fills form
2. Clicks Continue
3. API returns 401 Unauthorized
4. App detects expired session
5. Error message: "Session expired. Please log in again"
6. Auto-redirect to `/login` after 3 seconds
7. After login, redirect back to agency setup with form data preserved (if possible via local storage)

### State Changes

**Application State:**

**Before Setup:**
- `user.agency_id`: exists but agency record incomplete
- `agency.name`: null
- `agency.timezone`: null
- `agency.currency`: null
- App header shows: "Pleeno" (no agency name)

**During Setup (Field Changes):**
- Local component state updates in real-time
- Auto-save on blur sends incremental updates to server
- Server updates `agencies` table row
- No app-wide state change until Continue clicked

**After Successful Setup:**
- `agency.name`: "Study Connect Australia"
- `agency.timezone`: "Australia/Sydney"
- `agency.currency`: "AUD"
- `agency.contact_email`: "sarah@studyconnect.com"
- `agency.contact_phone`: "+61 412 345 678"
- App header updates: "Study Connect Australia" appears in header
- User's session context includes full agency data
- RLS policies fully active (agency_id filtering enforced)

**State Persistence:**
- Agency data cached in app state/context (e.g., React Context, Redux, Zustand)
- Header component re-renders with agency name
- All subsequent API calls include agency context
- Timezone affects date/time displays across app

**Database State:**
- `agencies` table row for this agency_id updated:
  ```sql
  UPDATE agencies
  SET name = 'Study Connect Australia',
      timezone = 'Australia/Sydney',
      currency = 'AUD',
      contact_email = 'sarah@studyconnect.com',
      contact_phone = '+61 412 345 678',
      updated_at = NOW()
  WHERE id = 'agency_uuid'
  ```

**RLS Context:**
- PostgreSQL session variable set: `SET app.current_agency_id = 'agency_uuid'`
- All subsequent queries automatically filtered by this agency_id
- User cannot access other agencies' data (enforced at DB level)

### User Feedback Mechanisms

**Success Feedback:**

1. **Field-Level Success (Inline)**
   - Green checkmark icon appears next to valid agency name
   - Message: "That name is available ✓"
   - Subtle, non-intrusive

2. **Save Success (Toast Notification)**
   - Green toast appears at top center
   - Content: "✓ Agency profile complete!"
   - Icon: Green checkmark
   - Duration: 1 second, then auto-dismiss
   - Non-blocking (user can still interact)

3. **Visual State Changes**
   - Continue button shows brief success state before navigation
   - Form border briefly flashes green (optional)

**Error Feedback:**

1. **Field-Level Errors (Inline)**
   - Red border on invalid field
   - Red error icon (X or warning)
   - Error message in red text below field
   - Specific, helpful message: "Please use letters, numbers, and spaces only"
   - Error clears when field becomes valid

2. **Save Error (Toast Notification)**
   - Red toast appears at top center
   - Content: Error message based on error type
   - Icon: Red X or warning icon
   - Duration: 5 seconds or manual dismiss
   - Dismissible with X button

3. **Network Error (Toast + Retry)**
   - Orange/yellow toast (warning color)
   - Content: "Couldn't save settings. Check your connection and try again."
   - Persistent until user dismisses or retries
   - Continue button re-enables for retry

**Loading Feedback:**

1. **Button Loading State**
   - Continue button: Spinner replaces arrow
   - Text changes: "Continue →" becomes "Saving..."
   - Button disabled during save

2. **Global Loading (Optional)**
   - Subtle overlay on form (opacity 0.5)
   - Prevents interaction during save
   - Or, top progress bar (like GitHub/YouTube)

3. **Auto-Save Feedback (Subtle)**
   - Small saving indicator: "Saving..." appears near field
   - Changes to "Saved ✓" when complete
   - Fades out after 1 second
   - Very subtle, non-intrusive

**Validation Feedback:**

1. **Real-Time (As User Types)**
   - Live preview updates (agency name in header mockup)
   - No error messages during typing (avoid annoyance)
   - Validation runs on debounce (300ms after typing stops)

2. **On Blur (When User Leaves Field)**
   - Immediate validation feedback
   - Success: Green checkmark
   - Error: Red border + message
   - Clear, actionable messages

**Help/Guidance Feedback:**

1. **Help Text (Static)**
   - Gray text below fields
   - Explains purpose: "Payment due times use 5pm in this timezone"
   - Always visible (not hidden in tooltip)

2. **Placeholder Text**
   - Provides example: "e.g., Study Abroad Experts"
   - Disappears on focus

3. **Progressive Disclosure**
   - Optional fields hidden behind "Customize" toggle
   - Reduces cognitive load
   - Advanced users can expand

**Accessibility Feedback:**

1. **ARIA Labels**
   - Screen reader announces field errors
   - Success states announced
   - Button state changes announced

2. **Keyboard Navigation**
   - Tab through fields in logical order
   - Enter key submits form (same as Continue button)
   - Escape closes dropdowns

3. **Focus Indicators**
   - Clear blue outline on focused field
   - Visible for keyboard users

---

## Acceptance Criteria Reference

From Epic Story 2.1:

✅ **Given** I am an authenticated Agency Admin
✅ **When** I access the agency settings page
✅ **Then** I can view and edit my agency's name, contact information, default currency, and timezone

✅ **And** changes are saved to the database with proper validation
✅ **And** the agency name appears in the application header/navigation
✅ **And** all timestamps display in the agency's configured timezone

**Additional Criteria for This Implementation:**
- Setup takes less than 60 seconds for typical user
- All required fields have smart defaults where possible
- User can skip and complete later
- Success state clearly communicates completion
- Error states provide actionable guidance

---

## Technical Context

From Story 2.1 Technical Notes:

**Backend:**
- Extend `agencies` table with fields: `name`, `contact_email`, `contact_phone`, `currency` (default: AUD), `timezone`
- API endpoint: `PATCH /api/agencies/[id]`
- Validation: Required fields are `name`, `currency`, `timezone`
- Authorization: Only Agency Admins can edit agency settings

**Frontend:**
- Create `/settings/agency` page or onboarding modal
- Form with 5 fields: name, timezone, currency, email, phone
- Auto-detect timezone using browser API
- Smart default currency based on timezone
- Real-time validation with inline feedback
- Auto-save on blur (optional) + explicit Continue button
- Update app header with agency name after save

**Technology Stack (Assumed):**
- Next.js 14+ with App Router
- React with TypeScript
- Tailwind CSS for styling
- shadcn/ui or similar component library
- React Hook Form for form management
- Zod for validation schema
- SWR or TanStack Query for data fetching

**API Request/Response:**

**Request (PATCH /api/agencies/[id]):**
```json
{
  "name": "Study Connect Australia",
  "timezone": "Australia/Sydney",
  "currency": "AUD",
  "contact_email": "sarah@studyconnect.com",
  "contact_phone": "+61 412 345 678"
}
```

**Response (200 OK):**
```json
{
  "id": "agency_uuid",
  "name": "Study Connect Australia",
  "timezone": "Australia/Sydney",
  "currency": "AUD",
  "contact_email": "sarah@studyconnect.com",
  "contact_phone": "+61 412 345 678",
  "updated_at": "2025-11-12T14:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": {
    "name": "Agency name must be between 2 and 100 characters"
  }
}
```

**Database Schema (agencies table):**
```sql
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  currency VARCHAR(3) NOT NULL DEFAULT 'AUD',
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY agency_isolation ON agencies
  USING (id = current_setting('app.current_agency_id')::uuid);
```

---

## Complete Frontend Prompt for v0.dev

**PROMPT START:**

Create an Agency Profile Setup form for a B2B SaaS application called Pleeno. This is a first-time setup experience where agency administrators configure their agency's basic identity and operational settings.

**Design Goals:**
- Modern, friendly SaaS aesthetic (think Linear, Notion, or Vercel)
- Complete setup in under 60 seconds
- Conversational tone, not corporate/bureaucratic
- Smart defaults to minimize user effort
- Clear, immediate feedback for all interactions

**User Context:**
The user (Sarah, an Agency Admin) just signed up and needs to establish her agency's identity before using the platform. She's eager to start tracking student payments, not fill forms. Make this feel quick and painless.

---

**Layout & Structure:**

Create a centered card/modal (max-width 600px) on a clean background with:

1. **Header Section:**
   - Pleeno logo or icon at top
   - Heading: "Welcome to Pleeno! Let's set up [User's Name]'s agency"
   - Subheading: "This will take about 30 seconds"

2. **Main Form Section (4 fields):**

   **Field 1: Agency Name** (required)
   - Label: "What should we call your agency?" (conversational, not "Agency Name*")
   - Text input, placeholder: "e.g., Study Abroad Experts"
   - Real-time validation: 2-100 characters, alphanumeric + spaces only
   - Show green checkmark + "That name is available ✓" when valid
   - Include a small live preview card to the right or below showing how the name appears in the app header (mini mockup)

   **Field 2: Timezone** (required, defaulted)
   - Label: "Your timezone"
   - Searchable dropdown, pre-populated with auto-detected timezone (e.g., "Australia/Sydney")
   - Help text below: "Payment due times use 5pm in this timezone"
   - Options: Standard timezone list (Australia/Sydney, America/New_York, Europe/London, etc.)

   **Field 3: Default Currency** (required, defaulted)
   - Label: "Default currency"
   - Dropdown, smart default: AUD if Australian timezone, USD otherwise
   - Help text below: "You can override this for individual payment plans"
   - Options: AUD, USD, GBP, EUR, CAD, NZD (show code + full name)

3. **Optional Section (Collapsible):**
   - Trigger: "Customize contact preferences >" (chevron right, link style)
   - On click: Expands smoothly to reveal:
     - **Contact Email** (pre-filled from signup, editable)
     - **Contact Phone** (optional, placeholder: "+61 4XX XXX XXX")
     - **Checkbox:** "Send me weekly payment summaries"
   - Collapsed by default to reduce cognitive load

4. **Footer Section:**
   - **Primary CTA:** "Continue →" button (teal/blue, prominent)
     - Enabled only when agency name is valid
     - On click: Shows spinner + "Saving...", then navigates forward
   - **Secondary CTA:** "Skip for now" link (gray, subtle)
     - Uses smart defaults, lets user proceed immediately

---

**Interactions & States:**

**Agency Name Field:**
- As user types: Live preview updates in real-time
- On blur (leaving field): Run validation
  - If valid: Green border briefly, checkmark appears, success message
  - If invalid: Red border, error icon, specific error message below field
- Auto-save on blur (background)

**Timezone Dropdown:**
- Pre-filled with browser-detected timezone
- Searchable: User can type to filter (e.g., "sydney" → Australia/Sydney)
- Selected value shows clearly

**Currency Dropdown:**
- Smart default based on timezone (AUD for AU, USD for US, etc.)
- Clean dropdown with currency code + name

**Continue Button:**
- Disabled state: Gray, opacity 0.5, not clickable
- Enabled state: Teal/blue, full opacity, clickable
- Loading state: Spinner replaces arrow, text "Saving...", disabled
- Hover: Slightly darker, subtle scale up
- On success: Brief green checkmark, then navigate

**Success Flow:**
1. User clicks Continue
2. Button shows loading spinner
3. After save succeeds: "✓ Agency profile complete!" message appears
4. After 1 second: Navigate to next step (dashboard or onboarding)
5. Agency name now appears in app header throughout application

**Error Handling:**
- Network error: Red toast notification "Couldn't save settings. Check your connection and try again."
- Validation error: Inline error messages with specific guidance
- All errors are dismissible and actionable

---

**Visual Design Details:**

**Colors:**
- Primary: Teal/blue (#0EA5E9 or similar professional SaaS blue)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Gray text: #6B7280
- Background: White or very light gray (#F9FAFB)

**Typography:**
- Heading: 24-28px, semi-bold
- Labels: 14-16px, medium weight, conversational phrasing
- Help text: 12-14px, gray, regular weight
- Button text: 14-16px, medium weight

**Spacing:**
- Generous white space between fields (16-24px)
- Form padding: 32-40px
- Clean, uncluttered layout

**Components:**
- Rounded corners (8px on inputs, 6px on buttons)
- Subtle shadows on card (soft, not harsh)
- Smooth animations (200ms ease-out for expansions/transitions)
- Focus states: Blue outline (2px) for accessibility

**Live Preview Card:**
- Small mockup showing app header with agency name
- Border: Light gray, subtle
- Background: Very light gray
- Updates instantly as user types
- Label above: "Preview" (small, gray text)

---

**Accessibility:**
- All fields have proper labels (no placeholder-only labels)
- Tab order: Name → Timezone → Currency → Optional toggle → Email → Phone → Checkbox → Continue → Skip
- Enter key submits form (same as clicking Continue)
- Error messages announced by screen readers
- Focus indicators clearly visible
- ARIA labels for validation states

---

**Copy/Content:**
- Welcome heading: "Welcome to Pleeno! Let's set up [Name]'s agency"
- Subheading: "This will take about 30 seconds"
- Agency name label: "What should we call your agency?"
- Agency name placeholder: "e.g., Study Abroad Experts"
- Agency name success: "That name is available ✓"
- Timezone label: "Your timezone"
- Timezone help: "Payment due times use 5pm in this timezone"
- Currency label: "Default currency"
- Currency help: "You can override this for individual payment plans"
- Optional section trigger: "Customize contact preferences >"
- Email label: "Contact email"
- Email help: "For notifications and support"
- Phone label: "Phone (optional)"
- Phone placeholder: "+61 4XX XXX XXX"
- Checkbox label: "Send me weekly payment summaries"
- Primary button: "Continue →"
- Secondary link: "Skip for now"
- Success message: "✓ Agency profile complete!"
- Error messages: Context-specific, helpful, actionable

---

**Implementation Notes:**
- Use modern form patterns: auto-save on blur, real-time validation, smart defaults
- Timezone detection: Use browser API (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
- Form library: React Hook Form or similar for state management
- Validation: Zod schema or similar
- All fields except agency name are optional or pre-filled
- Save endpoint: PATCH /api/agencies/[id]
- Response: Updates app context with agency data, re-renders header

**Key Differentiators from Generic Forms:**
- Conversational questions instead of form labels
- Live preview showing real impact
- Smart defaults reduce work by 80%
- Progressive disclosure (optional section hidden)
- Skip option for power users
- Auto-save prevents data loss
- Celebrates success with animation and clear next step

**PROMPT END**

---

**Usage Instructions:**
1. Copy the entire "Complete Frontend Prompt for v0.dev" section above
2. Paste into v0.dev or your preferred frontend AI tool (Cursor, Bolt.new, etc.)
3. Review the generated mockup against this specification
4. Iterate by referencing specific sections of this document
5. Test the user journey: Can someone complete setup in under 60 seconds?
6. Validate all interaction states: loading, success, error, validation

---

**Document Metadata:**
- **Story ID:** 2.1
- **Epic:** Agency & User Management
- **Generated:** 2025-11-12
- **Author:** anton
- **Brainstorming Session:** Techniques used - First Principles Thinking, SCAMPER Method, What If Scenarios
- **Review Status:** Ready for v0.dev implementation
