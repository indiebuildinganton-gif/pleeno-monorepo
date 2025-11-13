import { z } from 'zod'

/**
 * List of valid IANA timezone identifiers
 * This is a subset of commonly used timezones. For a full list, see:
 * https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 */
const VALID_TIMEZONES = [
  // UTC
  'UTC',

  // Americas
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',

  // Europe
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Stockholm',
  'Europe/Copenhagen',
  'Europe/Oslo',
  'Europe/Helsinki',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Athens',
  'Europe/Istanbul',
  'Europe/Moscow',

  // Asia
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Manila',

  // Australia & Pacific
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Darwin',
  'Australia/Hobart',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',

  // Africa
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
] as const

/**
 * Zod schema for agency profile updates
 * Used for validating agency information in both frontend and backend
 */
export const AgencyUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Agency name is required')
    .max(255, 'Agency name must be less than 255 characters'),
  contact_email: z.string().email('Invalid email format'),
  contact_phone: z
    .string()
    .optional()
    .refine((phone) => {
      if (!phone) return true
      // Basic international phone number validation
      // Allows: +, digits, spaces, hyphens, parentheses
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
      return phoneRegex.test(phone.replace(/\s/g, ''))
    }, 'Invalid phone number format'),
  currency: z.enum(['AUD', 'USD', 'EUR', 'GBP', 'NZD', 'CAD'], {
    errorMap: () => ({ message: 'Currency must be one of: AUD, USD, EUR, GBP, NZD, CAD' }),
  }),
  timezone: z.string().refine(
    (tz) => {
      return (VALID_TIMEZONES as readonly string[]).includes(tz)
    },
    {
      message: `Timezone must be a valid IANA timezone identifier`,
    }
  ),
})

/**
 * TypeScript type inferred from the AgencyUpdateSchema
 * Use this type for type-safe agency update operations
 */
export type AgencyUpdate = z.infer<typeof AgencyUpdateSchema>

/**
 * Export the list of valid timezones for use in UI components
 */
export const SUPPORTED_TIMEZONES = VALID_TIMEZONES

/**
 * Export the list of supported currencies for use in UI components
 */
export const SUPPORTED_CURRENCIES = ['AUD', 'USD', 'EUR', 'GBP', 'NZD', 'CAD'] as const
