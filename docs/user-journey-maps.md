# pleeno - User Journey Maps

**Author:** anton
**Date:** 2025-11-10
**Project Level:** MVP

---

## Overview

This document provides comprehensive user journey maps for all user stories starting from EPIC 2. Each journey map details the step-by-step experience from the user's perspective, including touchpoints, actions, emotions, and pain points.

---

## EPIC 2: Agency & User Management

### Story 2.1: Agency Profile Setup

**User Story:**
As an **Agency Admin**,
I want **to configure my agency's profile with basic information**,
So that **my agency identity is established in the system and my team knows which agency they're working in**.

**Acceptance Criteria:**
- **Given** I am an authenticated Agency Admin
- **When** I access the agency settings page
- **Then** I can view and edit my agency's name, contact information, default currency, and timezone
- **And** changes are saved to the database with proper validation
- **And** the agency name appears in the application header/navigation
- **And** all timestamps display in the agency's configured timezone

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Discovery** | - Logs in for the first time<br>- Notices generic/incomplete agency info in header<br>- Looks for settings | - Displays dashboard with default agency placeholder<br>- Shows navigation menu | - Login page<br>- Dashboard header<br>- Navigation menu | Curious, slightly confused | "Where do I set up my agency details?" | Onboarding tooltip or prompt to complete profile |
| **Entry** | - Clicks on Settings menu<br>- Navigates to Agency settings | - Displays agency settings page<br>- Shows current agency info (minimal/default) | - Settings navigation<br>- Agency settings page | Purposeful, ready to configure | May not be clear which settings are required | Clear visual indicators for required fields |
| **Configuration** | - Enters agency name<br>- Adds contact email and phone<br>- Selects default currency (AUD)<br>- Chooses timezone | - Validates input in real-time<br>- Shows currency dropdown<br>- Shows timezone selector with search | - Form fields<br>- Validation messages<br>- Dropdowns | Focused, productive | Timezone selection can be overwhelming with many options | Smart timezone detection based on browser/IP |
| **Validation** | - Reviews entered information<br>- Checks for errors | - Highlights any validation errors<br>- Shows inline error messages<br>- Enables/disables Save button based on validation | - Validation indicators<br>- Error messages<br>- Save button state | Cautious, wants accuracy | Unclear what format is expected for some fields | Example text in placeholders, format hints |
| **Completion** | - Clicks Save button<br>- Waits for confirmation | - Saves data to database<br>- Shows success message<br>- Updates header with new agency name<br>- Refreshes page with updated timezone | - Save button<br>- Success notification<br>- Updated header | Satisfied, accomplished | Brief moment of uncertainty while saving | Loading indicator, immediate visual feedback |
| **Continuation** | - Sees agency name in header<br>- Notices timestamps now in correct timezone<br>- Proceeds to next task | - Agency identity now visible throughout app<br>- All future timestamps display correctly | - Application header<br>- Dashboard<br>- Any timestamp displays | Confident, oriented | None | Suggest next action (e.g., "Invite your team") |

#### Key Insights
- **Critical Moment:** Seeing the agency name appear in the header provides immediate validation
- **Potential Friction:** Timezone selection—consider auto-detection
- **Success Metric:** User completes profile setup within 2 minutes of first login
- **Follow-up Action:** Prompt user to invite team members next

---

### Story 2.2: User Invitation System

**User Story:**
As an **Agency Admin**,
I want **to invite team members to join my agency**,
So that **I can build my team and delegate work**.

**Acceptance Criteria:**
- **Given** I am an Agency Admin
- **When** I invite a new user by email
- **Then** an invitation email is sent with a secure signup link
- **And** the invitation link expires after 7 days
- **And** the invited user can complete registration with the link
- **And** the new user is automatically associated with my agency
- **And** I can specify their role (Agency Admin or Agency User) during invitation

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Preparation** | - Decides to invite team member<br>- Navigates to User Management<br>- Collects team member's email | - Shows User Management page<br>- Displays current team list (possibly empty)<br>- Highlights "Invite User" button | - Settings menu<br>- User Management page<br>- Invite button | Proactive, building team | May not have collected email addresses yet | Bulk invite option, import from CSV |
| **Invitation Creation** | - Clicks "Invite User"<br>- Enters team member's email<br>- Selects role (Admin or User)<br>- Optionally adds personal message | - Opens invitation modal/form<br>- Validates email format<br>- Shows role descriptions on hover<br>- Provides message template | - Invitation form<br>- Email input field<br>- Role selector<br>- Message textarea | Focused, welcoming | Unsure about difference between Admin and User roles | Clear role descriptions, comparison table |
| **Role Decision** | - Hovers over role options<br>- Reads role descriptions<br>- Selects appropriate role | - Displays tooltip explaining permissions<br>- Highlights selected role | - Role selector<br>- Help tooltips | Thoughtful, cautious | "What if I choose wrong?" | Ability to change role later, reassurance message |
| **Send Invitation** | - Reviews invitation details<br>- Clicks "Send Invitation" | - Validates all fields<br>- Generates secure token<br>- Sends invitation email<br>- Shows success message<br>- Adds pending invitation to list | - Send button<br>- Success notification<br>- Updated user list (pending section) | Satisfied, anticipatory | "Did they receive it?" "What if email is wrong?" | Show preview of email, copy invitation link option |
| **Email Delivery** | - Waits for team member to receive email<br>- May check pending invitations list | - Email delivered to recipient<br>- Shows pending invitation status<br>- Displays expiry date (7 days) | - Email inbox (recipient)<br>- Pending invitations list (admin) | Hopeful, slightly anxious | No immediate confirmation of delivery | Email delivery status, resend option visible immediately |
| **Follow-up** | - Checks if invitation was accepted<br>- May resend if needed | - Updates invitation status when accepted<br>- Moves user from pending to active<br>- Option to resend or delete pending invitations | - User list<br>- Pending invitations section<br>- Resend/Delete buttons | Monitoring, engaged | "Did they see it?" "Should I message them separately?" | Email notification when invitation is accepted, reminder system |

#### Key Insights
- **Critical Moment:** Seeing the invitation appear in pending list provides confirmation
- **Potential Friction:** Uncertainty about role permissions—needs clear documentation
- **Success Metric:** 80% of invitations accepted within 48 hours
- **Follow-up Action:** Notify admin when invitation is accepted

---

### Story 2.3: User Management Interface

**User Story:**
As an **Agency Admin**,
I want **to view and manage all users in my agency**,
So that **I can control who has access and what roles they have**.

**Acceptance Criteria:**
- **Given** I am an Agency Admin
- **When** I access the user management page
- **Then** I see a list of all users in my agency with their roles and status
- **And** I can change a user's role (Admin ↔ User)
- **And** I can deactivate or reactivate user accounts
- **And** deactivated users cannot log in
- **And** I can resend invitation emails for pending invitations
- **And** I can delete pending invitations

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Overview** | - Navigates to User Management<br>- Scans user list<br>- Checks team composition | - Displays all active users<br>- Shows pending invitations separately<br>- Displays role badges and status indicators | - User Management page<br>- User list table<br>- Status badges | Supervisory, assessing | Hard to see who's active at a glance if many users | Quick stats summary (X active users, Y pending invitations) |
| **User Review** | - Clicks on individual user<br>- Reviews user details<br>- Checks recent activity | - Highlights selected user<br>- Shows user details panel<br>- Displays last login time | - User list item<br>- Details panel/modal | Evaluating, managing | Limited information about user activity | Show last activity, number of actions performed |
| **Role Change** | - Decides to promote/demote user<br>- Clicks role dropdown<br>- Selects new role<br>- Confirms change | - Opens role selector<br>- Shows confirmation dialog<br>- Updates role immediately<br>- Shows success notification<br>- Logs change in audit | - Role dropdown<br>- Confirmation dialog<br>- Success message | Decisive, responsible | "Will they be notified?" "Takes effect immediately?" | Clear confirmation message, option to notify user |
| **Deactivation** | - Needs to remove user access<br>- Clicks deactivate button<br>- Confirms decision (serious action) | - Shows warning dialog<br>- Explains consequences<br>- Requires confirmation<br>- Deactivates user<br>- Updates status to "Inactive"<br>- Prevents login | - Deactivate button<br>- Warning dialog<br>- Confirmation checkbox<br>- Updated status badge | Serious, cautious | "What exactly happens?" "Can I reverse this?" | Detailed explanation, show that data is preserved, reversible action |
| **Reactivation** | - Decides to restore access<br>- Finds deactivated user (filter?)<br>- Clicks reactivate | - Shows inactive users (possibly filtered)<br>- Reactivates account immediately<br>- Sends reactivation email to user<br>- Updates status to "Active" | - Filter/view toggle<br>- Reactivate button<br>- Success notification | Welcoming, corrective | Finding deactivated users may be difficult | Clear filter for inactive users, separate section |
| **Pending Management** | - Reviews pending invitations<br>- Resends to those who didn't accept<br>- Deletes mistaken invitations | - Shows pending invitations separately<br>- Displays days until expiry<br>- Resends email with new token<br>- Removes deleted invitations<br>- Shows confirmation | - Pending invitations section<br>- Resend/Delete buttons<br>- Expiry countdown | Organized, efficient | "Why haven't they accepted?" | Show when invitation was sent, easier bulk actions |

#### Key Insights
- **Critical Moment:** Successfully changing a role or deactivating a user with clear feedback
- **Potential Friction:** Understanding the difference between deactivating and deleting (invitations)
- **Success Metric:** Admins can find and modify any user within 30 seconds
- **Follow-up Action:** Audit log shows all user management changes

---

### Story 2.4: User Profile Management

**User Story:**
As an **Agency User or Admin**,
I want **to manage my own profile information**,
So that **my account information is accurate and I can change my password**.

**Acceptance Criteria:**
- **Given** I am an authenticated user
- **When** I access my profile settings
- **Then** I can update my name, email, and password
- **And** email changes require verification
- **And** password changes require current password confirmation
- **And** password must meet security requirements (min 8 chars, mix of types)
- **And** I receive confirmation when profile is updated
- **And** I can view my role and agency but cannot change them

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Access** | - Clicks profile icon/menu<br>- Selects "Profile Settings" | - Opens profile settings page<br>- Displays current profile information<br>- Shows read-only agency and role | - Profile menu<br>- Profile settings page<br>- Form fields | Routine, maintenance-focused | Finding profile settings in navigation | Consistent placement, clear icon |
| **Information Update** | - Updates name<br>- Changes email address | - Validates name format<br>- Validates email format<br>- Shows inline validation<br>- Flags email change as requiring verification | - Name input field<br>- Email input field<br>- Validation messages | Focused, updating info | "When does this take effect?" | Real-time validation, clear messaging |
| **Email Verification** | - Saves changes with new email<br>- Checks inbox for verification email<br>- Clicks verification link | - Sends verification email<br>- Shows pending verification status<br>- Keeps old email active until verified<br>- Verifies new email<br>- Switches to new email | - Save button<br>- Email inbox<br>- Verification link<br>- Confirmation page | Anticipatory, then relieved | "Can I still log in?" "What if I don't receive the email?" | Clear status indicator, option to resend, keep old email working |
| **Password Change** | - Decides to update password<br>- Clicks "Change Password"<br>- Enters current password<br>- Enters new password<br>- Confirms new password | - Opens password change section<br>- Validates current password<br>- Shows password requirements<br>- Validates new password strength<br>- Checks password match | - Change Password button<br>- Password fields<br>- Requirements checklist<br>- Strength meter | Security-conscious, careful | Forgetting current password, creating strong password | Password strength meter, helpful suggestions, forgot password link |
| **Security Validation** | - Attempts weak password<br>- Adjusts to meet requirements<br>- Confirms password matches | - Shows requirement violations in real-time<br>- Displays strength indicator<br>- Validates match between new passwords<br>- Only enables save when valid | - Requirements list<br>- Strength indicator<br>- Match validation | Frustrated if complex, then confident | Balancing memorability with security | Show examples, explain why requirements matter |
| **Confirmation** | - Submits profile changes<br>- Waits for confirmation | - Saves all changes<br>- Hashes new password<br>- Shows success message<br>- Logs password change in audit<br>- Optionally logs out other sessions | - Submit button<br>- Success notification<br>- Updated profile view | Accomplished, secure | "Do I need to log in again?" | Clear next steps, no unnecessary logout |
| **Verification** | - Reviews updated profile<br>- Verifies changes took effect<br>- Notes read-only fields (agency, role) | - Displays updated information<br>- Shows read-only fields grayed out<br>- Explains why some fields can't be changed | - Profile view<br>- Read-only field styling<br>- Help tooltips | Satisfied, informed | "Why can't I change my role?" | Tooltip explaining admin controls these fields |

#### Key Insights
- **Critical Moment:** Successfully verifying new email and changing password
- **Potential Friction:** Email verification process can cause anxiety—keep old email working
- **Success Metric:** 95% of profile updates completed without support tickets
- **Follow-up Action:** All profile changes logged in audit trail

---

## EPIC 3: Core Entity Management

### Story 3.1: College Registry

**User Story:**
As an **Agency User**,
I want **to create and manage a registry of colleges and their branch locations**,
So that **I can associate students and payment plans with specific institutions and track commissions by branch**.

**Acceptance Criteria:**
- **Given** I am an authenticated Agency User
- **When** I access the colleges management page
- **Then** I can view all colleges in my agency
- **And** I can create a new college with name, country, and website
- **And** I can edit existing college information
- **And** I can add branches to a college with branch name, address, and contact details
- **And** I can mark branches as active or inactive
- **And** each branch has an associated commission rate (percentage)

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Discovery** | - Needs to track colleges<br>- Navigates to Colleges section<br>- Views empty or minimal list | - Shows Colleges page<br>- Displays existing colleges (if any)<br>- Highlights "Add College" button | - Main navigation<br>- Colleges page<br>- College list<br>- Add button | Purposeful, organizing | "Do I need to add every college I work with?" | Onboarding guide, explanation of purpose |
| **College Creation** | - Clicks "Add College"<br>- Enters college name<br>- Selects country from list<br>- Adds website URL | - Opens college creation form<br>- Validates college name<br>- Shows country dropdown with search<br>- Validates URL format | - Add College button<br>- Creation form<br>- Country selector<br>- URL field | Productive, data entry | Country list may be long, URL format unclear | Smart country search, auto-format URLs (add https://) |
| **College Saved** | - Clicks Save<br>- Sees college added to list | - Saves college to database<br>- Shows success notification<br>- Displays college in list<br>- Opens college detail view | - Save button<br>- Success message<br>- College list<br>- College detail page | Accomplished, progressing | "What about branches?" | Prompt to add first branch next |
| **Branch Addition** | - Realizes need to add branches<br>- Clicks "Add Branch" on college detail<br>- Enters branch name<br>- Adds address and contact info<br>- Sets commission rate | - Shows branch creation form<br>- Validates required fields<br>- Validates commission rate (0-100%)<br>- Shows help text for commission rate | - Add Branch button<br>- Branch form<br>- Address fields<br>- Commission rate input | Focused, important data | "What commission rate should I use?" "Is this final?" | Provide examples, explain commission rate can be edited later |
| **Commission Rate Setting** | - Enters commission percentage<br>- Sees validation feedback<br>- Adjusts if out of range | - Validates 0-100 range<br>- Shows error if invalid<br>- Provides input formatting (e.g., "15%" display) | - Commission rate field<br>- Validation message<br>- Format helper | Careful, financially aware | Confusion between decimal (0.15) vs percentage (15) | Use percentage clearly, show examples |
| **Branch Management** | - Saves branch<br>- Adds more branches to same college<br>- Sets some as inactive (closed locations) | - Saves branch with all details<br>- Displays branch in college's branch list<br>- Shows active/inactive status<br>- Allows toggling active status | - Branch list<br>- Status toggle<br>- Branch cards/table | Organized, tracking reality | Many branches may clutter view | Filter by active/inactive, visual separation |
| **Editing** | - Needs to update college or branch info<br>- Clicks edit<br>- Modifies information<br>- Saves changes | - Opens edit form with current data<br>- Validates changes<br>- Updates database<br>- Shows change confirmation<br>- Logs change in audit trail | - Edit button<br>- Edit form<br>- Save confirmation | Correcting, maintaining | "Will this affect existing payment plans?" | Reassure that existing data is preserved, only future plans affected |
| **Overview** | - Returns to college list<br>- Scans all colleges and branches<br>- Searches for specific college | - Shows all colleges with branch counts<br>- Provides search functionality<br>- Allows filtering by country | - College list<br>- Search bar<br>- Filters<br>- Summary view | Satisfied, in control | Finding specific college if many exist | Good search, visual indicators, sorting options |

#### Key Insights
- **Critical Moment:** Successfully adding first branch with commission rate
- **Potential Friction:** Understanding commission rate format and implications
- **Success Metric:** Users add average 3 colleges with 2+ branches each within first week
- **Follow-up Action:** Colleges and branches ready for student enrollment linking

---

### Story 3.2: Student Registry

**User Story:**
As an **Agency User**,
I want **to create and manage a database of students**,
So that **I can track which students are enrolled where and link them to payment plans**.

**Acceptance Criteria:**
- **Given** I am an authenticated Agency User
- **When** I access the students management page
- **Then** I can view all students in my agency
- **And** I can create a new student with name, email, phone, and passport number
- **And** I can edit existing student information
- **And** I can see which colleges/branches each student is enrolled in
- **And** I can search students by name, email, or passport number
- **And** student records are unique by passport number within my agency

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Initial Access** | - Navigates to Students section<br>- Views student list (empty or populated)<br>- Decides to add new student | - Shows Students page<br>- Displays student list/grid<br>- Shows "Add Student" button<br>- Shows search bar | - Main navigation<br>- Students page<br>- Student list<br>- Add button | Organized, task-oriented | "How should I organize this?" | Clear list view, filtering options visible |
| **Student Creation** | - Clicks "Add Student"<br>- Enters first and last name<br>- Adds email address<br>- Adds phone number<br>- Enters passport number<br>- Adds date of birth<br>- Selects nationality | - Opens student creation form<br>- Validates each field in real-time<br>- Checks passport number uniqueness<br>- Formats phone number<br>- Validates email format<br>- Shows date picker for DOB | - Add Student button<br>- Creation form<br>- Form fields<br>- Validation messages<br>- Date picker<br>- Country selector | Focused, entering important data | Many required fields, passport format unclear, avoiding typos | Auto-format fields, clear examples, copy-paste friendly |
| **Duplicate Detection** | - Enters passport number that already exists<br>- Sees error message<br>- Checks existing record | - Detects duplicate passport<br>- Shows clear error message<br>- Links to existing student record<br>- Prevents duplicate creation | - Passport field<br>- Error notification<br>- Link to existing student | Frustrated, then relieved | "Did I already add them?" | Clear duplicate detection, easy navigation to existing record |
| **Data Validation** | - Attempts to save with invalid data<br>- Corrects errors<br>- Ensures all required fields complete | - Highlights missing/invalid fields<br>- Shows specific error messages<br>- Only enables Save when valid<br>- Provides format hints | - Form validation<br>- Error indicators<br>- Save button state<br>- Help text | Careful, wants accuracy | Unclear format requirements | Clear validation messages, examples, real-time feedback |
| **Save Confirmation** | - Clicks Save<br>- Waits for confirmation<br>- Views new student in list | - Saves student to database<br>- Shows success notification<br>- Redirects to student detail page<br>- Student appears in list | - Save button<br>- Success message<br>- Student detail page<br>- Updated list | Accomplished, progressing | "What's next for this student?" | Prompt to enroll student or create payment plan |
| **Search & Find** | - Needs to find specific student<br>- Uses search bar<br>- Enters name, email, or passport<br>- Scans results | - Searches across name, email, passport<br>- Shows results in real-time<br>- Highlights matching text<br>- Shows no results message if applicable | - Search bar<br>- Search results<br>- Result highlighting | Efficient, goal-driven | Slow search, unclear if search includes all fields | Fast search, show which field matched, filter options |
| **Student Detail View** | - Clicks on student from list<br>- Views complete profile<br>- Sees enrollment information<br>- Checks payment plans | - Shows student detail page<br>- Displays all student information<br>- Shows linked enrollments<br>- Shows linked payment plans<br>- Provides edit option | - Student list item<br>- Student detail page<br>- Enrollment section<br>- Payment plans section<br>- Edit button | Informed, managing | Information overload if many enrollments/plans | Clear sections, tabs, summary view |
| **Editing** | - Clicks edit student<br>- Updates information<br>- Saves changes<br>- Reviews updated profile | - Opens edit form with current data<br>- Validates changes<br>- Updates database<br>- Shows success confirmation<br>- Logs change in audit trail | - Edit button<br>- Edit form<br>- Save confirmation<br>- Updated detail view | Maintaining, correcting | "Will this affect payment plans?" | Reassure existing links preserved |

#### Key Insights
- **Critical Moment:** Successfully adding first student with all details
- **Potential Friction:** Passport number uniqueness—good duplicate detection critical
- **Success Metric:** Average time to add student under 90 seconds
- **Follow-up Action:** Student ready for enrollment linking

---

### Story 3.3: Student-College Enrollment Linking

**User Story:**
As an **Agency User**,
I want **to link students to their enrolled colleges and branches**,
So that **I can track where each student is studying and enable payment plan creation**.

**Acceptance Criteria:**
- **Given** I have existing students and colleges in the system
- **When** I enroll a student at a college branch
- **Then** the enrollment is recorded with start date and expected end date
- **And** I can specify the program/course name
- **And** I can view all enrollments for a student
- **And** I can view all enrolled students for a college/branch
- **And** a student can be enrolled in multiple colleges/branches
- **And** I can mark an enrollment as completed or cancelled

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Context Setup** | - Has student created<br>- Has college/branch created<br>- Needs to link them<br>- Navigates to student detail OR college detail | - Shows student or college detail page<br>- Displays "Add Enrollment" button<br>- Shows existing enrollments section | - Student/College detail page<br>- Enrollments section<br>- Add Enrollment button | Purposeful, connecting data | "Where do I do this?" | Make enrollment action visible from both student and college views |
| **Enrollment Creation** | - Clicks "Add Enrollment"<br>- Selects college and branch (or student if from college view)<br>- Enters program/course name<br>- Sets start date<br>- Sets expected end date | - Opens enrollment form<br>- Shows dropdowns for student/college selection<br>- Validates date range (end > start)<br>- Provides program name suggestions if available<br>- Shows calendar date pickers | - Add Enrollment button<br>- Enrollment form<br>- Student/College selectors<br>- Program field<br>- Date pickers | Focused, important step | Many fields, date picking can be tedious | Pre-fill fields where possible, suggest common program names |
| **Program Entry** | - Enters program/course name<br>- E.g., "Bachelor of Business" | - Accepts free text<br>- May suggest previously used program names<br>- Validates required field | - Program name field<br>- Autocomplete suggestions | Straightforward | Inconsistent naming (typos, abbreviations) | Autocomplete from previous entries, standardize common program names |
| **Date Selection** | - Selects start date<br>- Selects expected end date<br>- Ensures dates make sense | - Shows calendar picker<br>- Validates end date after start date<br>- Calculates duration<br>- Shows validation errors if invalid | - Start date picker<br>- End date picker<br>- Validation messages<br>- Duration display | Careful, planning | "When exactly does the program end?" | Allow approximate dates, show duration calculation |
| **Save Enrollment** | - Reviews enrollment details<br>- Clicks Save<br>- Views confirmation | - Saves enrollment to database<br>- Shows success notification<br>- Displays enrollment in list<br>- Updates student/college views with link | - Save button<br>- Success message<br>- Enrollment list<br>- Updated detail pages | Accomplished, linked | "Can I create payment plan now?" | Immediately offer to create payment plan for this enrollment |
| **View All Enrollments** | - From student view: sees all colleges student attends<br>- From college view: sees all enrolled students<br>- Scans enrollment list | - Shows enrollments in clear list/cards<br>- Displays key info: program, dates, status<br>- Provides filtering by status<br>- Links to related entities | - Enrollment list<br>- Enrollment cards<br>- Status badges<br>- Filter options | Informed, managing | Lots of data if many enrollments | Clear visual hierarchy, status indicators, sorting |
| **Multiple Enrollments** | - Realizes student at multiple branches<br>- Adds second enrollment for same student<br>- Sees both enrollments listed | - Allows multiple enrollments per student<br>- Shows all enrollments distinctly<br>- No conflict or limitation<br>- Links clearly to different branches | - Multiple enrollment records<br>- Distinct display | Confident, flexible | Confusion if same college but different branches | Clearly show college AND branch name |
| **Status Management** | - Program completes or student withdraws<br>- Changes enrollment status to "Completed" or "Cancelled"<br>- Views updated status | - Allows status change via dropdown/button<br>- Updates status in database<br>- Shows status visually (color, badge)<br>- Logs change in audit trail | - Status selector<br>- Status badge<br>- Change confirmation | Managing lifecycle, accurate | "Does this affect payment plans?" | Clear messaging about impact, maintain payment plan link |
| **Payment Plan Context** | - Views enrollment<br>- Sees linked payment plans<br>- Understands relationship | - Shows payment plans associated with enrollment<br>- Links bidirectionally<br>- Displays count of active plans | - Payment Plans section<br>- Plan count badge<br>- Plan links | Contextual, informed | Understanding the enrollment-payment relationship | Visual diagram or clear explanation, easy navigation between entities |

#### Key Insights
- **Critical Moment:** Successfully creating enrollment and seeing it linked in both student and college views
- **Potential Friction:** Date selection and program name consistency
- **Success Metric:** 90% of students enrolled at least once before payment plan creation
- **Follow-up Action:** Enrollment ready for payment plan creation

---

## EPIC 4: Payment Plan Engine

### Story 4.1: Payment Plan Creation

**User Story:**
As an **Agency User**,
I want **to create a payment plan for a student's enrollment**,
So that **I can track the total amount owed, installment schedule, and expected commission**.

**Acceptance Criteria:**
- **Given** I have a student enrolled at a college branch
- **When** I create a payment plan
- **Then** I specify the total amount in the agency's currency
- **And** I select the linked enrollment (student + branch)
- **And** I specify a payment start date
- **And** I can add notes or reference numbers (e.g., invoice #)
- **And** the plan calculates expected commission based on the branch's commission rate
- **And** the plan is saved with status "active"

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Trigger** | - Student enrolled and fees confirmed<br>- Navigates to Payment Plans<br>- Decides to create new plan | - Shows Payment Plans page<br>- Displays existing plans (if any)<br>- Highlights "Create Payment Plan" button | - Navigation menu<br>- Payment Plans page<br>- Create button | Purposeful, entering core workflow | "Where do I start?" | Clear call-to-action, onboarding if first plan |
| **Plan Initialization** | - Clicks "Create Payment Plan"<br>- Views form<br>- Sees enrollment selector | - Opens payment plan creation form<br>- Shows enrollment dropdown<br>- Lists enrollments as "Student Name - College/Branch" | - Create button<br>- Creation form<br>- Enrollment selector | Focused, starting important task | Finding the right enrollment if many exist | Smart search in dropdown, recently used enrollments at top |
| **Enrollment Selection** | - Searches/selects correct enrollment<br>- Confirms student and college/branch shown | - Filters enrollments in real-time<br>- Displays selected enrollment details<br>- Shows student name, college, branch, program | - Enrollment dropdown<br>- Search/filter<br>- Selected enrollment display | Careful, ensuring accuracy | Selecting wrong enrollment | Clear confirmation display, show full details |
| **Amount Entry** | - Enters total amount owed by student<br>- Sees currency symbol (from agency settings) | - Validates numeric input<br>- Formats currency display<br>- Shows currency symbol (AUD, USD, etc.)<br>- Validates positive number | - Total amount field<br>- Currency display<br>- Validation message | Important moment, financial data | Typos, decimal vs whole numbers | Clear formatting, confirm large amounts |
| **Commission Calculation** | - After entering amount<br>- Sees expected commission calculated automatically<br>- Verifies commission makes sense | - Retrieves branch commission rate<br>- Calculates: amount × rate<br>- Displays expected commission prominently<br>- Shows commission rate used | - Expected commission display<br>- Commission rate indicator<br>- Calculation breakdown | Reassured, validated | "Is this calculation correct?" | Show formula, allow hovering to see breakdown |
| **Start Date Setting** | - Selects payment start date<br>- Usually aligns with program start or invoice date | - Shows date picker<br>- Defaults to today or enrollment start date<br>- Validates date (not too far in past) | - Start date picker<br>- Date validation<br>- Calendar UI | Routine, date entry | Calendar navigation if far date | Smart defaults, quick date options (today, next month) |
| **Notes & Reference** | - Adds reference number (invoice #, contract #)<br>- Optionally adds notes<br>- E.g., "As per agreement dated..." | - Accepts free text<br>- Provides notes textarea<br>- Saves reference for searchability | - Reference number field<br>- Notes textarea | Optional, adds context | Not sure what to include | Placeholder examples, explain how this helps searching |
| **Review Before Save** | - Reviews all entered data<br>- Checks: enrollment, amount, commission, date<br>- Ensures accuracy | - Shows summary preview<br>- Highlights key information<br>- Enables Save button<br>- Shows what happens next (installment creation) | - Form summary section<br>- Save button<br>- Next steps indicator | Careful, final check | "Did I miss anything?" | Clear summary, validation checklist |
| **Save & Next Steps** | - Clicks "Save Payment Plan"<br>- Waits for confirmation<br>- Sees plan created | - Saves plan to database with status "active"<br>- Shows success notification<br>- Redirects to plan detail page<br>- Prompts to add installments next | - Save button<br>- Success message<br>- Payment plan detail page<br>- Installment section (empty) | Accomplished, but incomplete | "Now what? How do I set up payments?" | Clear call-to-action: "Add Installments" |

#### Key Insights
- **Critical Moment:** Seeing expected commission calculated correctly
- **Potential Friction:** Understanding what happens after plan creation (installments needed)
- **Success Metric:** Payment plans created without errors, commission calculated correctly
- **Follow-up Action:** Immediately move to installment structure creation

---

### Story 4.2: Flexible Installment Structure

**User Story:**
As an **Agency User**,
I want **to define flexible installment schedules for each payment plan**,
So that **I can accommodate different payment arrangements (monthly, quarterly, custom)**.

**Acceptance Criteria:**
- **Given** I am creating or editing a payment plan
- **When** I define the installment structure
- **Then** I can choose from preset patterns: monthly, quarterly, or custom
- **And** for monthly/quarterly: system auto-generates installments with equal amounts
- **And** for custom: I manually add each installment with amount and due date
- **And** the sum of installment amounts equals the total payment plan amount
- **And** I receive a warning if amounts don't match
- **And** I can edit or delete installments before finalizing the plan

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Entry Point** | - Just created payment plan OR editing existing plan<br>- Needs to set up installments<br>- Sees installment section empty or with existing installments | - Shows installment builder section<br>- Displays preset pattern buttons<br>- Shows custom option<br>- Displays total amount to allocate | - Payment plan detail page<br>- Installment section<br>- Pattern selector buttons<br>- Amount reminder | Ready to structure payments | "What's the best way to split this?" | Helpful guidance, explain common patterns |
| **Pattern Selection** | - Reviews pattern options: Monthly, Quarterly, Custom<br>- Selects Monthly for even monthly payments | - Highlights selected pattern<br>- Shows pattern details/explanation<br>- Enables configuration options | - Pattern buttons<br>- Pattern descriptions<br>- Selected state highlight | Deciding, evaluating | Unsure which pattern fits agreement | Clear examples for each pattern, suggest based on amount/duration |
| **Monthly/Quarterly Setup** | - With Monthly selected<br>- Specifies number of installments (e.g., 12)<br>- OR specifies duration (e.g., 12 months from start date)<br>- Clicks "Generate Installments" | - Shows installment count input<br>- Calculates equal amounts (total / count)<br>- Generates installment schedule<br>- Calculates due dates (monthly intervals from start date)<br>- Shows preview of generated installments | - Installment count input<br>- Generate button<br>- Generated installments preview<br>- Due dates calculated | Efficient, automated | Rounding issues with uneven division | Handle rounding smartly (add remainder to last installment), show preview before confirming |
| **Preview & Adjust** | - Reviews auto-generated installments<br>- Checks amounts and dates<br>- Notices last installment has extra cents (rounding)<br>- Decides to adjust one installment | - Displays installments in table<br>- Shows installment #, amount, due date<br>- Allows inline editing<br>- Validates total still equals plan amount<br>- Shows running total | - Installments table<br>- Inline edit controls<br>- Validation messages<br>- Total amount indicator | Reviewing, fine-tuning | Minor adjustments needed, don't want to start over | Easy inline editing, quick adjustments |
| **Custom Pattern Selection** | - Agreement has irregular payment schedule<br>- Selects Custom pattern<br>- Clicks "Add Installment" multiple times | - Shows empty installment list<br>- Provides "Add Installment" button<br>- Opens installment form for each addition | - Custom pattern button<br>- Add Installment button<br>- Installment forms | Flexible, accommodating reality | Tedious if many installments | Duplicate installment feature, adjust all dates at once |
| **Custom Installment Entry** | - Enters each installment manually<br>- Installment 1: $2000 due March 1<br>- Installment 2: $1500 due May 15<br>- Installment 3: $1500 due August 1<br>- Etc. | - Accepts individual amount and date<br>- Numbers installments sequentially<br>- Shows running total<br>- Validates each entry | - Installment amount fields<br>- Installment date pickers<br>- Running total display<br>- Installment numbers | Detailed, entering specific terms | Time-consuming, error-prone | Copy previous installment, bulk edit features |
| **Total Validation** | - Finishes entering installments<br>- Total is $4900, but plan total is $5000<br>- Sees validation error | - Calculates sum of installment amounts<br>- Compares to plan total<br>- Shows clear error if mismatch<br>- Highlights missing amount<br>- Suggests correction | - Total comparison display<br>- Validation error message<br>- Mismatch highlight<br>- Suggested fix | Frustrated, needs to fix | "Where did I go wrong?" | Clear error, show difference, suggest adding to last installment |
| **Correction** | - Adjusts one installment to fix total<br>- Or adds another installment<br>- Sees validation pass | - Re-validates total<br>- Shows green checkmark when match<br>- Enables save/confirm button | - Validation indicator<br>- Success checkmark<br>- Save button enabled | Relieved, corrected | Tedious to find and fix error | Auto-suggest which installment to adjust |
| **Edit & Delete** | - Needs to remove or change installment<br>- Clicks edit or delete on installment row<br>- Updates information or confirms deletion | - Allows editing any installment<br>- Confirms deletion (warns if deleting breaks total)<br>- Re-validates total after change<br>- Updates installment list | - Edit button<br>- Delete button<br>- Confirmation dialog<br>- Updated installment list | Correcting, refining | Fear of losing work, unsure of impact | Undo feature, clear impact preview before confirming |
| **Finalization** | - Satisfied with installment structure<br>- Clicks "Save Installments" or "Finalize Plan"<br>- Views completed payment plan | - Saves all installments to database<br>- Links to payment plan<br>- Shows success confirmation<br>- Displays complete payment plan with installments<br>- Sets plan status to "active" | - Save/Finalize button<br>- Success message<br>- Complete payment plan view<br>- Installment table | Accomplished, complete | "Can I change this later?" | Reassure editable, show next steps (dashboard, monitoring) |

#### Key Insights
- **Critical Moment:** Seeing auto-generated installments match total correctly
- **Potential Friction:** Total mismatch errors, tedious custom entry
- **Success Metric:** 80% use preset patterns, 20% custom; all plans have valid totals
- **Follow-up Action:** Payment plan fully configured and ready for tracking

---

### Story 4.3: Payment Plan List and Detail Views

**User Story:**
As an **Agency User**,
I want **to view all payment plans and drill into individual plan details**,
So that **I can quickly find plans and see their payment status**.

**Acceptance Criteria:**
- **Given** I am an authenticated Agency User
- **When** I access the payment plans page
- **Then** I see a list of all payment plans in my agency
- **And** each list item shows: student name, college/branch, total amount, number of installments, next due date, overall status
- **And** I can filter by status (active, completed, cancelled)
- **And** I can search by student name or reference number
- **And** I can click a plan to view full details
- **And** the detail page shows: all plan info, student/enrollment details, commission calculation, and list of all installments with their statuses

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Overview Access** | - Navigates to Payment Plans from main menu<br>- Lands on payment plans list page<br>- Scans overview of all plans | - Shows payment plans list page<br>- Displays all agency payment plans<br>- Shows summary statistics at top<br>- Highlights search and filter options | - Navigation menu<br>- Payment Plans page<br>- Plans list/grid<br>- Summary stats<br>- Search/filter bar | Monitoring, assessing | Information overload if many plans | Clear summary metrics, good filtering, visual status indicators |
| **List Scanning** | - Reviews list of payment plans<br>- Looks for key information per plan<br>- Identifies plans needing attention | - Displays compact plan cards/rows<br>- Shows: student name, college/branch, total amount, # installments, next due date, status<br>- Uses color coding for status<br>- Sorts by next due date or relevance | - Plan list items<br>- Status badges<br>- Key information display<br>- Color indicators | Scanning, processing information | Too much or too little detail per row | Optimal information density, clear hierarchy, status visual priority |
| **Filtering** | - Clicks filter dropdown<br>- Selects "Active" plans<br>- Or selects "Overdue" to see problems | - Shows filter options: Active, Completed, Cancelled, Overdue, Due Soon<br>- Applies filter instantly<br>- Updates list<br>- Shows filter applied indicator<br>- Shows count of results | - Filter dropdown<br>- Filter options<br>- Applied filter badge<br>- Result count | Focused, narrowing down | Multiple filters needed at once | Multi-select filters, save filter presets, quick filters |
| **Searching** | - Needs specific plan<br>- Types student name in search<br>- Or enters reference number<br>- Sees filtered results | - Searches across student names and reference numbers<br>- Shows results in real-time<br>- Highlights matching text<br>- Shows "no results" if none match | - Search bar<br>- Search results<br>- Highlighted matches<br>- No results message | Goal-driven, efficient | Slow search, unclear search scope | Fast search, show what matched, search suggestions |
| **Plan Selection** | - Identifies plan of interest<br>- Clicks on plan row/card<br>- Navigates to detail view | - Opens payment plan detail page<br>- Shows loading indicator<br>- Displays full plan information | - Plan list item<br>- Click/touch interaction<br>- Detail page load | Curious, investigating | Slow page load, lost context | Fast navigation, breadcrumbs, back button |
| **Detail View - Overview** | - Reviews plan overview section<br>- Sees student details, college, total amount, commission, dates | - Shows plan header with key info<br>- Displays student name with link to student profile<br>- Shows college/branch with link<br>- Displays total amount and currency<br>- Shows expected vs earned commission<br>- Displays start date and reference number<br>- Shows plan status (active/completed/cancelled) | - Plan detail header<br>- Student link<br>- College link<br>- Commission display<br>- Status badge | Informed, contextual | Too much information at once | Clear sections, progressive disclosure, visual hierarchy |
| **Detail View - Installments** | - Scrolls to installments section<br>- Reviews all installments<br>- Checks which are paid, pending, overdue | - Shows installments table<br>- Displays: installment #, amount, due date, status, paid date, paid amount<br>- Color codes by status: green (paid), yellow (due soon), red (overdue), gray (pending)<br>- Shows visual progress bar | - Installments table<br>- Status indicators<br>- Progress visualization | Monitoring, assessing progress | Hard to see at-a-glance status if many installments | Visual progress bar, summary stats (X of Y paid), status filters |
| **Commission Review** | - Checks commission section<br>- Compares expected vs earned commission<br>- Understands relationship to paid installments | - Shows commission breakdown<br>- Displays expected commission (from plan creation)<br>- Calculates and shows earned commission (based on paid installments)<br>- Shows formula/explanation<br>- Displays outstanding commission | - Commission section<br>- Expected vs earned display<br>- Calculation explanation<br>- Visual comparison | Financially aware, tracking value | Unclear how earned commission is calculated | Clear formula, show which installments counted, visual chart |
| **Enrollment Context** | - Clicks on student or college link<br>- Navigates to related entity<br>- Sees bidirectional relationship | - Links to student detail page showing all their plans<br>- Links to college detail showing all students<br>- Maintains navigation context | - Student link<br>- College link<br>- Breadcrumb trail<br>- Related entity pages | Exploring, understanding relationships | Getting lost in navigation | Clear breadcrumbs, back navigation, context preserved |
| **Actions** | - Sees action buttons: Edit Plan, Record Payment, Cancel Plan<br>- Chooses appropriate action | - Shows contextual action buttons<br>- Enables/disables based on permissions and plan status<br>- Provides clear action labels | - Action buttons<br>- Button states<br>- Permission indicators | Empowered, in control | Unsure which actions are available | Clear, contextual actions, explain why some are disabled |

#### Key Insights
- **Critical Moment:** Quickly finding a plan and seeing its payment status at a glance
- **Potential Friction:** Information overload in list view, unclear commission calculations
- **Success Metric:** Users find and open a specific plan within 15 seconds
- **Follow-up Action:** Users can record payments or edit plans from detail view

---

### Story 4.4: Manual Payment Recording

**User Story:**
As an **Agency User**,
I want **to manually record when an installment is paid**,
So that **I can keep the system up-to-date and track which payments have been received**.

**Acceptance Criteria:**
- **Given** I am viewing a payment plan with pending installments
- **When** I mark an installment as paid
- **Then** I record the payment date and actual amount paid
- **And** the installment status changes to "paid"
- **And** if all installments are paid, the payment plan status changes to "completed"
- **And** I can partially pay an installment (paid_amount < installment amount)
- **And** I can add notes to the payment record
- **And** the dashboard and reports reflect the updated payment status

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Trigger** | - Receives payment from student<br>- Has payment confirmation (bank transfer, receipt)<br>- Navigates to payment plan | - Shows payment plan detail page<br>- Displays installments list<br>- Highlights pending/overdue installments | - Email/bank notification (external)<br>- Payment plan detail page<br>- Installments list | Routine task, needs to be quick | "Which payment plan is this for?" | Payment reference system, quick search by student |
| **Installment Identification** | - Scans installments to find the right one<br>- Checks due date and amount<br>- Confirms it matches payment received | - Shows installments with due dates and amounts<br>- Next due installment may be highlighted<br>- Pending/overdue installments visually distinct | - Installments table<br>- Installment rows<br>- Visual highlights | Careful, matching payment to installment | Multiple pending installments, unclear which one | Auto-suggest next due installment, show expected amount |
| **Record Payment Action** | - Clicks "Mark as Paid" button on installment row<br>- Or clicks "Record Payment" | - Opens payment recording modal/form<br>- Pre-fills installment amount<br>- Pre-fills payment date (today)<br>- Shows notes field | - Mark as Paid button<br>- Payment recording modal<br>- Pre-filled form fields | Focused, entering data | Modal interrupts flow, multiple clicks | Streamlined flow, keyboard shortcuts, quick mode |
| **Payment Date Entry** | - Reviews pre-filled date (today)<br>- Changes if payment was earlier<br>- Selects correct date | - Shows date picker<br>- Defaults to today<br>- Validates date (not in future, not before plan start)<br>- Allows backdating | - Payment date picker<br>- Default date (today)<br>- Date validation | Routine, date entry | Date may have been several days ago | Quick date options (today, yesterday), calendar navigation |
| **Amount Confirmation** | - Reviews pre-filled amount (full installment amount)<br>- Confirms if exact<br>- OR changes if partial payment | - Pre-fills expected installment amount<br>- Allows editing<br>- Validates not negative<br>- Allows partial payments<br>- Shows remaining balance if partial | - Amount field<br>- Pre-filled value<br>- Validation<br>- Remaining balance indicator | Careful with money, accuracy critical | Partial payments create complexity | Clear handling of partial payments, show remaining balance, option to split installment |
| **Partial Payment Handling** | - Enters partial amount (e.g., $500 of $1000)<br>- Sees remaining balance shown<br>- Understands installment partially paid | - Calculates remaining: installment - paid<br>- Shows remaining balance clearly<br>- Keeps installment status as "pending" if partial<br>- OR creates new installment for remainder<br>- Explains what happens next | - Amount field<br>- Remaining balance display<br>- Partial payment explanation<br>- Next steps message | Uncertain about handling | "How do I record the rest later?" "Does this mess up the plan?" | Clear explanation, option to split or keep partial, consistent handling |
| **Notes Addition** | - Optionally adds notes<br>- E.g., "Bank transfer ref: 123456"<br>- Or "Paid by parent" | - Provides notes textarea<br>- Accepts free text<br>- Saves with payment record | - Notes field<br>- Optional indicator<br>- Text area | Adding context, optional | Not sure what to note | Examples of useful notes, suggest adding payment reference |
| **Confirmation Review** | - Reviews all entered data<br>- Date, amount, notes<br>- Ensures accuracy before saving | - Shows summary of entered data<br>- Highlights any issues<br>- Enables Save button<br>- Shows "Cancel" option | - Form summary<br>- Save button<br>- Cancel button<br>- Validation messages | Final check, careful | "Is this right?" moment | Clear summary, show impact (installment will be marked paid) |
| **Save Payment** | - Clicks "Save Payment" or "Record Payment"<br>- Waits for confirmation<br>- Sees result | - Saves payment to database<br>- Updates installment: status, paid_date, paid_amount<br>- Recalculates earned commission<br>- Checks if all installments paid<br>- Updates plan status if all complete<br>- Shows success notification<br>- Closes modal, returns to plan detail | - Save button<br>- Processing indicator<br>- Success notification<br>- Updated installment display<br>- Updated commission display | Accomplished, satisfied | Brief uncertainty during save | Immediate visual feedback, clear success confirmation |
| **Verification** | - Reviews updated installment<br>- Sees status changed to "Paid"<br>- Sees paid date and amount displayed<br>- Checks commission updated | - Installment shows "Paid" status (green)<br>- Displays paid date and paid amount<br>- Updates earned commission display<br>- Updates plan progress bar<br>- If all paid, shows plan "Completed" | - Updated installment row<br>- Status badge (green)<br>- Paid details display<br>- Commission update<br>- Progress bar<br>- Plan status | Validated, confident | None if clear | Celebratory message if plan completed, suggest next action |
| **Dashboard Reflection** | - Returns to dashboard<br>- Sees updated payment statistics<br>- Sees overdue count decreased<br>- Sees earned commission increased | - Dashboard recalculates metrics<br>- Updates pending/overdue counts<br>- Updates earned commission total<br>- Updates cash flow projections<br>- Activity feed shows payment recorded | - Dashboard page<br>- KPI widgets<br>- Activity feed<br>- Cash flow chart | Satisfied, progress visible | Metrics may not update instantly | Real-time or near real-time updates, clear timestamps |

#### Key Insights
- **Critical Moment:** Seeing installment status change to "Paid" immediately after recording
- **Potential Friction:** Partial payments can cause confusion
- **Success Metric:** Average time to record payment under 30 seconds
- **Follow-up Action:** Dashboard metrics updated, commission recalculated

---

### Story 4.5: Commission Calculation Engine

**User Story:**
As an **Agency User**,
I want **commissions to be automatically calculated based on actual payments received**,
So that **I know exactly how much commission I'm entitled to claim from each college**.

**Acceptance Criteria:**
- **Given** a payment plan with installments
- **When** installments are marked as paid
- **Then** the system calculates earned commission based on paid amounts
- **And** earned_commission = (paid_amount / total_amount) * expected_commission
- **And** I can view total earned commission per payment plan
- **And** I can view total earned commission per college/branch
- **And** commission is only counted for installments with status "paid"
- **And** the dashboard shows total outstanding commission across all plans

#### Journey Map

| Phase | User Actions | System Response | Touchpoints | Emotions | Pain Points | Opportunities |
|-------|--------------|-----------------|-------------|----------|-------------|---------------|
| **Awareness** | - Marks installment as paid<br>- Wonders about commission impact<br>- Looks for commission information | - Automatically triggers commission calculation<br>- Updates earned commission in real-time<br>- Displays on payment plan detail page | - Payment recording flow<br>- Payment plan detail page<br>- Commission display section | Curious, financially aware | "Did my commission update?" | Immediate visual feedback, highlight commission change |
| **Plan-Level View** | - Views payment plan detail page<br>- Navigates to commission section<br>- Reviews commission breakdown | - Shows commission section<br>- Displays expected commission (plan total × commission rate)<br>- Displays earned commission (calculated from paid installments)<br>- Shows outstanding commission (expected - earned)<br>- Provides calculation explanation | - Commission section<br>- Expected commission display<br>- Earned commission display<br>- Outstanding commission display<br>- Calculation tooltip | Informed, tracking earnings | Formula may be unclear | Clear formula display, show which installments counted, visual progress bar |
| **Calculation Understanding** | - Hovers over earned commission<br>- Sees formula explanation<br>- Verifies calculation makes sense | - Shows tooltip with formula<br>- earned = (total_paid / total_amount) × expected<br>- Example: ($3000 paid / $5000 total) × $750 expected = $450 earned<br>- Lists which installments counted | - Calculation tooltip<br>- Formula display<br>- Example calculation<br>- Installment reference | Understanding, validating | Math complexity | Simple explanation, visual aids, concrete example |
| **Partial Payments Impact** | - Remembers recording partial payment<br>- Checks if commission reflects partial<br>- Verifies proportional calculation | - Includes partial payments in calculation<br>- earned = (sum of all paid_amounts) / total × expected<br>- Shows clearly that partial counts<br>- Updates in real-time | - Commission calculation<br>- Partial payment inclusion<br>- Real-time update | Reassured, accurate tracking | "Does partial payment count?" | Explicit messaging about partial payment inclusion |
| **Branch-Level View** | - Wants to see total commission per college/branch<br>- Navigates to dashboard or reports<br>- Views commission by branch | - Aggregates commission across all plans for each branch<br>- Shows: expected, earned, outstanding per branch<br>- Allows sorting by branch<br>- Provides drill-down to plans | - Dashboard commission widget<br>- Reports page<br>- Commission by branch table<br>- Drill-down links | Strategic, planning | Difficult to aggregate mentally | Clear branch summary, visual comparison, sortable table |
| **Dashboard Summary** | - Views main dashboard<br>- Sees total outstanding commission metric<br>- Understands agency-wide position | - Calculates total outstanding across all active plans<br>- outstanding = sum of (expected - earned) for all plans<br>- Displays prominently on dashboard<br>- Shows trend vs. previous period | - Dashboard KPI widget<br>- Outstanding commission metric<br>- Trend indicator | High-level awareness, strategic | Single number lacks context | Breakdown available on click, show trend, compare to earned |
| **Commission Report** | - Needs to claim commission from college<br>- Generates commission report for specific branch<br>- Reviews detailed breakdown | - Generates report showing:<br>  - All payment plans for branch<br>  - Total paid by students<br>  - Commission rate<br>  - Earned commission per plan<br>  - Total earned commission<br>- Exportable to PDF/CSV | - Reports page<br>- Commission report<br>- Detailed breakdown<br>- Export options | Professional, preparing documentation | Report format may not match college requirements | Customizable report templates, professional formatting |
| **Verification** | - Manually verifies sample calculation<br>- Checks against own records<br>- Confirms system accuracy | - Transparent calculations<br>- Audit trail of commission changes<br>- Shows historical commission earned<br>- Allows exporting calculation details | - Calculation details<br>- Audit log<br>- Export functionality<br>- Historical view | Diligent, ensuring accuracy | Complex scenarios hard to verify | Show detailed audit trail, step-by-step calculation, export for spreadsheet verification |
| **Claim Preparation** | - Compiles commission data for claim<br>- Exports relevant reports<br>- Submits to college for payment | - Provides all needed data<br>- Professional report format<br>- Includes supporting details<br>- Shows payment evidence | - Commission report (PDF)<br>- Supporting data (CSV)<br>- Payment plan details<br>- Installment records | Confident, ready to claim | Gathering all supporting documents | Single "Claim Package" export with all needed docs |

#### Key Insights
- **Critical Moment:** Seeing earned commission update immediately after recording payment
- **Potential Friction:** Understanding proportional commission calculation
- **Success Metric:** Users understand commission calculations without support
- **Follow-up Action:** Commission data ready for claims and reporting

---

## Summary

This user journey map document covers all user stories from Epic 2 (Agency & User Management), Epic 3 (Core Entity Management), and Epic 4 (Payment Plan Engine). Each journey map provides:

- **User story and acceptance criteria** at the top
- **Detailed phase-by-phase journey** including:
  - User actions at each step
  - System responses
  - Touchpoints (UI elements)
  - User emotions
  - Pain points (friction areas)
  - Opportunities (improvement areas)
- **Key insights** summarizing critical moments, friction points, success metrics, and follow-up actions

These journey maps serve as a foundation for UX design, feature refinement, and user testing throughout the implementation of pleeno.

---

**Next Steps:**
- Create journey maps for remaining epics (5-8) in subsequent iterations
- Use these maps to inform UI/UX design decisions
- Reference during user testing to validate assumptions
- Update based on real user feedback during MVP development
