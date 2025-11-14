/**
 * Switch Component
 *
 * A toggle switch component for binary settings.
 * Used for notification settings and other on/off preferences.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 2: Notification Settings UI
 */

import * as React from 'react'
import { cn } from '../../lib/utils'

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          onChange={(e) => {
            if (onCheckedChange) {
              onCheckedChange(e.target.checked)
            }
            props.onChange?.(e)
          }}
          {...props}
        />
        <div
          className={cn(
            'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300',
            'rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full',
            'peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:start-[2px]',
            'after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5',
            'after:transition-all peer-checked:bg-blue-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
        />
      </label>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }
