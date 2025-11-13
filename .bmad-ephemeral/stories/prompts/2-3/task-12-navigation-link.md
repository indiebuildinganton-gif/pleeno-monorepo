# Task 12: Add Navigation Link to User Management

**Story:** 2.3 User Management Interface
**AC:** 1

## Context

Add a navigation link to the user management page, visible only to admins.

## Task

Update the agency app layout to include a "Users" navigation link.

## Requirements

1. Update file: `apps/agency/app/layout.tsx`
2. Add "Users" link to navigation
3. Link to `/agency/users` or `/users` (depending on routing structure)
4. Active state highlighting for current page
5. Admin-only visibility (hide from regular users)

## Implementation

```typescript
// apps/agency/app/layout.tsx
import { createServerClient } from '@pleeno/database'
import { redirect } from 'next/navigation'
import { Navigation } from './components/Navigation'

export default async function AgencyLayout({
  children
}: {
  children: React.Node
}) {
  const supabase = await createServerClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get current user role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = currentUser?.role === 'agency_admin'

  return (
    <div className="min-h-screen">
      <Navigation
        userName={currentUser?.full_name || ''}
        isAdmin={isAdmin}
      />
      <main>{children}</main>
    </div>
  )
}
```

```typescript
// apps/agency/app/components/Navigation.tsx (or wherever navigation is defined)
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@pleeno/ui/lib/utils'
import { Users, LayoutDashboard, Settings } from 'lucide-react'

interface NavigationProps {
  userName: string
  isAdmin: boolean
}

export function Navigation({ userName, isAdmin }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      adminOnly: false
    },
    {
      label: 'Users',
      href: '/users',
      icon: Users,
      adminOnly: true
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      adminOnly: false
    }
  ]

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center gap-6 px-4 py-3">
        <div className="font-semibold">Agency Portal</div>
        <div className="flex gap-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {userName}
        </div>
      </div>
    </nav>
  )
}
```

## Architecture Alignment

- Location: `apps/agency/app/layout.tsx` or navigation component
- Check user role in layout (Server Component)
- Pass `isAdmin` flag to Navigation component
- Client Component handles active state
- Use Next.js Link for navigation
- Use lucide-react for icons

## Navigation Structure

```
┌─────────────────────────────────────────────┐
│ Agency Portal  [Dashboard] [Users] [Settings]  John Doe │
└─────────────────────────────────────────────┘
```

**Active State:**
- Blue background for active link
- White text for active link
- Gray text for inactive links
- Hover state for inactive links

## Conditional Rendering

```typescript
const visibleItems = navItems.filter(item =>
  !item.adminOnly || isAdmin
)
```

Only show "Users" link if user is admin.

## Acceptance Criteria

- [ ] Navigation updated with "Users" link
- [ ] Link points to correct path
- [ ] Users icon displayed
- [ ] Active state works correctly
- [ ] Link only visible to admins
- [ ] Non-admins do not see link
- [ ] Hover states work
- [ ] Navigation responsive

## Active State Logic

```typescript
const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
```

This highlights:
- `/users` (list page)
- `/users/[id]` (detail page)

## Integration Points

- Layout: `apps/agency/app/layout.tsx`
- Navigation: `apps/agency/app/components/Navigation.tsx`
- User check: Server Component with Supabase
- Route: `/users` page

## Next Steps

After completing this task:
1. Verify link appears for admins
2. Verify link hidden for non-admins
3. Test active state highlighting
4. Test navigation to user page
5. Proceed to Task 13: Write Tests
