/**
 * Navigation Utilities
 *
 * Utilities for constructing proper zone URLs in the multi-zone architecture.
 * Uses environment variables to determine the correct base URL for each zone.
 */

/**
 * Get zone URLs from environment variables
 */
const getZoneUrls = () => ({
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL,
  entities: process.env.NEXT_PUBLIC_ENTITIES_URL,
  payments: process.env.NEXT_PUBLIC_PAYMENTS_URL,
  reports: process.env.NEXT_PUBLIC_REPORTS_URL,
})

type ZoneName = keyof ReturnType<typeof getZoneUrls>

/**
 * Constructs the full URL for a given zone and path
 * @param zone - The zone name (dashboard, entities, payments, reports)
 * @param path - The path within the zone (e.g., '/payments', '/reports')
 * @returns The full URL including the zone domain, or relative path if no env var configured
 */
export function getZoneUrl(zone: ZoneName, path: string): string {
  const zoneUrls = getZoneUrls()
  const baseUrl = zoneUrls[zone]

  // If no environment URL configured, use relative path (dev mode with rewrites)
  if (!baseUrl) return path

  return `${baseUrl}${path}`
}
