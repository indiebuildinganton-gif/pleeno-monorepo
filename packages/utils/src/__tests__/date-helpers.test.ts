import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  formatDateInAgencyTimezone,
  getRelativeTime,
  convertToUTC,
  DateFormatPresets,
  formatDateWithPreset,
  isDueSoon,
  calculateStudentDueDate,
  calculateCollegeDueDate,
  generateInstallmentDueDates,
} from '../date-helpers'

describe('Date Helpers', () => {
  describe('formatDateInAgencyTimezone', () => {
    it('converts UTC to Brisbane timezone (UTC+10)', () => {
      const utcDate = new Date('2024-01-01T00:00:00Z')
      const result = formatDateInAgencyTimezone(utcDate, 'Australia/Brisbane', 'yyyy-MM-dd HH:mm')
      expect(result).toBe('2024-01-01 10:00')
    })

    it('converts UTC to New York timezone (UTC-5)', () => {
      const utcDate = new Date('2024-01-01T00:00:00Z')
      const result = formatDateInAgencyTimezone(utcDate, 'America/New_York', 'yyyy-MM-dd HH:mm')
      // New York is UTC-5 in winter (EST)
      expect(result).toBe('2023-12-31 19:00')
    })

    it('converts UTC to London timezone (UTC+0)', () => {
      const utcDate = new Date('2024-01-01T00:00:00Z')
      const result = formatDateInAgencyTimezone(utcDate, 'Europe/London', 'yyyy-MM-dd HH:mm')
      expect(result).toBe('2024-01-01 00:00')
    })

    it('handles string dates', () => {
      const result = formatDateInAgencyTimezone(
        '2024-01-01T00:00:00Z',
        'Australia/Brisbane',
        'yyyy-MM-dd'
      )
      expect(result).toBe('2024-01-01')
    })

    it('uses default format when not specified', () => {
      const utcDate = new Date('2024-01-01T00:00:00Z')
      const result = formatDateInAgencyTimezone(utcDate, 'Australia/Brisbane')
      // PPpp format: "Jan 1, 2024, 10:00 AM"
      expect(result).toMatch(/Jan 1, 2024/)
      expect(result).toMatch(/10:00/)
    })

    it('handles daylight saving time transitions', () => {
      // Test during summer in New York (UTC-4, EDT)
      const summerDate = new Date('2024-07-01T00:00:00Z')
      const summerResult = formatDateInAgencyTimezone(
        summerDate,
        'America/New_York',
        'yyyy-MM-dd HH:mm'
      )
      expect(summerResult).toBe('2024-06-30 20:00')

      // Test during winter in New York (UTC-5, EST)
      const winterDate = new Date('2024-01-01T00:00:00Z')
      const winterResult = formatDateInAgencyTimezone(
        winterDate,
        'America/New_York',
        'yyyy-MM-dd HH:mm'
      )
      expect(winterResult).toBe('2023-12-31 19:00')
    })

    it('handles various date format strings', () => {
      const utcDate = new Date('2024-01-15T14:30:45Z')

      const isoFormat = formatDateInAgencyTimezone(utcDate, 'Australia/Brisbane', 'yyyy-MM-dd')
      expect(isoFormat).toBe('2024-01-16')

      const timeFormat = formatDateInAgencyTimezone(utcDate, 'Australia/Brisbane', 'HH:mm:ss')
      expect(timeFormat).toBe('00:30:45')

      const fullFormat = formatDateInAgencyTimezone(
        utcDate,
        'Australia/Brisbane',
        'EEEE, MMMM d, yyyy'
      )
      expect(fullFormat).toBe('Tuesday, January 16, 2024')
    })
  })

  describe('getRelativeTime', () => {
    beforeEach(() => {
      // Mock current time to 2024-01-01T12:00:00Z for consistent tests
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    })

    it('returns "about x hours ago" for recent dates', () => {
      const twoHoursAgo = new Date('2024-01-01T10:00:00Z')
      const result = getRelativeTime(twoHoursAgo)
      expect(result).toBe('about 2 hours ago')
    })

    it('returns "x days ago" for dates within the week', () => {
      const threeDaysAgo = new Date('2023-12-29T12:00:00Z')
      const result = getRelativeTime(threeDaysAgo)
      expect(result).toBe('3 days ago')
    })

    it('returns "about x months ago" for older dates', () => {
      const threeMonthsAgo = new Date('2023-10-01T12:00:00Z')
      const result = getRelativeTime(threeMonthsAgo)
      expect(result).toBe('3 months ago')
    })

    it('handles string dates', () => {
      const result = getRelativeTime('2024-01-01T10:00:00Z')
      expect(result).toBe('about 2 hours ago')
    })

    it('returns "in x hours" for future dates', () => {
      const twoHoursLater = new Date('2024-01-01T14:00:00Z')
      const result = getRelativeTime(twoHoursLater)
      expect(result).toBe('in about 2 hours')
    })

    it('returns "1 minute ago" for very recent dates', () => {
      const thirtySecondsAgo = new Date('2024-01-01T11:59:30Z')
      const result = getRelativeTime(thirtySecondsAgo)
      expect(result).toBe('1 minute ago')
    })
  })

  describe('convertToUTC', () => {
    it('converts Brisbane local time to UTC', () => {
      // 10:00 AM in Brisbane = 00:00 UTC (Brisbane is UTC+10)
      const brisbaneTime = new Date('2024-01-01T10:00:00')
      const utcTime = convertToUTC(brisbaneTime, 'Australia/Brisbane')

      // Note: This tests the conversion logic
      expect(utcTime.toISOString()).toBe('2024-01-01T00:00:00.000Z')
    })

    it('converts New York local time to UTC', () => {
      // 19:00 in New York = 00:00 UTC next day (NY is UTC-5 in winter)
      const nyTime = new Date('2024-01-01T19:00:00')
      const utcTime = convertToUTC(nyTime, 'America/New_York')

      expect(utcTime.toISOString()).toBe('2024-01-02T00:00:00.000Z')
    })

    it('handles London time (same as UTC in winter)', () => {
      const londonTime = new Date('2024-01-01T12:00:00')
      const utcTime = convertToUTC(londonTime, 'Europe/London')

      expect(utcTime.toISOString()).toBe('2024-01-01T12:00:00.000Z')
    })
  })

  describe('DateFormatPresets', () => {
    it('has all expected preset keys', () => {
      expect(DateFormatPresets).toHaveProperty('full')
      expect(DateFormatPresets).toHaveProperty('date')
      expect(DateFormatPresets).toHaveProperty('time')
      expect(DateFormatPresets).toHaveProperty('shortDate')
      expect(DateFormatPresets).toHaveProperty('isoDate')
      expect(DateFormatPresets).toHaveProperty('isoDateTime')
      expect(DateFormatPresets).toHaveProperty('long')
    })

    it('preset values are valid format strings', () => {
      expect(DateFormatPresets.full).toBe('PPpp')
      expect(DateFormatPresets.date).toBe('PP')
      expect(DateFormatPresets.time).toBe('p')
      expect(DateFormatPresets.shortDate).toBe('P')
      expect(DateFormatPresets.isoDate).toBe('yyyy-MM-dd')
      expect(DateFormatPresets.isoDateTime).toBe('yyyy-MM-dd HH:mm')
    })
  })

  describe('formatDateWithPreset', () => {
    const testDate = new Date('2024-01-15T14:30:00Z')

    it('formats with "date" preset', () => {
      const result = formatDateWithPreset(testDate, 'Australia/Brisbane', 'date')
      expect(result).toMatch(/Jan 16, 2024/)
    })

    it('formats with "time" preset', () => {
      const result = formatDateWithPreset(testDate, 'Australia/Brisbane', 'time')
      // Brisbane time is UTC+10, so 14:30 UTC = 00:30 next day
      expect(result).toMatch(/12:30/)
    })

    it('formats with "isoDate" preset', () => {
      const result = formatDateWithPreset(testDate, 'Australia/Brisbane', 'isoDate')
      expect(result).toBe('2024-01-16')
    })

    it('formats with "isoDateTime" preset', () => {
      const result = formatDateWithPreset(testDate, 'Australia/Brisbane', 'isoDateTime')
      expect(result).toBe('2024-01-16 00:30')
    })

    it('formats with "shortDate" preset', () => {
      const result = formatDateWithPreset(testDate, 'Australia/Brisbane', 'shortDate')
      expect(result).toMatch(/1\/16\/2024/)
    })

    it('handles string dates', () => {
      const result = formatDateWithPreset('2024-01-15T14:30:00Z', 'Australia/Brisbane', 'isoDate')
      expect(result).toBe('2024-01-16')
    })
  })

  describe('Edge Cases', () => {
    it('handles leap year dates', () => {
      const leapDate = new Date('2024-02-29T12:00:00Z')
      const result = formatDateInAgencyTimezone(leapDate, 'Australia/Brisbane', 'yyyy-MM-dd')
      expect(result).toBe('2024-02-29')
    })

    it('handles year boundary transitions', () => {
      const newYearEve = new Date('2023-12-31T23:30:00Z')
      const result = formatDateInAgencyTimezone(
        newYearEve,
        'Australia/Brisbane',
        'yyyy-MM-dd HH:mm'
      )
      // Brisbane is UTC+10, so 23:30 UTC on Dec 31 = 09:30 on Jan 1
      expect(result).toBe('2024-01-01 09:30')
    })

    it('handles very old dates', () => {
      const oldDate = new Date('1900-01-01T00:00:00Z')
      const result = formatDateInAgencyTimezone(oldDate, 'Australia/Brisbane', 'yyyy-MM-dd')
      expect(result).toMatch(/1900/)
    })

    it('handles far future dates', () => {
      const futureDate = new Date('2099-12-31T23:59:59Z')
      const result = formatDateInAgencyTimezone(futureDate, 'Australia/Brisbane', 'yyyy-MM-dd')
      expect(result).toMatch(/2100-01-01/)
    })
  })

  describe('isDueSoon', () => {
    beforeEach(() => {
      // Mock current time to 2024-01-01T12:00:00Z for consistent tests
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns true for installment due in 3 days with default 4-day threshold', () => {
      const dueDate = new Date('2024-01-04T00:00:00Z')
      expect(isDueSoon(dueDate)).toBe(true)
    })

    it('returns false for installment due in 5 days with default 4-day threshold', () => {
      const dueDate = new Date('2024-01-06T00:00:00Z')
      expect(isDueSoon(dueDate)).toBe(false)
    })

    it('returns true for installment due today', () => {
      const dueDate = new Date('2024-01-01T23:59:59Z')
      expect(isDueSoon(dueDate)).toBe(true)
    })

    it('returns false for installment due in the past', () => {
      const dueDate = new Date('2023-12-31T00:00:00Z')
      expect(isDueSoon(dueDate)).toBe(false)
    })

    it('returns true for installment due exactly at threshold (4 days)', () => {
      const dueDate = new Date('2024-01-05T00:00:00Z')
      expect(isDueSoon(dueDate)).toBe(true)
    })

    it('handles different threshold values - 2 days', () => {
      const dueDateWithin = new Date('2024-01-03T00:00:00Z') // 2 days away
      const dueDateOutside = new Date('2024-01-04T00:00:00Z') // 3 days away

      expect(isDueSoon(dueDateWithin, 2)).toBe(true)
      expect(isDueSoon(dueDateOutside, 2)).toBe(false)
    })

    it('handles different threshold values - 7 days', () => {
      const dueDateWithin = new Date('2024-01-07T00:00:00Z') // 6 days away
      const dueDateOutside = new Date('2024-01-09T00:00:00Z') // 8 days away

      expect(isDueSoon(dueDateWithin, 7)).toBe(true)
      expect(isDueSoon(dueDateOutside, 7)).toBe(false)
    })

    it('handles string dates', () => {
      expect(isDueSoon('2024-01-04T00:00:00Z', 4)).toBe(true)
      expect(isDueSoon('2024-01-06T00:00:00Z', 4)).toBe(false)
    })

    it('returns false for null or undefined dates', () => {
      expect(isDueSoon(null as any)).toBe(false)
      expect(isDueSoon(undefined as any)).toBe(false)
    })

    it('handles timezone-aware calculations for Brisbane', () => {
      // Current time: 2024-01-01T12:00:00Z
      // Brisbane time: 2024-01-01 22:00 (UTC+10), so still Jan 1
      // Due date: 2024-01-05T00:00:00Z
      // Brisbane due date: 2024-01-05 10:00, so Jan 5
      // Days between: 4 days
      const dueDate = new Date('2024-01-05T00:00:00Z')
      expect(isDueSoon(dueDate, 4, 'Australia/Brisbane')).toBe(true)
    })

    it('handles timezone-aware calculations for New York', () => {
      // Current time: 2024-01-01T12:00:00Z
      // New York time: 2024-01-01 07:00 (UTC-5), so Jan 1
      // Due date: 2024-01-05T00:00:00Z
      // New York due date: 2024-01-04 19:00, so Jan 4
      // Days between: 3 days
      const dueDate = new Date('2024-01-05T00:00:00Z')
      expect(isDueSoon(dueDate, 4, 'America/New_York')).toBe(true)
    })

    it('handles end of day for due dates', () => {
      // Due date at end of day should still be counted as that day
      const dueDateEndOfDay = new Date('2024-01-04T23:59:59Z')
      expect(isDueSoon(dueDateEndOfDay, 4)).toBe(true)
    })

    it('handles beginning of day for due dates', () => {
      // Due date at beginning of day should be counted as that day
      const dueDateStartOfDay = new Date('2024-01-04T00:00:00Z')
      expect(isDueSoon(dueDateStartOfDay, 4)).toBe(true)
    })

    it('handles weekend dates within threshold', () => {
      // Friday is today (2024-01-05 is a Friday based on our mock time)
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'))

      // Monday due date (4 days away including weekend)
      const mondayDueDate = new Date('2024-01-08T00:00:00Z')
      expect(isDueSoon(mondayDueDate, 4)).toBe(true)
    })

    it('edge case: threshold of 0 days only includes today', () => {
      const today = new Date('2024-01-01T23:59:59Z')
      const tomorrow = new Date('2024-01-02T00:00:00Z')

      expect(isDueSoon(today, 0)).toBe(true)
      expect(isDueSoon(tomorrow, 0)).toBe(false)
    })

    it('edge case: very large threshold includes far future dates', () => {
      const farFuture = new Date('2024-02-01T00:00:00Z') // 31 days away
      expect(isDueSoon(farFuture, 30)).toBe(false)
      expect(isDueSoon(farFuture, 31)).toBe(true)
    })
  })

  describe('calculateStudentDueDate', () => {
    it('calculates student due date with 7 days lead time', () => {
      const collegeDueDate = new Date('2025-03-15T00:00:00Z')
      const result = calculateStudentDueDate(collegeDueDate, 7)
      expect(result.toISOString()).toBe('2025-03-08T00:00:00.000Z')
    })

    it('calculates student due date with 14 days lead time', () => {
      const collegeDueDate = new Date('2025-03-15T00:00:00Z')
      const result = calculateStudentDueDate(collegeDueDate, 14)
      expect(result.toISOString()).toBe('2025-03-01T00:00:00.000Z')
    })

    it('calculates student due date with 30 days lead time', () => {
      const collegeDueDate = new Date('2025-03-15T00:00:00Z')
      const result = calculateStudentDueDate(collegeDueDate, 30)
      expect(result.toISOString()).toBe('2025-02-13T00:00:00.000Z')
    })

    it('handles lead time of 0 days (returns same date)', () => {
      const collegeDueDate = new Date('2025-03-15T00:00:00Z')
      const result = calculateStudentDueDate(collegeDueDate, 0)
      expect(result.toISOString()).toBe('2025-03-15T00:00:00.000Z')
    })

    it('throws error for invalid college due date', () => {
      expect(() => calculateStudentDueDate(null as any, 7)).toThrow(
        'Invalid college due date: must be a valid Date object'
      )
      expect(() => calculateStudentDueDate(new Date('invalid'), 7)).toThrow(
        'Invalid college due date: must be a valid Date object'
      )
    })

    it('throws error for negative lead time', () => {
      const collegeDueDate = new Date('2025-03-15T00:00:00Z')
      expect(() => calculateStudentDueDate(collegeDueDate, -7)).toThrow(
        'Invalid student lead time: must be a non-negative number'
      )
    })

    it('throws error for non-number lead time', () => {
      const collegeDueDate = new Date('2025-03-15T00:00:00Z')
      expect(() => calculateStudentDueDate(collegeDueDate, '7' as any)).toThrow(
        'Invalid student lead time: must be a non-negative number'
      )
    })

    it('handles month boundaries correctly', () => {
      // Jan 31 - 7 days = Jan 24
      const collegeDueDate = new Date('2025-01-31T00:00:00Z')
      const result = calculateStudentDueDate(collegeDueDate, 7)
      expect(result.toISOString()).toBe('2025-01-24T00:00:00.000Z')
    })

    it('handles year boundaries correctly', () => {
      // Jan 5, 2025 - 10 days = Dec 26, 2024
      const collegeDueDate = new Date('2025-01-05T00:00:00Z')
      const result = calculateStudentDueDate(collegeDueDate, 10)
      expect(result.toISOString()).toBe('2024-12-26T00:00:00.000Z')
    })

    it('handles leap year dates correctly', () => {
      // March 1, 2024 - 7 days = Feb 23, 2024 (2024 is a leap year)
      const collegeDueDate = new Date('2024-03-01T00:00:00Z')
      const result = calculateStudentDueDate(collegeDueDate, 7)
      expect(result.toISOString()).toBe('2024-02-23T00:00:00.000Z')
    })
  })

  describe('calculateCollegeDueDate', () => {
    it('calculates college due date with 7 days lead time', () => {
      const studentDueDate = new Date('2025-03-08T00:00:00Z')
      const result = calculateCollegeDueDate(studentDueDate, 7)
      expect(result.toISOString()).toBe('2025-03-15T00:00:00.000Z')
    })

    it('verifies reverse calculation (roundtrip)', () => {
      const originalCollegeDueDate = new Date('2025-03-15T00:00:00Z')
      const leadTime = 7

      const studentDueDate = calculateStudentDueDate(originalCollegeDueDate, leadTime)
      const calculatedCollegeDueDate = calculateCollegeDueDate(studentDueDate, leadTime)

      expect(calculatedCollegeDueDate.toISOString()).toBe(originalCollegeDueDate.toISOString())
    })

    it('handles lead time of 0 days (returns same date)', () => {
      const studentDueDate = new Date('2025-03-15T00:00:00Z')
      const result = calculateCollegeDueDate(studentDueDate, 0)
      expect(result.toISOString()).toBe('2025-03-15T00:00:00.000Z')
    })

    it('throws error for invalid student due date', () => {
      expect(() => calculateCollegeDueDate(null as any, 7)).toThrow(
        'Invalid student due date: must be a valid Date object'
      )
      expect(() => calculateCollegeDueDate(new Date('invalid'), 7)).toThrow(
        'Invalid student due date: must be a valid Date object'
      )
    })

    it('throws error for negative lead time', () => {
      const studentDueDate = new Date('2025-03-08T00:00:00Z')
      expect(() => calculateCollegeDueDate(studentDueDate, -7)).toThrow(
        'Invalid student lead time: must be a non-negative number'
      )
    })

    it('throws error for non-number lead time', () => {
      const studentDueDate = new Date('2025-03-08T00:00:00Z')
      expect(() => calculateCollegeDueDate(studentDueDate, '7' as any)).toThrow(
        'Invalid student lead time: must be a non-negative number'
      )
    })

    it('handles month boundaries correctly', () => {
      // Jan 24 + 7 days = Jan 31
      const studentDueDate = new Date('2025-01-24T00:00:00Z')
      const result = calculateCollegeDueDate(studentDueDate, 7)
      expect(result.toISOString()).toBe('2025-01-31T00:00:00.000Z')
    })

    it('handles year boundaries correctly', () => {
      // Dec 26, 2024 + 10 days = Jan 5, 2025
      const studentDueDate = new Date('2024-12-26T00:00:00Z')
      const result = calculateCollegeDueDate(studentDueDate, 10)
      expect(result.toISOString()).toBe('2025-01-05T00:00:00.000Z')
    })
  })

  describe('generateInstallmentDueDates', () => {
    describe('monthly frequency', () => {
      it('generates single installment (count = 1)', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 1, 'monthly')

        expect(result).toHaveLength(1)
        expect(result[0].toISOString()).toBe('2025-02-01T00:00:00.000Z')
      })

      it('generates 3 monthly installments', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 3, 'monthly')

        expect(result).toHaveLength(3)
        expect(result[0].toISOString()).toBe('2025-02-01T00:00:00.000Z')
        expect(result[1].toISOString()).toBe('2025-03-01T00:00:00.000Z')
        expect(result[2].toISOString()).toBe('2025-04-01T00:00:00.000Z')
      })

      it('generates 11 monthly installments (typical case)', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 11, 'monthly')

        expect(result).toHaveLength(11)
        expect(result[0].toISOString()).toBe('2025-02-01T00:00:00.000Z')
        expect(result[10].toISOString()).toBe('2025-12-01T00:00:00.000Z')
      })

      it('verifies dates are exactly 1 month apart', () => {
        const firstDueDate = new Date('2025-02-15T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 3, 'monthly')

        expect(result[0].toISOString()).toBe('2025-02-15T00:00:00.000Z')
        expect(result[1].toISOString()).toBe('2025-03-15T00:00:00.000Z')
        expect(result[2].toISOString()).toBe('2025-04-15T00:00:00.000Z')
      })

      it('handles month boundaries (Jan 31 edge case)', () => {
        // Jan 31 + 1 month = Feb 28/29 (date-fns handles this)
        const firstDueDate = new Date('2025-01-31T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 3, 'monthly')

        expect(result[0].toISOString()).toBe('2025-01-31T00:00:00.000Z')
        // date-fns addMonths handles this: Jan 31 + 1 month = Feb 28
        expect(result[1].toISOString()).toBe('2025-02-28T00:00:00.000Z')
        expect(result[2].toISOString()).toBe('2025-03-31T00:00:00.000Z')
      })

      it('handles leap year dates', () => {
        // 2024 is a leap year
        const firstDueDate = new Date('2024-01-31T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 3, 'monthly')

        expect(result[0].toISOString()).toBe('2024-01-31T00:00:00.000Z')
        // Jan 31 + 1 month in leap year = Feb 29
        expect(result[1].toISOString()).toBe('2024-02-29T00:00:00.000Z')
        expect(result[2].toISOString()).toBe('2024-03-31T00:00:00.000Z')
      })

      it('handles year transitions', () => {
        const firstDueDate = new Date('2024-11-15T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 4, 'monthly')

        expect(result[0].toISOString()).toBe('2024-11-15T00:00:00.000Z')
        expect(result[1].toISOString()).toBe('2024-12-15T00:00:00.000Z')
        expect(result[2].toISOString()).toBe('2025-01-15T00:00:00.000Z')
        expect(result[3].toISOString()).toBe('2025-02-15T00:00:00.000Z')
      })
    })

    describe('quarterly frequency', () => {
      it('generates single installment (count = 1)', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 1, 'quarterly')

        expect(result).toHaveLength(1)
        expect(result[0].toISOString()).toBe('2025-02-01T00:00:00.000Z')
      })

      it('generates 4 quarterly installments', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 4, 'quarterly')

        expect(result).toHaveLength(4)
        expect(result[0].toISOString()).toBe('2025-02-01T00:00:00.000Z')
        expect(result[1].toISOString()).toBe('2025-05-01T00:00:00.000Z')
        expect(result[2].toISOString()).toBe('2025-08-01T00:00:00.000Z')
        expect(result[3].toISOString()).toBe('2025-11-01T00:00:00.000Z')
      })

      it('verifies dates are exactly 3 months apart', () => {
        const firstDueDate = new Date('2025-02-15T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 3, 'quarterly')

        expect(result[0].toISOString()).toBe('2025-02-15T00:00:00.000Z')
        expect(result[1].toISOString()).toBe('2025-05-15T00:00:00.000Z')
        expect(result[2].toISOString()).toBe('2025-08-15T00:00:00.000Z')
      })

      it('handles year transitions', () => {
        const firstDueDate = new Date('2024-11-01T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 3, 'quarterly')

        expect(result[0].toISOString()).toBe('2024-11-01T00:00:00.000Z')
        expect(result[1].toISOString()).toBe('2025-02-01T00:00:00.000Z')
        expect(result[2].toISOString()).toBe('2025-05-01T00:00:00.000Z')
      })

      it('handles month boundaries with quarterly', () => {
        // May 31 + 3 months = Aug 31
        const firstDueDate = new Date('2025-05-31T00:00:00Z')
        const result = generateInstallmentDueDates(firstDueDate, 3, 'quarterly')

        expect(result[0].toISOString()).toBe('2025-05-31T00:00:00.000Z')
        expect(result[1].toISOString()).toBe('2025-08-31T00:00:00.000Z')
        // Aug 31 + 3 months = Nov 30 (date-fns handles this)
        expect(result[2].toISOString()).toBe('2025-11-30T00:00:00.000Z')
      })
    })

    describe('input validation', () => {
      it('throws error for invalid first due date', () => {
        expect(() => generateInstallmentDueDates(null as any, 3, 'monthly')).toThrow(
          'Invalid first due date: must be a valid Date object'
        )
        expect(() => generateInstallmentDueDates(new Date('invalid'), 3, 'monthly')).toThrow(
          'Invalid first due date: must be a valid Date object'
        )
      })

      it('throws error for count = 0', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        expect(() => generateInstallmentDueDates(firstDueDate, 0, 'monthly')).toThrow(
          'Invalid count: must be a positive integer'
        )
      })

      it('throws error for negative count', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        expect(() => generateInstallmentDueDates(firstDueDate, -1, 'monthly')).toThrow(
          'Invalid count: must be a positive integer'
        )
      })

      it('throws error for non-integer count', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        expect(() => generateInstallmentDueDates(firstDueDate, 3.5, 'monthly')).toThrow(
          'Invalid count: must be a positive integer'
        )
      })

      it('throws error for invalid frequency', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        expect(() => generateInstallmentDueDates(firstDueDate, 3, 'weekly' as any)).toThrow(
          "Invalid frequency: must be 'monthly' or 'quarterly'"
        )
        expect(() => generateInstallmentDueDates(firstDueDate, 3, 'yearly' as any)).toThrow(
          "Invalid frequency: must be 'monthly' or 'quarterly'"
        )
      })

      it('throws error for non-string frequency', () => {
        const firstDueDate = new Date('2025-02-01T00:00:00Z')
        expect(() => generateInstallmentDueDates(firstDueDate, 3, 123 as any)).toThrow(
          "Invalid frequency: must be 'monthly' or 'quarterly'"
        )
      })
    })
  })
})
