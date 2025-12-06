/**
 * Multi-Zone Redirect Handler
 *
 * This utility handles redirects across different zones in the multi-zone architecture.
 * It detects which zone a path belongs to and constructs the appropriate URL.
 */

/**
 * Zone configuration mapping paths to their respective zone URLs
 */
const zoneConfig = {
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.plenno.com.au',
  agency: process.env.NEXT_PUBLIC_AGENCY_URL || 'https://agency.plenno.com.au',
  entities: process.env.NEXT_PUBLIC_ENTITIES_URL || 'https://entities.plenno.com.au',
  payments: process.env.NEXT_PUBLIC_PAYMENTS_URL || 'https://payments.plenno.com.au',
  reports: process.env.NEXT_PUBLIC_REPORTS_URL || 'https://reports.plenno.com.au',
}

/**
 * Determines if a path belongs to a specific zone and returns the full URL
 * @param path - The redirect path (e.g., '/reports/payment-plans', '/dashboard')
 * @returns The full URL including the zone domain, or the path if it belongs to the shell
 */
export function getMultiZoneRedirectUrl(path: string): string {
  // Handle root paths
  if (path === '/' || !path) {
    return '/dashboard'
  }

  // Extract the first segment of the path
  const segments = path.split('/').filter(Boolean)
  const firstSegment = segments[0]?.toLowerCase()

  // Check if this path belongs to another zone
  if (firstSegment && firstSegment in zoneConfig) {
    const zoneUrl = zoneConfig[firstSegment as keyof typeof zoneConfig]
    // Remove the zone prefix from the path
    const zonePath = '/' + segments.slice(1).join('/')
    return `${zoneUrl}${zonePath || ''}`
  }

  // Default: path belongs to the shell zone
  return path
}

/**
 * Checks if a redirect URL is external (belongs to another zone)
 * @param url - The redirect URL to check
 * @returns True if the URL is external, false otherwise
 */
export function isExternalZoneRedirect(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}