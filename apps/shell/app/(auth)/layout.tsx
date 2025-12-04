import { PageErrorBoundary } from '@pleeno/ui'

export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageErrorBoundary>
      <div className="min-h-screen">{children}</div>
    </PageErrorBoundary>
  )
}
