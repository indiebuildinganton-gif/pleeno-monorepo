import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { createServerClient } from '@pleeno/database/server'
import { AppHeader } from './components/AppHeader'
import { Providers } from './components/Providers'
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
  description: 'Agency management platform',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Check if user is authenticated
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {user && <AppHeader />}
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
