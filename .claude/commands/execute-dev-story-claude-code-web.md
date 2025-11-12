---
description: Generate task-specific development prompts from story context files for sequential execution in Claude Code Web with manifest tracking
---

You are executing the **Execute Dev Story in Claude Code Web** workflow.

**Critical Instructions:**

1. Load and execute the workflow at: `{project-root}/bmad/bmm/workflows/execute-dev-story-claude-code-web/workflow.yaml`

2. Use the SlashCommand tool to invoke the workflow task executor:
   - Call the workflow execution engine
   - Pass the workflow configuration path

3. The workflow will:
   - Ask for the story context XML file path (or use the argument if provided)
   - Parse the story tasks
   - Generate individual prompt files for each task
   - Create a manifest tracking file
   - Save all files to `{output_folder}/stories/prompts/{story_id}/`

4. If the user provided an argument (e.g., `/execute-dev-story-claude-code-web docs/stories/1-1-story.context.xml`):
   - Use that file path automatically
   - Skip asking for the file path

5. After workflow completion, remind the user:
   - Location of generated prompt files
   - Next steps: Copy-paste prompts into Claude Code Web sequentially
   - Manifest file will track progress

**Execute the workflow now using the appropriate task invocation method.**