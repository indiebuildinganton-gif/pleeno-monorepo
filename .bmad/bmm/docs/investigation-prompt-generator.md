# Story Implementation Investigation Prompt Generator

## Purpose
Generate a comprehensive investigation prompt to send to Claude Code Web to analyze what has actually been implemented in the codebase for a given story, regardless of what the MANIFEST claims.

## How to Use This Tool

1. **Choose a story** you want to investigate (e.g., "2-4", "4-3", "5-2")
2. **Copy the template below** and replace `1-2` with your story ID
3. **Send the entire prompt** to Claude Code Web
4. **Review the findings** and update the MANIFEST accordingly

---

## Investigation Prompt Template

```markdown
# CRITICAL INVESTIGATION: Story 1-2 Implementation Status

## Your Mission
You are a forensic code analyst. I need you to **investigate what has actually been implemented in the codebase** for Story 1-2, regardless of what the MANIFEST.md claims.

**DO NOT TRUST THE MANIFEST** - It may be outdated, incomplete, or inaccurate. Your job is to find the ground truth by examining the actual codebase.

## Investigation Protocol

### Phase 1: Locate Story Documentation
1. Find the story file: `.bmad-ephemeral/stories/1-2-*.md`
2. Find the MANIFEST: `.bmad-ephemeral/stories/prompts/1-2/MANIFEST.md`
3. Find the context XML: `.bmad-ephemeral/stories/1-2-*.context.xml`
4. Read and understand:
   - Acceptance Criteria (AC)
   - Expected deliverables from each task
   - File paths that should have been created/modified

### Phase 2: Search for Implemented Files
For each task in the MANIFEST, search for evidence of implementation:

#### Database Migrations
- Search for migration files in: `supabase/migrations/`
- Look for patterns: `*{story_number}*.sql`, `*{feature_name}*.sql`
- Check migration naming conventions used in the project

#### API Routes
- Search in: `apps/*/app/api/`
- Look for route handlers matching story requirements
- Verify HTTP methods (GET, POST, PATCH, DELETE)
- Check for proper authentication and RLS enforcement

#### React Components
- Search in: `apps/*/app/components/`, `apps/*/app/*/components/`, `packages/ui/src/components/`
- Look for component names mentioned in tasks
- Check for both `.tsx` and `.jsx` files
- Verify client components have 'use client' directive

#### Utility Functions
- Search in: `packages/utils/src/`, `packages/database/src/`, `packages/validations/src/`
- Look for helper functions, formatters, calculators
- Check for proper exports in `index.ts` files

#### Types & Schemas
- Search in: `packages/validations/src/`, `apps/*/app/types/`
- Look for Zod schemas, TypeScript interfaces
- Verify schema validations match requirements

#### Tests
- Search in: `__tests__/`, `**/__tests__/`, `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`
- Check for unit tests, integration tests, E2E tests
- Verify test coverage for implemented features

### Phase 3: Verify Implementation Completeness
For each file found, check:

1. **Does it actually work?**
   - Are there TODOs or placeholder comments?
   - Are there syntax errors or incomplete functions?
   - Does it import all required dependencies?

2. **Does it meet the AC?**
   - Compare implementation against acceptance criteria
   - Check for edge cases and error handling
   - Verify all required fields/features are present

3. **Is it integrated?**
   - Is the component actually used in a page?
   - Is the API route actually called by the frontend?
   - Are utility functions actually imported and used?

4. **Is there test coverage?**
   - Are there corresponding test files?
   - Do tests actually validate the AC?
   - Are tests passing (check for `.skip` or `xit`)?

### Phase 4: Search for Related Code
Sometimes implementations use different names than expected. Search for:

- Similar feature names (e.g., "overdue" vs "late payment")
- Alternative file paths (different app zones)
- Partial implementations (started but not finished)
- Refactored code (old task approach replaced with new approach)

Use broad searches like:
- `grep -r "keyword" apps/`
- `glob **/feature-name*`
- Search for related database table names
- Search for related type definitions

### Phase 5: Generate Investigation Report

Create a detailed report with the following structure:

---

## INVESTIGATION REPORT: Story 1-2

**Investigation Date**: {current_date}
**Investigator**: Claude Code Web
**Story Title**: {story_title}

### Executive Summary
- Overall Implementation Status: [Not Started / Partially Complete / Mostly Complete / Fully Complete]
- Confidence Level: [Low / Medium / High]
- MANIFEST Accuracy: [Accurate / Partially Accurate / Inaccurate]

### Detailed Findings

#### Task 1: {task_name}
**MANIFEST Claims**: [status from MANIFEST]
**Actual Status**: [your findings]
**Evidence**:
- Files Found:
  - ✅ `path/to/file.ts` (exists, complete)
  - ⚠️ `path/to/file2.ts` (exists, incomplete - has TODOs)
  - ❌ `path/to/file3.ts` (claimed but not found)
- Integration Status: [integrated / standalone / not integrated]
- Test Coverage: [tested / partially tested / not tested]
**Acceptance Criteria Coverage**:
- AC #1: ✅ / ⚠️ / ❌
- AC #2: ✅ / ⚠️ / ❌

[Repeat for each task]

### Missing Implementations
List all expected files/features that are NOT found:
- [ ] Expected file: `path/to/missing.ts`
- [ ] Expected component: `ComponentName`
- [ ] Expected API route: `POST /api/path`

### Unexpected Implementations
List any implementations found that are NOT in the MANIFEST:
- [x] Found file: `path/to/unexpected.ts` (what is this for?)
- [x] Found component: `UnexpectedComponent` (related to this story?)

### Incomplete Implementations
List files that exist but are not complete:
- ⚠️ `path/to/incomplete.ts` - Has TODO comments, missing error handling
- ⚠️ `ComponentName.tsx` - Only renders loading state, no actual data

### Test Coverage Analysis
- Unit Tests: X / Y tasks have tests
- Integration Tests: X / Y features have tests
- E2E Tests: X / Y user flows have tests
- Overall Coverage: X%

### MANIFEST Discrepancies
List specific discrepancies between MANIFEST and reality:
1. MANIFEST claims Task 3 is complete, but files don't exist
2. MANIFEST says Task 5 is not started, but full implementation found
3. MANIFEST shows wrong file paths (expected X, found Y)

### Recommendations

#### Update MANIFEST
- [ ] Mark Task X as incomplete (files missing)
- [ ] Mark Task Y as complete (verified implementation)
- [ ] Update Task Z file paths (actual locations differ)

#### Complete Missing Work
- [ ] Task X needs: {specific files/features}
- [ ] Task Y needs: {specific integration points}
- [ ] Task Z needs: {test coverage}

#### Next Steps Priority
1. **Highest Priority**: {what to do first}
2. **Medium Priority**: {what to do next}
3. **Low Priority**: {what to do later}

### Code Quality Observations
- Architecture: {does it follow project patterns?}
- Error Handling: {adequate / needs improvement}
- Type Safety: {strong / weak}
- Documentation: {good / needs improvement}

---

## Investigation Commands Used
Document all searches/commands you used:
```bash
grep -r "search_term" apps/
glob "**/pattern*.tsx"
# etc.
```

---

## CRITICAL QUESTIONS FOR USER

Based on your investigation, ask the user:

1. **Clarification Questions**:
   - "I found X but not Y - was this intentionally skipped?"
   - "Component Z exists but isn't used - is this work in progress?"

2. **Decision Questions**:
   - "Should I mark Task N as complete even though tests are missing?"
   - "Should I update MANIFEST to reflect actual implementation?"

3. **Next Action Questions**:
   - "What task should be implemented next based on your findings?"
   - "Should I fix incomplete Task X or start new Task Y?"

---

## FINAL DELIVERABLE

Provide:
1. **Updated MANIFEST.md** with accurate task statuses
2. **Gap Analysis** document listing missing work
3. **Next Steps** recommendation with specific tasks

```

---

## Example Usage

To investigate Story 2-4 (User Profile Management), send this to Claude Code Web:

```markdown
# CRITICAL INVESTIGATION: Story 2-4 Implementation Status

## Your Mission
You are a forensic code analyst. I need you to **investigate what has actually been implemented in the codebase** for Story 2-4, regardless of what the MANIFEST.md claims.

**DO NOT TRUST THE MANIFEST** - It may be outdated, incomplete, or inaccurate. Your job is to find the ground truth by examining the actual codebase.

[... rest of template with 1-2 replaced with "2-4" ...]
```

---

## Advanced Investigation Techniques

### For Hard-to-Find Implementations

1. **Search by Feature Name**:
   ```bash
   grep -ri "email verification" apps/
   grep -ri "profile update" apps/
   ```

2. **Search by Database Tables**:
   ```bash
   grep -ri "email_verification_token" supabase/
   grep -ri "pending_email" supabase/
   ```

3. **Search by API Patterns**:
   ```bash
   find apps/ -path "*/api/*/route.ts" -exec grep -l "email" {} \;
   ```

4. **Search by Component Patterns**:
   ```bash
   find apps/ -name "*.tsx" -exec grep -l "ChangePassword\|UpdateEmail" {} \;
   ```

5. **Search by Import Patterns**:
   ```bash
   grep -r "from.*email-helpers" apps/
   grep -r "from.*user.schema" apps/
   ```

### For Partial Implementations

Look for these red flags:
- `// TODO:` comments
- `// FIXME:` comments
- `throw new Error("Not implemented")`
- `console.log("placeholder")`
- Empty function bodies
- Components that only return `<div>Loading...</div>`
- API routes that return mock data

### For Refactored Implementations

Sometimes code is implemented differently than originally planned:
- Different file structure
- Different component names
- Merged functionality (multiple tasks in one file)
- Split functionality (one task across multiple files)

Search for the **functionality** rather than expected file names.

---

## Quick Investigation Checklist

Use this for rapid assessment:

- [ ] Story file found and read
- [ ] MANIFEST found and read
- [ ] Context XML found and read
- [ ] Migration files searched
- [ ] API routes searched
- [ ] Components searched
- [ ] Utilities searched
- [ ] Tests searched
- [ ] Each file verified for completeness
- [ ] Integration points verified
- [ ] Test coverage verified
- [ ] Discrepancies documented
- [ ] Report generated
- [ ] Recommendations provided

---

## Output Format

The investigation should produce:

1. **Markdown Report** (detailed findings)
2. **Updated MANIFEST.md** (with corrected statuses)
3. **Gap Analysis** (what's missing)
4. **Priority List** (what to do next)

All outputs should be saved to:
`.bmad-ephemeral/stories/prompts/1-2/INVESTIGATION_REPORT_{date}.md`

---

**Last Updated**: 2025-11-14
**Version**: 1.0
