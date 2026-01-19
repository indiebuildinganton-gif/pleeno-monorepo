import { NextRequest, NextResponse } from 'next/server'
import { createServerClientFromRequest } from '@pleeno/database/server'
import { getUserAgencyId } from '@pleeno/auth/server'

// Disable caching for authenticated routes (user-specific data)
export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client from request (required for cross-subdomain cookies in Vercel)
    const supabase = createServerClientFromRequest(request)
    const { data: { user }, error } = await supabase.auth.getUser()

    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.app_metadata?.role,
        agency_id: getUserAgencyId(user)
      } : null,
      error: error?.message,
      cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    })
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 })
  }
}
