import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anon_key_prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    environment: process.env.NODE_ENV,
    app_url: process.env.NEXT_PUBLIC_APP_URL,
  })
}