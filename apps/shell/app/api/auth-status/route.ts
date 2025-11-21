import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.app_metadata?.role,
        agency_id: user.app_metadata?.agency_id
      } : null,
      error: error?.message,
      cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: c.value.length > 0 })),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV
    })
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 })
  }
}
