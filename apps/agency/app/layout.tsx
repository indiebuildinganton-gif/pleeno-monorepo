import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ToastProvider } from '@pleeno/ui'
import { createServerClient } from '@pleeno/database/server'
import { isAgencyAdmin } from '@pleeno/auth'
import { Navigation } from './components/Navigation'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Pleeno Agency',
  description: 'Agency management portal',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get current user for navigation
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userName = ''
  let isAdmin = false

  // If user is authenticated, fetch their profile data
  if (user) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    userName = currentUser?.full_name || ''
    isAdmin = currentUser?.role === 'agency_admin'
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          {user && <Navigation userName={userName} isAdmin={isAdmin} />}
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
