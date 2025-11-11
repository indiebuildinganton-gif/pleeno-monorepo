# Frontend Prompt Validation Checklist

## Story Context Completeness

- [ ] Story ID is clearly specified (e.g., "2.1", "3.4")
- [ ] Epic title and goal are included
- [ ] User story follows "As a... I want... So that..." format
- [ ] All acceptance criteria from original story are captured
- [ ] Technical notes are included (if provided)
- [ ] PRD context is loaded and summarized (or noted as unavailable)

## User Journey Quality

- [ ] User persona is clearly defined with role and context
- [ ] Before state clearly explains where user starts and prerequisites
- [ ] During state provides step-by-step walkthrough of all user actions
- [ ] After state describes success outcome and what changed
- [ ] At least 3-5 edge cases or error scenarios are identified
- [ ] User journey tells a complete narrative from start to finish
- [ ] Journey aligns with acceptance criteria

## UI Component Specifications

- [ ] All screens/pages in the journey are listed and named
- [ ] Every input field has: label, type, validation rules, error messages
- [ ] Required vs optional fields are clearly marked
- [ ] Display-only components are identified and described
- [ ] All interactive elements (buttons, links, etc.) are inventoried
- [ ] Component states defined: default, focused, filled, disabled, loading, error, success
- [ ] No placeholder values remain (all fields fully specified)

## Interaction & Event Specifications

- [ ] Every button has defined click behavior with specific outcomes
- [ ] Form field interactions specify: onFocus, onChange, onBlur behaviors
- [ ] All validation logic is clearly specified (format, length, pattern)
- [ ] Navigation flows are complete (where user goes next)
- [ ] State changes are explicit (what updates in UI and data)
- [ ] User feedback mechanisms are defined for all actions (success, error, loading)
- [ ] Error messages are specific and user-friendly
- [ ] Loading states and indicators are specified

## Frontend Prompt Completeness

- [ ] Prompt has clear context section with story and business value
- [ ] Complete user journey simulation is included in narrative form
- [ ] All UI specifications are comprehensively detailed
- [ ] All interaction specifications include exact behaviors
- [ ] Visual and UX guidelines are provided (layout, feedback patterns)
- [ ] Data and API expectations are clearly stated
- [ ] Edge cases and error handling are explicitly covered
- [ ] Prompt is written in natural language suitable for v0.dev
- [ ] Prompt is self-contained and doesn't require external context
- [ ] Prompt focuses on "what" not "how" (no tech stack specifics)

## Technical Accuracy

- [ ] Validation rules are realistic and implementable
- [ ] API endpoints align with technical notes (if provided)
- [ ] Data requirements match acceptance criteria
- [ ] Error scenarios are comprehensive and realistic
- [ ] State management requirements are clearly specified
- [ ] No contradictions between different sections

## Usability & Clarity

- [ ] Prompt is well-organized with clear section headers
- [ ] Language is clear and specific (no vague descriptions)
- [ ] Examples are provided where helpful
- [ ] Prompt can be understood by someone unfamiliar with the project
- [ ] Copy-paste ready for v0.dev or similar tools
- [ ] All template variables are properly replaced (no {{placeholders}} remain)

## Alignment with Acceptance Criteria

- [ ] Every acceptance criterion has corresponding UI/interaction specification
- [ ] Success states match "Then" statements in acceptance criteria
- [ ] Prerequisites are reflected in journey "before state"
- [ ] All "And" conditions in acceptance criteria are addressed
- [ ] Technical notes constraints are incorporated into specifications

## Final Validation

- [ ] Story Context
  - Issues:
- [ ] User Journey
  - Issues:
- [ ] UI Components
  - Issues:
- [ ] Interactions & Events
  - Issues:
- [ ] Frontend Prompt
  - Issues:
- [ ] Technical Accuracy
  - Issues:
- [ ] Usability & Clarity
  - Issues:
- [ ] Acceptance Criteria Alignment
  - Issues:

**Ready for v0.dev:** [ ] Yes / [ ] No (address issues above)
