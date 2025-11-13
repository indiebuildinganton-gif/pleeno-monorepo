# Story 6-5: Overdue Payments Summary Widget - Task 4

## Story Context

**As an** Agency User
**I want** a dedicated widget highlighting all overdue payments
**So that** I can immediately focus on the most urgent follow-ups

## Task 4: Add Loading and Error States

**Acceptance Criteria**: All

### Task Description

Implement skeleton loading and error states for the overdue payments widget to provide good user experience during data fetching and when errors occur.

### Subtasks

- [ ] Implement skeleton loader:
  - Show placeholder rows while loading
  - Match layout of actual widget
  - Smooth transition to real data
- [ ] Implement error state:
  - Clear error message: "Unable to load overdue payments"
  - Retry button
  - Log error for debugging
- [ ] Test loading state renders correctly
- [ ] Test error state with retry functionality

## Context

### Key Constraints

- **User Experience**: Loading states should match the layout of the actual widget
- **Error Handling**: Errors should be logged and provide retry functionality
- **Visual Design**: Maintain consistent styling with dashboard theme

### Loading State Component Example

```typescript
// apps/dashboard/app/components/OverduePaymentsWidget.tsx

function OverduePaymentsSkeleton() {
  return (
    <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-40 bg-gray-300 rounded"></div>
          <div className="h-6 w-8 bg-gray-300 rounded-full"></div>
        </div>
        <div>
          <div className="h-4 w-24 bg-gray-300 rounded mb-1"></div>
          <div className="h-8 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Payment item skeletons */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-gray-300 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-48 bg-gray-300 rounded"></div>
              </div>
              <div className="text-right">
                <div className="h-5 w-20 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Error State Component Example

```typescript
// apps/dashboard/app/components/OverduePaymentsWidget.tsx

function OverduePaymentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border-2 border-red-300 rounded-lg p-6 bg-red-50 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Unable to load overdue payments
      </h3>
      <p className="text-sm text-red-700 mb-4">
        There was an error fetching the data. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
```

### Alternative Error State Designs

**Option A: Minimal with Support Link**
```typescript
<div className="border-2 border-red-300 rounded-lg p-6 bg-red-50 text-center">
  <h3 className="text-lg font-semibold text-red-900 mb-2">
    Failed to load overdue payments
  </h3>
  <p className="text-sm text-red-700 mb-4">
    Please try refreshing the page or{' '}
    <a href="/support" className="underline">contact support</a>.
  </p>
  <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg">
    Try Again
  </button>
</div>
```

**Option B: With Error Details**
```typescript
function OverduePaymentsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  useEffect(() => {
    // Log error for debugging
    console.error('Overdue payments fetch error:', error)
  }, [error])

  return (
    <div className="border-2 border-red-300 rounded-lg p-6 bg-red-50">
      <div className="flex items-start gap-3">
        <div className="text-3xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-1">
            Unable to load overdue payments
          </h3>
          <p className="text-sm text-red-700 mb-3">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Usage in Main Component

```typescript
// apps/dashboard/app/components/OverduePaymentsWidget.tsx

export function OverduePaymentsWidget() {
  const { data, isLoading, error, refetch } = useOverduePayments()

  // Loading state
  if (isLoading) {
    return <OverduePaymentsSkeleton />
  }

  // Error state
  if (error) {
    return <OverduePaymentsError onRetry={() => refetch()} />
  }

  // Empty state
  if (!data || data.total_count === 0) {
    return <OverduePaymentsEmpty />
  }

  // Success state - render overdue payments
  return (
    <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
      {/* ... overdue payments list */}
    </div>
  )
}
```

### Dependencies

- **react** (18.x): React library, useEffect for error logging
- **tailwindcss** (4.x): Utility-first CSS framework
- **@tanstack/react-query** (5.90.7): Provides `isLoading`, `error`, `refetch`

### Reference Documentation

- [docs/architecture.md](../../architecture.md) - State Management with TanStack Query
- [.bmad-ephemeral/stories/6-4-recent-activity-feed.md](../../../.bmad-ephemeral/stories/6-4-recent-activity-feed.md) - Loading/error patterns

## Implementation Guide

1. **Create `OverduePaymentsSkeleton` component**:
   - Match the layout of the actual widget
   - Use Tailwind `animate-pulse` utility
   - Show 3 placeholder rows
   - Include header skeleton (title + badge + total)

2. **Create `OverduePaymentsError` component**:
   - Accept `onRetry` callback prop
   - Display clear error message
   - Include retry button
   - Optional: Log error to console/monitoring service

3. **Update main widget component**:
   - Add loading state check first
   - Add error state check second
   - Add empty state check third
   - Render success state last

4. **Test edge cases**:
   - Rapid loading/unloading
   - Multiple retry attempts
   - Network errors vs server errors

### Accessibility Considerations

**Loading State**:
- Add `aria-busy="true"` attribute
- Add `aria-label="Loading overdue payments"`
- Consider screen reader announcement

**Error State**:
- Use semantic error colors (red)
- Ensure retry button is keyboard accessible
- Add `role="alert"` for screen readers

**Example with Accessibility**:
```typescript
function OverduePaymentsSkeleton() {
  return (
    <div
      className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 animate-pulse"
      aria-busy="true"
      aria-label="Loading overdue payments"
    >
      {/* ... skeleton content */}
    </div>
  )
}

function OverduePaymentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="border-2 border-red-300 rounded-lg p-6 bg-red-50 text-center"
      role="alert"
      aria-live="polite"
    >
      {/* ... error content */}
    </div>
  )
}
```

### Testing Approach

Create test cases to verify:
- Loading state renders skeleton with correct structure
- Skeleton has 3 placeholder rows
- Error state renders with error message
- Retry button calls `refetch()` when clicked
- Error logged to console
- Transitions smoothly between states
- Accessibility attributes present

### Performance Considerations

- Skeleton should render instantly (no data fetching)
- Avoid heavy animations that slow initial render
- Use CSS animations (not JavaScript) for pulse effect
- Keep skeleton DOM structure simple

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-5/manifest.md`:
   - Change Task 4 status to "Completed"
   - Add completion date
   - Add any relevant implementation notes

2. **Proceed to Task 5**: Open `task-5-prompt.md` to integrate the widget into the dashboard

3. **Verify**: Test loading and error states manually by:
   - Throttling network in browser DevTools (loading state)
   - Temporarily breaking API route (error state)

---

**Remember**: This is Task 4 of 7. Task 5 will integrate the complete widget into the dashboard page.
