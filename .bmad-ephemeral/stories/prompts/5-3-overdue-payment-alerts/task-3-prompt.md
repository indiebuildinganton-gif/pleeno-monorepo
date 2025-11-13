# Task 3: Build Notification UI Components

## Context
You are implementing Story 5.3: Overdue Payment Alerts - Task 3 of 5.

This task creates the user-facing notification interface, including a notification bell icon in the header, dropdown component, and full notifications page. This provides agency users with immediate visibility into overdue payment alerts.

## Story Overview
**As an** Agency User
**I want** to receive in-app notifications for overdue payments
**So that** I'm immediately aware when follow-up action is needed

## Prerequisites
- Task 1 completed: Notifications table and API routes exist
- Task 2 completed: Notifications are being generated for overdue installments

## Acceptance Criteria for This Task
- AC 2: The notification shows the number of overdue installments
- AC 3: Clicking the notification takes me to a filtered view of overdue payments
- AC 4: I can dismiss notifications after reviewing

## Your Task
Build notification UI components with bell icon, dropdown, and full page:

### Subtasks:
1. Add notification bell icon in shell/app header with unread count badge
2. Create NotificationDropdown component showing recent notifications
3. Implement click handler to navigate to notification.link
4. Add "Mark as read" functionality with optimistic UI update
5. Create /notifications page listing all notifications (read/unread)
6. Add "Dismiss" button to mark notifications as read
7. Style unread notifications distinctly (bold, blue background)

## Technical Specifications

### Component 1: NotificationBell
Location: `apps/shell/app/components/NotificationBell.tsx`

**Purpose:** Header bell icon with unread count badge

**Features:**
- Bell icon from lucide-react (or shadcn/ui)
- Badge showing unread notification count
- Dropdown toggle on click
- Auto-refresh every 60 seconds (TanStack Query polling)
- Hide badge if count is 0

**Implementation Pattern:**

```typescript
'use client';

import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count
  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?is_read=false&limit=100');
      return res.json();
    },
    refetchInterval: 60000, // Poll every 60 seconds
  });

  const unreadCount = notifications?.data?.length || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications?.data || []}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

### Component 2: NotificationDropdown
Location: `apps/shell/app/components/NotificationDropdown.tsx`

**Purpose:** Dropdown showing recent notifications (5-10 max)

**Features:**
- Display recent 5-10 notifications
- Click notification to navigate to link
- "Mark as read" button per notification
- "View all notifications" link at bottom
- Relative timestamps (e.g., "2 hours ago") using date-fns
- Distinct styling for unread (bold text, blue background)

**Implementation Pattern:**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { X } from 'lucide-react';
import { Notification } from '@/types/notifications';

interface Props {
  notifications: Notification[];
  onClose: () => void;
}

export function NotificationDropdown({ notifications, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    onClose();
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          recentNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.is_read ? 'bg-blue-50 font-semibold' : ''
              }`}
            >
              <p className="text-sm text-gray-800">{notification.message}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
                {!notification.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsReadMutation.mutate(notification.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <a
          href="/notifications"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          onClick={onClose}
        >
          View all notifications →
        </a>
      </div>
    </div>
  );
}
```

### Page: All Notifications List
Location: `apps/shell/app/notifications/page.tsx`

**Purpose:** Full page showing all notifications (read and unread)

**Features:**
- Paginated list of all notifications
- Filter by read/unread status (tabs or dropdown)
- "Mark all as read" button
- Distinct styling for unread notifications
- Click notification to navigate to link
- Breadcrumb: Dashboard > Notifications

**Implementation Pattern:**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list', filter],
    queryFn: async () => {
      const params = filter === 'unread' ? '?is_read=false' : '';
      const res = await fetch(`/api/notifications${params}`);
      return res.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const notifications = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {/* Filter tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications to display
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                !notification.is_read
                  ? 'bg-blue-50 border-blue-200 font-semibold'
                  : 'bg-white border-gray-200'
              }`}
            >
              <p className="text-sm">{notification.message}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
                {!notification.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsReadMutation.mutate(notification.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Integration with Shell Layout
Update: `apps/shell/app/layout.tsx` (or wherever header/navigation is rendered)

Add NotificationBell component to header navigation:

```typescript
import { NotificationBell } from '@/components/NotificationBell';

// In your header component:
<header className="...">
  {/* Other nav items */}
  <NotificationBell />
  {/* User menu */}
</header>
```

## Styling Specifications

### Unread Notification Styling
- Background: `bg-blue-50` (light blue)
- Border: `border-blue-200`
- Font weight: `font-semibold`
- Badge: Red background (`bg-red-600`), white text

### Read Notification Styling
- Background: `bg-white`
- Border: `border-gray-200`
- Font weight: `font-normal`
- Text color: `text-gray-600` (slightly muted)

### Bell Icon Badge
- Background: Red (`bg-red-600`)
- Text: White, bold, extra small font
- Position: Absolute top-right of bell icon
- Show count up to 99, then "99+"

## Testing Requirements

### Component Tests
Location: `apps/shell/app/components/__tests__/`

**Test Cases:**
1. NotificationBell
   - Displays correct unread count badge
   - Badge hidden when count is 0
   - Opens dropdown on click
   - Closes dropdown when clicking outside

2. NotificationDropdown
   - Displays recent 10 notifications
   - Unread notifications styled with blue background
   - Click notification navigates to link
   - "Mark as read" button updates notification state
   - Optimistic UI update (notification marked read immediately)

3. Notifications Page
   - Filters by all/unread tabs
   - Paginated list displays correctly
   - Click notification navigates to link
   - "Dismiss" button marks notification as read

### Integration Tests
- Create notification in database → bell icon shows count
- Mark notification as read → count decrements
- Click notification → navigates to /payments/plans?status=overdue

### Manual Testing Checklist
- [ ] Bell icon appears in header
- [ ] Unread count badge displays correctly
- [ ] Click bell opens dropdown
- [ ] Dropdown shows recent notifications
- [ ] Click notification navigates to filtered payment plans
- [ ] "Mark as read" button works with optimistic update
- [ ] /notifications page displays all notifications
- [ ] Filter tabs (all/unread) work correctly
- [ ] Unread notifications styled distinctly (blue background, bold)
- [ ] Read notifications styled normally (white background)

## Dependencies
- `lucide-react` - Bell icon and other UI icons
- `date-fns` (v4.1.0) - Format relative timestamps ("2 hours ago")
- `@tanstack/react-query` (v5.90.7) - Server state management, caching, optimistic updates
- Tailwind CSS (v4.x) - Styling

## Success Criteria
- [ ] NotificationBell component integrated in shell header
- [ ] Unread count badge displays correctly
- [ ] NotificationDropdown shows recent notifications
- [ ] Click notification navigates to linked page
- [ ] "Mark as read" functionality works with optimistic update
- [ ] /notifications page displays paginated list
- [ ] Filter by read/unread status works
- [ ] Unread notifications styled distinctly
- [ ] Component tests passing

## Context Files Reference
- Story Context: `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml`
- Multi-zone architecture: Shell zone for navigation/notifications
- Shadcn UI patterns (if used in project)

## Next Steps
After completing this task:
1. Proceed to Task 4: Add overdue payments section to dashboard
2. Update the MANIFEST.md file to mark Task 3 as complete

---

**Key UX Patterns:** This task implements standard notification UX patterns (bell icon with badge, dropdown, dismissible alerts) following modern web application conventions. Focus on smooth interactions and clear visual feedback for read/unread states.
