# Task 7: Enrollment Dropdown Component

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Create reusable EnrollmentSelect component that fetches active enrollments, supports search/filter, displays formatted enrollment info, and handles empty states.

## Acceptance Criteria

- AC 2: Enrollment Selection

## Subtasks

1. Create `EnrollmentSelect` component (reusable)

2. Fetch enrollments: GET /api/enrollments?status=active

3. Display format: "Student Name - College Name (Branch City) - Program"

4. Support search/filter by student name or college name

5. Show loading state while fetching enrollments

6. Handle empty state: "No active enrollments found. Create a student enrollment first."

7. Link to student creation page if no enrollments exist

## Implementation Notes

**File Location**:
- `apps/payments/app/plans/new/components/EnrollmentSelect.tsx`
- `apps/payments/hooks/useEnrollments.ts`

**EnrollmentSelect Component**:
```tsx
'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEnrollments } from '@/apps/payments/hooks/useEnrollments';
import { Skeleton } from '@/components/ui/skeleton';

interface EnrollmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function EnrollmentSelect({
  value,
  onChange,
  error,
}: EnrollmentSelectProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error: fetchError } = useEnrollments({ status: 'active' });

  const enrollments = data?.data || [];
  const selectedEnrollment = enrollments.find((e) => e.id === value);

  const formatEnrollment = (enrollment: any) => {
    const studentName = `${enrollment.student.first_name} ${enrollment.student.last_name}`;
    const collegeName = enrollment.branch.college.name;
    const branchCity = enrollment.branch.city;
    const program = enrollment.program_name;
    return `${studentName} - ${collegeName} (${branchCity}) - ${program}`;
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (fetchError) {
    return (
      <div className="text-sm text-destructive">
        Failed to load enrollments. Please try again.
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          No active enrollments found. Create a student enrollment first.
        </p>
        <Button asChild variant="outline">
          <a href="/students/new">Create Student & Enrollment</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Student Enrollment</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              error && 'border-destructive'
            )}
          >
            {selectedEnrollment
              ? formatEnrollment(selectedEnrollment)
              : 'Select enrollment...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search by student or college..." />
            <CommandEmpty>No enrollment found.</CommandEmpty>
            <CommandGroup>
              {enrollments.map((enrollment) => (
                <CommandItem
                  key={enrollment.id}
                  value={enrollment.id}
                  onSelect={() => {
                    onChange(enrollment.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === enrollment.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {formatEnrollment(enrollment)}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

**useEnrollments Hook**:
```typescript
// apps/payments/hooks/useEnrollments.ts
import { useQuery } from '@tanstack/react-query';

interface EnrollmentsQueryParams {
  status?: 'active' | 'completed' | 'cancelled';
  student_id?: string;
  college_id?: string;
}

interface Enrollment {
  id: string;
  program_name: string;
  status: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
  };
  branch: {
    id: string;
    city: string;
    commission_rate_percent: number;
    college: {
      id: string;
      name: string;
    };
  };
}

interface EnrollmentsResponse {
  success: boolean;
  data: Enrollment[];
}

export function useEnrollments(params?: EnrollmentsQueryParams) {
  return useQuery({
    queryKey: ['enrollments', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.student_id) searchParams.append('student_id', params.student_id);
      if (params?.college_id) searchParams.append('college_id', params.college_id);

      const response = await fetch(`/api/enrollments?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      return response.json() as Promise<EnrollmentsResponse>;
    },
  });
}
```

## Related Tasks

- **Depends on**: Story 3.3 (enrollments API must exist)
- **Used by**: Task 4 (payment plan form)

## Testing Checklist

- [ ] EnrollmentSelect component renders
- [ ] Dropdown fetches active enrollments
- [ ] Enrollments display in correct format
- [ ] Search filters by student name
- [ ] Search filters by college name
- [ ] Loading state shows skeleton
- [ ] Empty state shows helpful message
- [ ] Empty state links to student creation page
- [ ] Selected enrollment displays correctly
- [ ] Error state handles fetch failures
- [ ] Dropdown closes on selection

## References

- [docs/architecture.md](../../../docs/architecture.md) - Multi-Zone Architecture (lines 156-228)
- [Story 3.3](../../3-3-student-college-enrollment-linking.md) - Enrollment API routes
- Shadcn UI Command component: https://ui.shadcn.com/docs/components/command
