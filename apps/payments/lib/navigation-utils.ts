/**
 * Navigation Utilities
 *
 * Constructs zone URLs for multi-zone architecture.
 * Uses production URLs by default, relative paths only for localhost.
 */

const PRODUCTION_URLS = {
  dashboard: 'https://dashboard.plenno.com.au',
  entities: 'https://entities.plenno.com.au',
  payments: 'https://payments.plenno.com.au',
  reports: 'https://reports.plenno.com.au',
} as const

type ZoneName = keyof typeof PRODUCTION_URLS

/**
 * Check if running on localhost (for development only)
 */
function isLocalhost(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    return hostname === 'localhost' || hostname === '127.0.0.1'
  }
  // Server-side: check NODE_ENV
  return process.env.NODE_ENV === 'development'
}

/**
 * Get the base URL for a zone
 */
function getZoneBaseUrl(zone: ZoneName): string | undefined {
  // Environment variables take priority (if set)
  const envUrls: Record<ZoneName, string | undefined> = {
    dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL,
    entities: process.env.NEXT_PUBLIC_ENTITIES_URL,
    payments: process.env.NEXT_PUBLIC_PAYMENTS_URL,
    reports: process.env.NEXT_PUBLIC_REPORTS_URL,
  }

  if (envUrls[zone]) {
    return envUrls[zone]
  }

  // Localhost development: use relative paths (for Next.js rewrites)
  if (isLocalhost()) {
    return undefined
  }

  // Production/Preview/Unknown: always use production URLs
  return PRODUCTION_URLS[zone]
}

/**
 * Constructs the full URL for a zone and path
 */
export function getZoneUrl(zone: ZoneName, path: string): string {
  const baseUrl = getZoneBaseUrl(zone)

  if (!baseUrl) {
    return path
  }

  return `${baseUrl}${path}`
}
