# Task 7: AI Extraction API (Premium Feature)

## Context
Story 3.2: Student Registry - AI-powered data extraction from offer letters

## Acceptance Criteria Coverage
- AC 8: Premium Feature (AI-Powered Extraction)

## Task Description
Implement AI-powered extraction of student/college/payment data from PDF offer letters (premium feature only).

## Subtasks
1. Implement POST /api/students/extract-from-offer-letter
2. Check agency subscription_tier before processing
3. Use OCR + LLM for extraction (OpenAI GPT-4 Vision, Claude, or specialized service)
4. Extract structured data: student_name, passport_number, college_name, branch_name, program_name, dates, amounts, payment_schedule
5. Return JSON with extracted fields and confidence scores
6. Implement fuzzy matching for existing colleges/branches
7. Handle extraction failures with clear error messages
8. Store extraction metadata for analytics

## Technical Requirements
- Location: `apps/entities/app/api/students/extract-from-offer-letter/`
- Files to create:
  - `route.ts` (POST)
- Check agencies.subscription_tier ('premium' or 'enterprise')
- Use AI service (OpenAI GPT-4 Vision or similar)
- Return structured extraction results

## API Signature
```typescript
POST /api/students/extract-from-offer-letter FormData {file: File (PDF)}
Response: {
  student: { name, passport_number },
  college: { name, branch, city },
  program: { name, start_date, end_date },
  payment: { total_amount, currency, schedule: [] },
  confidence_scores: { [field]: number }
}
```

## Extraction Fields
- Student: name, passport_number
- College: college_name, branch_name, city
- Program: program_name, start_date, end_date
- Payment: tuition_total, payment_schedule (installments)

## Constraints
- Feature gated by subscription_tier
- Handle extraction failures gracefully
- Provide confidence scores
- Fuzzy match existing colleges/branches
- Allow user to review/edit extracted data
- Log extraction accuracy

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 8, lines 69-78)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Subscription tier check working
- [ ] AI extraction functional
- [ ] All fields extracted correctly
- [ ] Confidence scores provided
- [ ] Fuzzy matching implemented
- [ ] Error handling robust
- [ ] Analytics logging active
- [ ] Basic tier users get appropriate error
