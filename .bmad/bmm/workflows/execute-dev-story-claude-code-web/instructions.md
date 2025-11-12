# Execute Dev Story in Claude Code Web - Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmm/workflows/execute-dev-story-claude-code-web/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>

<workflow>

<step n="1" goal="Load Story Context">
  <action if="story_context_path is empty or not provided">Ask user: "Please provide the path to the story context XML file you want to execute.

Example: docs/stories/1-1-project-initialization-development-environment.context.xml

Enter the file path:"</action>

  <action if="story_context_path is empty or not provided">Store the user's response as {{story_context_path}}</action>

  <action if="story_context_path was provided from slash command">Confirm with user: "Using story context file: {{story_context_path}}"</action>
  <action>Load and read the complete story context XML file from {{story_context_path}}</action>
  <action>Parse and extract the following from the XML:
    - Story metadata (epicId, storyId, title, status)
    - Story user story (asA, iWant, soThat)
    - All tasks with their subtasks and checkboxes
    - Acceptance criteria
    - Constraints
    - Interfaces
    - Dependencies
    - Artifacts (docs, code references)
  </action>

  <action>Generate {{story_id}} from the epicId and storyId (format: "{epicId}-{storyId}")</action>
  <action>Store {{story_title}} from the title field</action>
  <action>Count total number of tasks and store as {{total_tasks}}</action>

  <action>Confirm with user: "Loaded story {{story_id}}: {{story_title}} with {{total_tasks}} tasks. Ready to generate prompts?"</action>
</step>

<step n="2" goal="Create Output Directory Structure">
  <action>Create directory: {output_folder}/stories/prompts/{{story_id}}/</action>
  <action>Verify directory was created successfully</action>
  <action>Store the output path as {{prompts_output_path}} = {output_folder}/stories/prompts/{{story_id}}/</action>
</step>

<step n="3" goal="Generate Task 1 Prompt (Special - Creates Manifest)">
  <action>Extract Task 1 details from the parsed story context:
    - Task number and title
    - All subtasks and checkboxes
    - Related acceptance criteria
    - Relevant constraints
    - Related interfaces
    - Related dependencies
  </action>

  <action>Generate a comprehensive development prompt for Task 1 that includes:

    1. **Header Section**:
       - Story ID and Title
       - Task number and description
       - User story context (As a, I want, So that)

    2. **Task Details**:
       - Complete task description
       - All subtasks with checkboxes (formatted as checklist)
       - Relevant acceptance criteria references

    3. **Context Section**:
       - Key constraints that apply to this task
       - Relevant interfaces to implement
       - Dependencies to consider
       - Links to artifact documents

    4. **Manifest Instructions** (CRITICAL - only in Task 1):
       - Instruction to create a manifest file at {{prompts_output_path}}manifest.md
       - Manifest structure template:
         ```markdown
         # Story {{story_id}} Implementation Manifest

         **Story**: {{story_title}}
         **Status**: In Progress
         **Started**: [Date]

         ## Task Progress

         ### Task 1: [Title]
         - Status: In Progress
         - Started: [Date]
         - Completed:
         - Notes:

         ### Task 2: [Title]
         - Status: Not Started
         - Started:
         - Completed:
         - Notes:

         [Continue for all tasks...]

         ## Implementation Notes

         [Add notes as you progress]
         ```
       - Instruction to update Task 1 status when complete

    5. **Next Steps**:
       - What to do after completing this task
       - How to update the manifest
       - Reference to next prompt file
  </action>

  <action>Save the generated prompt to: {{prompts_output_path}}task-1-prompt.md</action>
  <action>Confirm: "Generated task-1-prompt.md with manifest creation instructions"</action>
</step>

<step n="4" goal="Generate Remaining Task Prompts">
  <action>For each remaining task (Task 2 through Task {{total_tasks}}):

    1. Extract task details from parsed story context
    2. Generate development prompt that includes:

       **Header Section**:
       - Story ID and Title
       - Task number and description
       - Reference to previous task completion

       **Task Details**:
       - Complete task description
       - All subtasks with checkboxes
       - Relevant acceptance criteria

       **Context Section**:
       - Key constraints
       - Relevant interfaces
       - Dependencies
       - Links to artifacts

       **Manifest Update Instructions**:
       - Read current manifest at {{prompts_output_path}}manifest.md
       - Update previous task status to "Completed" with date
       - Update current task status to "In Progress" with date
       - Add any implementation notes from previous task

       **Implementation Notes**:
       - What was completed in previous task(s)
       - How this task builds on previous work
       - Dependencies on previous implementations

       **Next Steps**:
       - What to do after completing this task
       - How to update the manifest
       - Reference to next prompt file (if not last task)

    3. Save to: {{prompts_output_path}}task-{n}-prompt.md
  </action>

  <action>After generating all prompts, confirm: "Generated prompts for tasks 2-{{total_tasks}}"</action>
</step>

<step n="5" goal="Generate Summary and Next Steps">
  <action>Create a summary document that includes:

    1. **Overview**:
       - Story ID and title
       - Total number of tasks
       - Location of generated prompts

    2. **Generated Files**:
       - List all prompt files (task-1-prompt.md through task-{{total_tasks}}-prompt.md)
       - Path to each file

    3. **Usage Instructions**:
       - Step 1: Open Claude Code Web
       - Step 2: Copy contents of task-1-prompt.md
       - Step 3: Paste into Claude Code Web and execute
       - Step 4: Verify manifest.md was created
       - Step 5: When Task 1 complete, move to task-2-prompt.md
       - Step 6: Repeat for each task sequentially

    4. **Manifest Tracking**:
       - Location of manifest file (will be created by Task 1)
       - How to track progress through the manifest
       - Importance of updating manifest after each task

    5. **Tips**:
       - Execute tasks in order (dependencies matter)
       - Update manifest after each task completion
       - Reference story context file if needed: {{story_context_path}}
       - All acceptance criteria are tracked in prompts
  </action>

  <action>Save summary to: {{prompts_output_path}}README.md</action>

  <action>Display final summary to user in {communication_language}:

    "✅ Successfully generated {{total_tasks}} task prompts for Story {{story_id}}!

    📁 Location: {{prompts_output_path}}

    📄 Files created:
    - task-1-prompt.md (includes manifest creation)
    - task-2-prompt.md through task-{{total_tasks}}-prompt.md
    - README.md (usage instructions)

    🚀 Next steps:
    1. Open Claude Code Web
    2. Start with task-1-prompt.md
    3. Copy/paste into Claude Code Web
    4. Follow the prompts sequentially
    5. Track progress in manifest.md (created by Task 1)

    Good luck with your implementation, {user_name}!"
  </action>
</step>

</workflow>