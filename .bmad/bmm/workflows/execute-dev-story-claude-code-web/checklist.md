# Execute Dev Story Workflow - Validation Checklist

## Story Context Loading

- [ ] Story context XML file was successfully loaded
- [ ] Story ID (epicId-storyId format) was correctly extracted
- [ ] Story title was correctly extracted
- [ ] All tasks were parsed from the XML
- [ ] Task count matches the actual number of tasks in the story
- [ ] Acceptance criteria were extracted
- [ ] Constraints were extracted
- [ ] Dependencies were identified

## Directory Structure

- [ ] Output directory created at `{output_folder}/stories/prompts/{story_id}/`
- [ ] Directory path is correct and accessible
- [ ] No errors during directory creation

## Task 1 Prompt Generation

- [ ] Task 1 prompt file created: `task-1-prompt.md`
- [ ] Header section includes story ID and title
- [ ] Task description is complete and accurate
- [ ] All subtasks and checkboxes are included
- [ ] Relevant acceptance criteria are referenced
- [ ] Constraints applicable to Task 1 are included
- [ ] Relevant interfaces are documented
- [ ] Dependencies are listed
- [ ] Manifest creation instructions are present and clear
- [ ] Manifest template structure is complete with all tasks listed
- [ ] Next steps section is clear

## Remaining Task Prompts Generation

- [ ] All task prompts generated (task-2 through task-N)
- [ ] Each prompt has correct task number and title
- [ ] Each prompt includes complete task details
- [ ] All subtasks and checkboxes are present in each prompt
- [ ] Manifest update instructions are in every prompt (except Task 1)
- [ ] Each prompt references previous task completion
- [ ] Dependencies on previous tasks are clearly stated
- [ ] Next steps are included in each prompt
- [ ] File naming is sequential and correct (task-1, task-2, etc.)

## Summary and Documentation

- [ ] README.md created in the prompts folder
- [ ] README includes overview of story and task count
- [ ] All generated files are listed in README
- [ ] Usage instructions are clear and step-by-step
- [ ] Manifest tracking explanation is included
- [ ] Tips section provides helpful guidance
- [ ] File paths are correct in documentation

## Content Quality

- [ ] All prompts use clear, actionable language
- [ ] Technical terms are used correctly
- [ ] Context from story XML is accurately represented
- [ ] No placeholders or incomplete sections remain
- [ ] Formatting is consistent across all prompts
- [ ] Markdown formatting is valid
- [ ] Code blocks and lists are properly formatted

## Completeness

- [ ] No tasks from the story were skipped
- [ ] All acceptance criteria are covered across prompts
- [ ] All constraints are referenced where applicable
- [ ] All interfaces are documented where relevant
- [ ] All dependencies are tracked
- [ ] Artifact references (docs, code) are included

## Workflow Execution

- [ ] No errors occurred during workflow execution
- [ ] User was prompted at appropriate decision points
- [ ] Confirmations were displayed at key milestones
- [ ] Final summary was displayed to user
- [ ] User knows where to find the generated files
- [ ] User understands next steps

## Final Validation

**Issues Found:**

- [ ] No critical issues found
- [ ] List any issues that need resolution:

**Ready for Use:**

- [ ] All prompts are ready to copy-paste into Claude Code Web
- [ ] Workflow output meets all requirements
- [ ] User can proceed with story implementation