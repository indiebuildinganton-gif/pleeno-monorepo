import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError, logInfo } from '@pleeno/utils'

/**
 * Health check endpoint to verify environment variables are loaded correctly
 *
 * GET /api/health
 *
 * Returns the status of required environment variables without exposing their values
 */
export async function GET(_request: NextRequest) {
  try {
    logInfo('Health check', {
      path: '/api/health',
    })

    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    const allConfigured = hasSupabaseUrl && hasSupabaseAnonKey && hasServiceRoleKey

    return createSuccessResponse({
      status: allConfigured ? 'healthy' : 'unhealthy',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      supabase: {
        url: hasSupabaseUrl ? 'configured' : 'missing',
        anonKey: hasSupabaseAnonKey ? 'configured' : 'missing',
        serviceRoleKey: hasServiceRoleKey ? 'configured' : 'missing',
      },
      message: allConfigured
        ? 'All required environment variables are configured'
        : 'Some required environment variables are missing. Check your .env.local file.',
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/health',
    })
  }
}
