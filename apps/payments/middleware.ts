import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Minimal pass-through middleware for testing
  console.log('Middleware executed for:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
