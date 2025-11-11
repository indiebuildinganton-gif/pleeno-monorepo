# Generate Frontend Prompt Workflow

## Purpose

This workflow generates comprehensive, detailed frontend implementation prompts for AI code generators like v0.dev. It takes an epic story as input and produces a complete user journey simulation with all UI components, interactions, events, and behaviors fully specified.

## What It Creates

A detailed prompt document that includes:
- Complete user journey narrative (before/during/after states)
- Full UI component specifications with validation rules
- Detailed interaction and event handling specifications
- Edge cases and error scenarios
- Ready-to-use prompt for v0.dev or similar tools

## How to Use

### Invocation

Run the workflow using any of these methods:

```bash
# Via slash command
/generate-frontend-prompt

# Via workflow command
workflow generate-frontend-prompt
```

### Required Inputs

When prompted, provide:

1. **Story ID**: The story identifier (e.g., "2.1", "3.4")
2. **Epic Details**: Epic title and goal
3. **Story Details**: Complete user story with:
   - User persona (As a...)
   - Desired action (I want to...)
   - Business value (So that...)
   - Acceptance criteria
   - Technical notes (if any)

### Optional Inputs

The workflow will automatically attempt to load:
- **PRD document**: For product context (optional but recommended)
- **Epics document**: For additional context (optional)

### Workflow Steps

1. **Optional Brainstorming**: Explore UI/UX ideas (can be skipped)
2. **Gather Story Context**: Provide story details, load PRD
3. **Analyze User Journey**: Map complete user flow with persona
4. **Define UI Components**: Specify all inputs, fields, and components
5. **Map Interactions**: Detail every button click, field interaction, event
6. **Generate Prompt**: Assemble comprehensive v0.dev-ready prompt
7. **Review & Refine**: Review and iterate until satisfied

## Output

**File**: `docs/frontend-prompt-{story-id}.md`

**Contents**:
- Story context and epic goal
- User persona and complete journey
- UI component specifications
- Interaction and event specifications
- Comprehensive v0.dev prompt (copy-paste ready)

## Example Usage

```
Story ID: 2.1
Epic: Agency & User Management
Story: Agency Profile Setup

Output: docs/frontend-prompt-2.1.md
```

The generated prompt includes everything needed to create a functional mockup:
- All form fields with validation
- All buttons with click behaviors
- Error handling and user feedback
- State management requirements
- Success and edge case scenarios

## Next Steps After Generation

1. Open the generated file: `docs/frontend-prompt-{story-id}.md`
2. Copy the "Complete Frontend Prompt" section
3. Paste into v0.dev or your preferred frontend AI tool
4. Review the generated mockup
5. Iterate as needed
6. Use as reference for implementation

## Features

- **Intent-based workflow**: Adapts to your story complexity
- **Comprehensive coverage**: Nothing is left unspecified
- **v0.dev optimized**: Prompts designed for AI code generators
- **PRD integration**: Automatically loads context when available
- **Iterative refinement**: Review and refine until perfect
- **Copy-paste ready**: Output is immediately usable

## Requirements

- Story must include acceptance criteria
- User persona should be clear (As a...)
- Business value should be specified (So that...)

## Tips for Best Results

1. **Be detailed in acceptance criteria**: More details = better prompts
2. **Include technical notes**: API endpoints, validation rules, etc.
3. **Reference PRD**: Provides valuable context for better results
4. **Review carefully**: The generated prompt drives the mockup quality
5. **Iterate**: Use the refinement step to perfect the prompt

## Validation

The workflow includes a comprehensive validation checklist covering:
- Story context completeness
- User journey quality
- UI component specifications
- Interaction specifications
- Frontend prompt completeness
- Technical accuracy
- Alignment with acceptance criteria

## Author

anton

## Version

BMAD v6 Compatible
