/**
 * Password strength validator utility
 *
 * Validates passwords against security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

/**
 * Individual password requirement checks
 */
export interface PasswordChecks {
  /** Password has at least 8 characters */
  hasMinLength: boolean
  /** Password contains at least one uppercase letter (A-Z) */
  hasUppercase: boolean
  /** Password contains at least one lowercase letter (a-z) */
  hasLowercase: boolean
  /** Password contains at least one number (0-9) */
  hasNumber: boolean
  /** Password contains at least one special character */
  hasSpecialChar: boolean
}

/**
 * Password strength result
 */
export interface PasswordStrength {
  /** Overall strength level based on requirements met */
  strength: 'weak' | 'medium' | 'strong'
  /** Individual requirement check results */
  checks: PasswordChecks
  /** Number of requirements met (0-5) */
  score: number
}

/**
 * Regular expressions for password validation
 */
const PASSWORD_REGEX = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  specialChar: /[!@#$%^&*(),.?":{}|<>]/,
} as const

/**
 * Minimum password length requirement
 */
const MIN_PASSWORD_LENGTH = 8

/**
 * Calculate password strength based on security requirements
 *
 * Strength levels:
 * - weak: 0-2 requirements met
 * - medium: 3-4 requirements met
 * - strong: all 5 requirements met
 *
 * @param password - The password to validate
 * @returns Password strength object with checks and overall strength
 *
 * @example
 * ```typescript
 * const result = calculatePasswordStrength('MyP@ssw0rd')
 * // {
 * //   strength: 'strong',
 * //   checks: {
 * //     hasMinLength: true,
 * //     hasUppercase: true,
 * //     hasLowercase: true,
 * //     hasNumber: true,
 * //     hasSpecialChar: true
 * //   },
 * //   score: 5
 * // }
 * ```
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  // Perform individual requirement checks
  const checks: PasswordChecks = {
    hasMinLength: password.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: PASSWORD_REGEX.uppercase.test(password),
    hasLowercase: PASSWORD_REGEX.lowercase.test(password),
    hasNumber: PASSWORD_REGEX.number.test(password),
    hasSpecialChar: PASSWORD_REGEX.specialChar.test(password),
  }

  // Calculate score (number of requirements met)
  const score = Object.values(checks).filter(Boolean).length

  // Determine overall strength level
  let strength: 'weak' | 'medium' | 'strong'
  if (score <= 2) {
    strength = 'weak'
  } else if (score <= 4) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return {
    strength,
    checks,
    score,
  }
}
