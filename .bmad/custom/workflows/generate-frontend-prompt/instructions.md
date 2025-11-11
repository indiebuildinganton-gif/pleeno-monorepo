# Generate Frontend Prompt - Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.bmad/custom/workflows/generate-frontend-prompt/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>

<workflow>

<step n="0" goal="Optional brainstorming phase" optional="true">
<ask>Do you want to brainstorm UI/UX ideas for this story first? [y/n]</ask>

<action if="user_response == 'y' or user_response == 'yes'">
Invoke brainstorming workflow to explore creative UI/UX approaches:
- Workflow: {project-root}/.bmad/core/workflows/brainstorming/workflow.yaml
- Context: Help user explore different interaction patterns, UI layouts, and user experience approaches for the story
- Purpose: Generate creative ideas about how users will interact with this feature

The brainstorming output will inform:
- User journey design
- Interaction patterns
- UI component choices
- User experience considerations
</action>

<action if="user_response == 'n' or user_response == 'no'">
Skip brainstorming and proceed directly to story analysis.
</action>
</step>

<step n="1" goal="Gather story context and load PRD">
<action>Request the following information from {user_name}:

1. **Story ID**: The story identifier (e.g., "2.1", "3.2", etc.)
2. **Epic Details**: The epic title and goal that this story belongs to
3. **Story Details**: The complete user story including:
   - User persona (As a...)
   - Desired action (I want to...)
   - Business value (So that...)
   - Acceptance criteria
   - Technical notes (if any)

Ask the user to provide this information by pasting the story details or specifying where to find it.
</action>

<template-output>story_id</template-output>
<template-output>epic_title</template-output>
<template-output>epic_goal</template-output>
<template-output>user_story</template-output>
<template-output>acceptance_criteria</template-output>
<template-output>technical_notes</template-output>

<action>Search for and load the PRD document for background context:

1. Try to find PRD using pattern: {output_folder}/*prd*.md
2. If found, load the PRD to understand:
   - Overall product vision
   - Target users and personas
   - Core features and functionality
   - Any design principles or constraints

3. If PRD not found, continue without it but note this in the output
</action>

<template-output>prd_context</template-output>
</step>

<step n="2" goal="Analyze user journey and identify persona">
<action>Based on the story details and PRD context, deeply analyze the user journey:

**Identify the User Persona:**
- Who is performing this action? (from "As a..." statement)
- What is their role and context?
- What are their goals and motivations?
- What is their technical skill level?

**Map the Complete User Flow:**

1. **Before State (Setup)**:
   - Where does the user start? (which page/screen)
   - What prerequisites must be met?
   - What data/context do they have?

2. **During State (Interaction)**:
   - Step-by-step flow of what the user does
   - Every screen/page they see
   - Every decision point
   - Every input they provide

3. **After State (Outcome)**:
   - What success looks like
   - What confirmation they receive
   - Where they go next
   - What changed in the system

**Edge Cases & Error States:**
- What can go wrong?
- How should errors be handled?
- What validation failures might occur?
- What alternate paths exist?

Provide a comprehensive user journey narrative that tells the story of the user's experience from start to finish.
</action>

<template-output>user_persona</template-output>
<template-output>user_journey_before</template-output>
<template-output>user_journey_during</template-output>
<template-output>user_journey_after</template-output>
<template-output>edge_cases</template-output>
</step>

<step n="3" goal="Define UI components and input fields">
<action>Based on the user journey and acceptance criteria, identify all UI components and inputs needed:

**For Each Screen/View in the Journey:**

1. **Page/Screen Identity:**
   - Page title and URL/route
   - Main purpose of this screen
   - Navigation context (how user got here)

2. **Input Fields & Form Elements:**
   For each input field, specify:
   - Field label and placeholder text
   - Input type (text, email, select, checkbox, radio, etc.)
   - Default value (if any)
   - Required vs optional
   - Validation rules:
     - Format requirements
     - Min/max length or value
     - Pattern matching
     - Custom validation logic
   - Error messages for each validation failure
   - Help text or tooltips

3. **Display-Only Components:**
   - Read-only data being shown
   - Computed/calculated values
   - Status indicators
   - Feedback messages

4. **Interactive Components:**
   - Buttons (primary, secondary, cancel, etc.)
   - Links
   - Toggles/switches
   - File uploads
   - Drag-and-drop areas
   - Any other interactive elements

5. **Component States:**
   For each component, define states:
   - Default/empty state
   - Focused state
   - Filled/active state
   - Disabled state
   - Loading state
   - Error state
   - Success state

Create a comprehensive inventory of every UI element the user will interact with or see.
</action>

<template-output>screens_list</template-output>
<template-output>input_fields_inventory</template-output>
<template-output>display_components</template-output>
<template-output>interactive_components</template-output>
<template-output>component_states</template-output>
</step>

<step n="4" goal="Map all interactions and events">
<action>For every interactive element identified in Step 3, define exactly what happens when the user interacts with it:

**For Each Button/Action:**
- Button label/text
- Visual appearance (primary, secondary, danger, etc.)
- When it's enabled vs disabled
- **On Click:**
  - Immediate UI feedback (loading spinner, disabled state, etc.)
  - Data validation checks performed
  - API calls made (if any)
  - Navigation that occurs
  - State changes in the UI
  - Success feedback shown
  - Error handling behavior

**For Each Form Field:**
- **On Focus:** What happens when user clicks into the field
- **On Input/Change:** Real-time validation or feedback
- **On Blur:** When user leaves the field, what validation occurs
- **On Error:** How errors are displayed and cleared

**For Each Link:**
- Where it navigates to
- What context is passed
- Whether it opens in new tab/window

**State Management:**
- What application state changes occur
- What gets persisted (local storage, database, etc.)
- What triggers re-renders or updates

**User Feedback:**
- Toast notifications/alerts
- Success messages
- Error messages
- Loading indicators
- Progress indicators

**Example Format:**
```
Component: "Save Agency Settings" button
- Enabled when: Form is valid and has unsaved changes
- Disabled when: Form is invalid or no changes made
- On Click:
  1. Show loading spinner on button
  2. Disable all form fields
  3. Validate all fields client-side
  4. If validation passes:
     - Send PATCH request to /api/agencies/[id]
     - Show loading state (2-3 seconds)
  5. On Success:
     - Show green toast: "Agency settings saved successfully"
     - Update header with new agency name
     - Re-enable form fields
     - Clear dirty state
  6. On Error:
     - Show red toast: "Failed to save settings. Please try again."
     - Re-enable form fields
     - Keep changes in form
```

Create this level of detail for EVERY interactive element.
</action>

<template-output>button_interactions</template-output>
<template-output>field_interactions</template-output>
<template-output>navigation_flows</template-output>
<template-output>state_changes</template-output>
<template-output>feedback_mechanisms</template-output>
</step>

<step n="5" goal="Generate comprehensive v0.dev prompt">
<action>Now assemble all the information gathered in steps 1-4 into a comprehensive, well-structured prompt for v0.dev or similar frontend AI generators.

The prompt should be written in natural language but be extremely detailed and specific. Include:

**1. Context Section:**
- Story ID and epic context
- User persona and their goal
- Why this feature matters (business value)
- Reference to PRD context (if available)

**2. User Journey Simulation:**
- Complete narrative walkthrough
- Before/during/after states
- Step-by-step user actions

**3. UI Specifications:**
- All screens/pages needed
- Complete list of input fields with validation
- All buttons and interactive elements
- Component states and variations

**4. Interaction Specifications:**
- Detailed behavior for every button click
- Form validation logic
- Error handling and user feedback
- State management requirements

**5. Visual & UX Guidelines:**
- Layout suggestions (without being prescriptive about tech)
- User feedback patterns (toasts, inline errors, etc.)
- Accessibility considerations
- Responsive behavior expectations

**6. Data & API Expectations:**
- What data needs to be displayed
- What data needs to be collected
- What API endpoints are expected (from technical notes)
- Data validation requirements

**7. Edge Cases & Error Scenarios:**
- All error conditions to handle
- Validation failure messages
- Network error handling
- Empty states

**Tone & Style:**
- Write as if you're briefing a senior frontend developer
- Be specific and prescriptive about behavior
- Include examples where helpful
- Focus on "what" not "how" (no tech stack requirements)
- Make it easy to paste directly into v0.dev

Format the prompt as a clear, well-organized document that v0.dev can use to generate a comprehensive mockup prototype.
</action>

<template-output>frontend_prompt</template-output>

<action>Save the completed prompt to: {output_folder}/frontend-prompt-{story_id}.md</action>
</step>

<step n="6" goal="Review and refine" repeat="until-approved">
<action>Present the generated frontend prompt to {user_name} for review.</action>

<ask>Review the generated prompt above. Would you like to:
1. Approve and finish
2. Refine a specific section
3. Add more detail to something
4. Regenerate completely

Enter your choice (1-4):
</ask>

<check if="choice == 1">
<action>Mark the prompt as approved and complete the workflow</action>
<template-output>final_prompt_approved</template-output>
</check>

<check if="choice == 2 or choice == 3">
<ask>Which section would you like to refine or add detail to?</ask>
<action>Work with {user_name} to refine the specified section</action>
<action>Update the frontend_prompt with the refined content</action>
<action>Save the updated prompt to the output file</action>
</check>

<check if="choice == 4">
<ask>What aspects should be changed in the regeneration?</ask>
<action>Regenerate the prompt based on feedback</action>
<action>Save the regenerated prompt to the output file</action>
</check>
</step>

<step n="7" goal="Finalize and summarize">
<action>Provide {user_name} with a completion summary in {communication_language}:

- Story ID processed: {story_id}
- Output file location: {output_folder}/frontend-prompt-{story_id}.md
- Next steps:
  1. Copy the prompt from the generated file
  2. Paste it into v0.dev or your preferred frontend AI tool
  3. Review and iterate on the generated mockup
  4. Use the mockup as a reference for implementation

The generated prompt includes:
- Complete user journey simulation
- All UI components and interactions
- Detailed event handling specifications
- Edge cases and error handling
- Ready to use with v0.dev
</action>

<critical>Workflow complete! The comprehensive frontend prompt is ready to use.</critical>
</step>

</workflow>
