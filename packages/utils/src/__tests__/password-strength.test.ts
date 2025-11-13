import { describe, it, expect } from 'vitest'
import { calculatePasswordStrength } from '../password-strength'

describe('calculatePasswordStrength', () => {
  describe('weak passwords (0-2 requirements)', () => {
    it('should return weak for empty password', () => {
      const result = calculatePasswordStrength('')

      expect(result.strength).toBe('weak')
      expect(result.score).toBe(0)
      expect(result.checks).toEqual({
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
      })
    })

    it('should return weak for password with only lowercase', () => {
      const result = calculatePasswordStrength('password')

      expect(result.strength).toBe('weak')
      expect(result.score).toBe(2)
      expect(result.checks.hasMinLength).toBe(true)
      expect(result.checks.hasLowercase).toBe(true)
      expect(result.checks.hasUppercase).toBe(false)
      expect(result.checks.hasNumber).toBe(false)
      expect(result.checks.hasSpecialChar).toBe(false)
    })

    it('should return medium for short password with mixed types', () => {
      const result = calculatePasswordStrength('Aa1!')

      expect(result.strength).toBe('medium')
      expect(result.score).toBe(4) // All except length
      expect(result.checks.hasMinLength).toBe(false)
      expect(result.checks.hasUppercase).toBe(true)
      expect(result.checks.hasLowercase).toBe(true)
      expect(result.checks.hasNumber).toBe(true)
      expect(result.checks.hasSpecialChar).toBe(true)
    })

    it('should return weak for password with only 1 requirement', () => {
      const result = calculatePasswordStrength('abcdefgh')

      expect(result.strength).toBe('weak')
      expect(result.score).toBe(2)
      expect(result.checks.hasMinLength).toBe(true)
      expect(result.checks.hasLowercase).toBe(true)
    })
  })

  describe('medium passwords (3-4 requirements)', () => {
    it('should return medium for password with 3 requirements', () => {
      const result = calculatePasswordStrength('Password')

      expect(result.strength).toBe('medium')
      expect(result.score).toBe(3)
      expect(result.checks.hasMinLength).toBe(true)
      expect(result.checks.hasUppercase).toBe(true)
      expect(result.checks.hasLowercase).toBe(true)
      expect(result.checks.hasNumber).toBe(false)
      expect(result.checks.hasSpecialChar).toBe(false)
    })

    it('should return medium for password with 4 requirements', () => {
      const result = calculatePasswordStrength('Password123')

      expect(result.strength).toBe('medium')
      expect(result.score).toBe(4)
      expect(result.checks.hasMinLength).toBe(true)
      expect(result.checks.hasUppercase).toBe(true)
      expect(result.checks.hasLowercase).toBe(true)
      expect(result.checks.hasNumber).toBe(true)
      expect(result.checks.hasSpecialChar).toBe(false)
    })

    it('should return medium for password with uppercase, lowercase, and number', () => {
      const result = calculatePasswordStrength('MyPass123')

      expect(result.strength).toBe('medium')
      expect(result.score).toBe(4)
      expect(result.checks.hasMinLength).toBe(true)
      expect(result.checks.hasUppercase).toBe(true)
      expect(result.checks.hasLowercase).toBe(true)
      expect(result.checks.hasNumber).toBe(true)
      expect(result.checks.hasSpecialChar).toBe(false)
    })
  })

  describe('strong passwords (all 5 requirements)', () => {
    it('should return strong for password with all requirements', () => {
      const result = calculatePasswordStrength('MyP@ssw0rd')

      expect(result.strength).toBe('strong')
      expect(result.score).toBe(5)
      expect(result.checks).toEqual({
        hasMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSpecialChar: true,
      })
    })

    it('should return strong for password with minimum length and all types', () => {
      const result = calculatePasswordStrength('Abcd123!')

      expect(result.strength).toBe('strong')
      expect(result.score).toBe(5)
      expect(result.checks).toEqual({
        hasMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSpecialChar: true,
      })
    })

    it('should return strong for long password with all requirements', () => {
      const result = calculatePasswordStrength('MyVerySecureP@ssw0rd2024!')

      expect(result.strength).toBe('strong')
      expect(result.score).toBe(5)
      expect(result.checks).toEqual({
        hasMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSpecialChar: true,
      })
    })
  })

  describe('individual requirement checks', () => {
    describe('minimum length (8 characters)', () => {
      it('should pass for exactly 8 characters', () => {
        const result = calculatePasswordStrength('abcdefgh')
        expect(result.checks.hasMinLength).toBe(true)
      })

      it('should fail for 7 characters', () => {
        const result = calculatePasswordStrength('abcdefg')
        expect(result.checks.hasMinLength).toBe(false)
      })

      it('should pass for more than 8 characters', () => {
        const result = calculatePasswordStrength('abcdefghijklmnop')
        expect(result.checks.hasMinLength).toBe(true)
      })
    })

    describe('uppercase letter check', () => {
      it('should detect uppercase at start', () => {
        const result = calculatePasswordStrength('Aabcdefgh')
        expect(result.checks.hasUppercase).toBe(true)
      })

      it('should detect uppercase in middle', () => {
        const result = calculatePasswordStrength('abcdEfgh')
        expect(result.checks.hasUppercase).toBe(true)
      })

      it('should detect uppercase at end', () => {
        const result = calculatePasswordStrength('abcdefghZ')
        expect(result.checks.hasUppercase).toBe(true)
      })

      it('should detect multiple uppercase letters', () => {
        const result = calculatePasswordStrength('ABCDEFGH')
        expect(result.checks.hasUppercase).toBe(true)
      })

      it('should fail when no uppercase present', () => {
        const result = calculatePasswordStrength('abcdefgh123')
        expect(result.checks.hasUppercase).toBe(false)
      })
    })

    describe('lowercase letter check', () => {
      it('should detect lowercase at start', () => {
        const result = calculatePasswordStrength('aBCDEFGH')
        expect(result.checks.hasLowercase).toBe(true)
      })

      it('should detect lowercase in middle', () => {
        const result = calculatePasswordStrength('ABCDeFGH')
        expect(result.checks.hasLowercase).toBe(true)
      })

      it('should detect lowercase at end', () => {
        const result = calculatePasswordStrength('ABCDEFGHz')
        expect(result.checks.hasLowercase).toBe(true)
      })

      it('should detect multiple lowercase letters', () => {
        const result = calculatePasswordStrength('abcdefgh')
        expect(result.checks.hasLowercase).toBe(true)
      })

      it('should fail when no lowercase present', () => {
        const result = calculatePasswordStrength('ABCDEFGH123')
        expect(result.checks.hasLowercase).toBe(false)
      })
    })

    describe('number check', () => {
      it('should detect number at start', () => {
        const result = calculatePasswordStrength('1abcdefgh')
        expect(result.checks.hasNumber).toBe(true)
      })

      it('should detect number in middle', () => {
        const result = calculatePasswordStrength('abcd5efgh')
        expect(result.checks.hasNumber).toBe(true)
      })

      it('should detect number at end', () => {
        const result = calculatePasswordStrength('abcdefgh9')
        expect(result.checks.hasNumber).toBe(true)
      })

      it('should detect multiple numbers', () => {
        const result = calculatePasswordStrength('12345678')
        expect(result.checks.hasNumber).toBe(true)
      })

      it('should fail when no number present', () => {
        const result = calculatePasswordStrength('abcdefgh')
        expect(result.checks.hasNumber).toBe(false)
      })
    })

    describe('special character check', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>'.split('')

      specialChars.forEach((char) => {
        it(`should detect special character: ${char}`, () => {
          const result = calculatePasswordStrength(`password${char}`)
          expect(result.checks.hasSpecialChar).toBe(true)
        })
      })

      it('should detect special character at start', () => {
        const result = calculatePasswordStrength('!abcdefgh')
        expect(result.checks.hasSpecialChar).toBe(true)
      })

      it('should detect special character in middle', () => {
        const result = calculatePasswordStrength('abcd@efgh')
        expect(result.checks.hasSpecialChar).toBe(true)
      })

      it('should detect special character at end', () => {
        const result = calculatePasswordStrength('abcdefgh!')
        expect(result.checks.hasSpecialChar).toBe(true)
      })

      it('should detect multiple special characters', () => {
        const result = calculatePasswordStrength('!@#$%^&*')
        expect(result.checks.hasSpecialChar).toBe(true)
      })

      it('should fail when no special character present', () => {
        const result = calculatePasswordStrength('abcdefgh123')
        expect(result.checks.hasSpecialChar).toBe(false)
      })

      it('should NOT accept space as special character', () => {
        const result = calculatePasswordStrength('password 123')
        expect(result.checks.hasSpecialChar).toBe(false)
      })

      it('should NOT accept underscore as special character', () => {
        const result = calculatePasswordStrength('password_123')
        expect(result.checks.hasSpecialChar).toBe(false)
      })

      it('should NOT accept hyphen as special character', () => {
        const result = calculatePasswordStrength('password-123')
        expect(result.checks.hasSpecialChar).toBe(false)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = calculatePasswordStrength('')
      expect(result.strength).toBe('weak')
      expect(result.score).toBe(0)
    })

    it('should handle very long password', () => {
      const longPassword = 'A'.repeat(100) + 'a1!'
      const result = calculatePasswordStrength(longPassword)
      expect(result.strength).toBe('strong')
      expect(result.score).toBe(5)
    })

    it('should handle password with only special characters', () => {
      const result = calculatePasswordStrength('!@#$%^&*')
      expect(result.strength).toBe('weak')
      expect(result.score).toBe(2)
      expect(result.checks.hasMinLength).toBe(true)
      expect(result.checks.hasSpecialChar).toBe(true)
    })

    it('should handle unicode characters as non-matching', () => {
      const result = calculatePasswordStrength('pässwörd')
      expect(result.strength).toBe('weak')
      expect(result.score).toBe(2)
      expect(result.checks.hasMinLength).toBe(true)
      expect(result.checks.hasLowercase).toBe(true)
      // Unicode characters should not match uppercase or special char patterns
      expect(result.checks.hasUppercase).toBe(false)
      expect(result.checks.hasSpecialChar).toBe(false)
    })

    it('should handle whitespace in password', () => {
      const result = calculatePasswordStrength('My Pass 123!')
      expect(result.strength).toBe('strong')
      expect(result.score).toBe(5)
      // Spaces don't count as special chars, but ! does
      expect(result.checks.hasSpecialChar).toBe(true)
    })
  })

  describe('score calculation', () => {
    it('should calculate score as sum of met requirements', () => {
      const tests: Array<[string, number]> = [
        ['', 0],
        ['abc', 1], // only lowercase
        ['abcdefgh', 2], // length + lowercase
        ['Abcdefgh', 3], // length + lowercase + uppercase
        ['Abcdefg1', 4], // length + lowercase + uppercase + number
        ['Abcdef1!', 5], // all requirements
      ]

      tests.forEach(([password, expectedScore]) => {
        const result = calculatePasswordStrength(password)
        expect(result.score).toBe(expectedScore)
      })
    })
  })

  describe('return type validation', () => {
    it('should return object with correct structure', () => {
      const result = calculatePasswordStrength('Test123!')

      expect(result).toHaveProperty('strength')
      expect(result).toHaveProperty('checks')
      expect(result).toHaveProperty('score')

      expect(typeof result.strength).toBe('string')
      expect(typeof result.checks).toBe('object')
      expect(typeof result.score).toBe('number')
    })

    it('should return checks object with all required properties', () => {
      const result = calculatePasswordStrength('Test123!')

      expect(result.checks).toHaveProperty('hasMinLength')
      expect(result.checks).toHaveProperty('hasUppercase')
      expect(result.checks).toHaveProperty('hasLowercase')
      expect(result.checks).toHaveProperty('hasNumber')
      expect(result.checks).toHaveProperty('hasSpecialChar')

      expect(typeof result.checks.hasMinLength).toBe('boolean')
      expect(typeof result.checks.hasUppercase).toBe('boolean')
      expect(typeof result.checks.hasLowercase).toBe('boolean')
      expect(typeof result.checks.hasNumber).toBe('boolean')
      expect(typeof result.checks.hasSpecialChar).toBe('boolean')
    })

    it('should only return valid strength values', () => {
      const passwords = [
        'weak', // weak
        'Password', // medium
        'Password123!', // strong
      ]

      passwords.forEach((password) => {
        const result = calculatePasswordStrength(password)
        expect(['weak', 'medium', 'strong']).toContain(result.strength)
      })
    })
  })
})
