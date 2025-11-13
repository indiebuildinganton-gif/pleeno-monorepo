/**
 * Password Strength Indicator
 *
 * Visual indicator showing password requirement status:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * Acceptance Criteria: 3
 */

'use client'

interface PasswordRequirement {
  met: boolean
  label: string
}

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements: PasswordRequirement[] = [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
  ]

  const metCount = requirements.filter((req) => req.met).length
  const strength =
    metCount === 5 ? 'strong' : metCount >= 3 ? 'medium' : 'weak'

  const strengthColor = {
    strong: 'text-green-600',
    medium: 'text-yellow-600',
    weak: 'text-red-600',
  }

  const strengthLabel = {
    strong: 'Strong',
    medium: 'Medium',
    weak: 'Weak',
  }

  return (
    <div className="space-y-2 p-3 bg-muted rounded-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength:</span>
        <span className={`text-sm font-semibold ${strengthColor[strength]}`}>
          {strengthLabel[strength]}
        </span>
      </div>

      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
