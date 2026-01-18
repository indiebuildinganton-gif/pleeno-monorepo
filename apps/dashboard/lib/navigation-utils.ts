/**
 * Navigation Utilities
 *
 * Utilities for constructing proper zone URLs in the multi-zone architecture.
 * Uses environment variables to determine the correct base URL for each zone,
 * with production fallbacks for the .plenno.com.au domains.
 */

// Production zone URLs
const PRODUCTION_URLS = {
  dashboard: 'https://dashboard.plenno.com.au',
  entities: 'https://entities.plenno.com.au',
  payments: 'https://payments.plenno.com.au',
  reports: 'https://reports.plenno.com.au',
} as const

/**
 * Check if we're running on a production domain
 * Uses client-side hostname detection as the primary check since
 * NEXT_PUBLIC_ env vars are embedded at build time and may not be reliable
 */
const isProductionDomain = (): boolean => {
  // Client-side check: if on a .plenno.com.au domain, we're in production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname.endsWith('.plenno.com.au') || hostname === 'plenno.com.au') {
      return true
    }
    // If on localhost, we're in development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return false
    }
  }

  // Server-side/build-time fallback checks
  if (process.env.NODE_ENV === 'production') {
    return true
  }

  if (process.env.NODE_ENV === 'development') {
    return false
  }

  // Default to production if we can't determine
  return true
}

/**
 * Get default zone URLs based on environment
 * In development, returns undefined to use relative paths (Next.js rewrites)
 * In production, use the production URLs
 */
const getDefaultZoneUrls = () => {
  if (!isProductionDomain()) {
    return {
      dashboard: undefined,
      entities: undefined,
      payments: undefined,
      reports: undefined,
    }
  }

  return PRODUCTION_URLS
}

/**
 * Get zone URLs - environment variables take precedence over defaults
 */
const getZoneUrls = () => {
  const defaults = getDefaultZoneUrls()

  return {
    dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || defaults.dashboard,
    entities: process.env.NEXT_PUBLIC_ENTITIES_URL || defaults.entities,
    payments: process.env.NEXT_PUBLIC_PAYMENTS_URL || defaults.payments,
    reports: process.env.NEXT_PUBLIC_REPORTS_URL || defaults.reports,
  }
}

type ZoneName = keyof ReturnType<typeof getZoneUrls>

/**
 * Constructs the full URL for a given zone and path
 * @param zone - The zone name (dashboard, entities, payments, reports)
 * @param path - The path within the zone (e.g., '/payments', '/reports')
 * @returns The full URL including the zone domain, or relative path in dev mode
 */
export function getZoneUrl(zone: ZoneName, path: string): string {
  const zoneUrls = getZoneUrls()
  const baseUrl = zoneUrls[zone]

  // If no URL configured (dev mode), use relative path for Next.js rewrites
  if (!baseUrl) return path

  return `${baseUrl}${path}`
}
