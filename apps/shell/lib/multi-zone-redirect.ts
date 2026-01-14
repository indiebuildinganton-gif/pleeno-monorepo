/**
 * Multi-Zone Redirect Handler
 *
 * This utility handles redirects across different zones in the multi-zone architecture.
 * It detects which zone a path belongs to and constructs the appropriate URL.
 */

/**
 * Get default zone URLs based on environment
 * In development, use localhost with appropriate ports
 * In production, use the production URLs
 */
const getDefaultZoneUrls = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' ||
                        process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')

  if (isDevelopment) {
    return {
      dashboard: 'http://localhost:3002',
      agency: 'http://localhost:3004',
      entities: 'http://localhost:3001',
      payments: 'http://localhost:3003',
      reports: 'http://localhost:3000',
    }
  }

  return {
    dashboard: 'https://dashboard.plenno.com.au',
    agency: 'https://agency.plenno.com.au',
    entities: 'https://entities.plenno.com.au',
    payments: 'https://payments.plenno.com.au',
    reports: 'https://reports.plenno.com.au',
  }
}

/**
 * Zone configuration mapping paths to their respective zone URLs
 * Environment variables take precedence over defaults
 */
const getZoneConfig = () => {
  const defaults = getDefaultZoneUrls()

  return {
    dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || defaults.dashboard,
    agency: process.env.NEXT_PUBLIC_AGENCY_URL || defaults.agency,
    entities: process.env.NEXT_PUBLIC_ENTITIES_URL || defaults.entities,
    payments: process.env.NEXT_PUBLIC_PAYMENTS_URL || defaults.payments,
    reports: process.env.NEXT_PUBLIC_REPORTS_URL || defaults.reports,
  }
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

  // Get the zone configuration (dynamically based on environment)
  const zoneConfig = getZoneConfig()

  // Extract the first segment of the path
  const segments = path.split('/').filter(Boolean)
  const firstSegment = segments[0]?.toLowerCase()

  // Check if this path belongs to another zone
  if (firstSegment && firstSegment in zoneConfig) {
    const zoneUrl = zoneConfig[firstSegment as keyof typeof zoneConfig]
    // Remove the zone prefix from the path, but preserve the zone name for basePath
    const remainingPath = segments.slice(1).join('/')
    // If there's no remaining path, use the zone name as the path (for basePath routing)
    const zonePath = remainingPath ? `/${remainingPath}` : `/${firstSegment}`
    return `${zoneUrl}${zonePath}`
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