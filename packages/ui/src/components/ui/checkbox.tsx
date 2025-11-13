/**
 * Checkbox Component
 *
 * A styled checkbox component based on shadcn/ui patterns.
 * Used for task assignment selection in invitation flow.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 07: Create user management page with invitation capability
 */

import * as React from 'react'
import { cn } from '../../lib/utils'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'cursor-pointer',
          className
        )}
        ref={ref}
        onChange={(e) => {
          if (onCheckedChange) {
            onCheckedChange(e.target.checked)
          }
          props.onChange?.(e)
        }}
        {...props}
      />
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
