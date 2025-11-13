import { PageErrorBoundary } from '@pleeno/ui'

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
