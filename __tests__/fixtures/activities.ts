/**
 * Test Fixtures: Activity Feed
 *
 * Shared test data for activity feed tests
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.4: Recent Activity Feed
 * Task 8: Testing
 */

/**
 * Mock activity log entries for testing
 */
export const mockActivities = [
  {
    id: 'activity-1',
    timestamp: '2025-11-13T10:30:00Z',
    description: 'John Doe created new student Alice Smith',
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@test.com',
    },
    entity_type: 'student',
    entity_id: 'student-123',
    action: 'created',
    metadata: {
      student_name: 'Alice Smith',
    },
  },
  {
    id: 'activity-2',
    timestamp: '2025-11-13T09:15:00Z',
    description: 'System marked installment $500 as overdue for Bob Johnson',
    user: null, // System action
    entity_type: 'installment',
    entity_id: 'installment-456',
    action: 'marked_overdue',
    metadata: {
      student_name: 'Bob Johnson',
      amount: 500.0,
      payment_plan_id: 'plan-789',
    },
  },
  {
    id: 'activity-3',
    timestamp: '2025-11-13T08:45:00Z',
    description: 'Jane Smith recorded payment of $250.00 for Charlie Brown',
    user: {
      id: 'user-456',
      name: 'Jane Smith',
      email: 'jane@test.com',
    },
    entity_type: 'payment',
    entity_id: 'payment-789',
    action: 'recorded',
    metadata: {
      student_name: 'Charlie Brown',
      amount: 250.0,
      payment_plan_id: 'plan-123',
    },
  },
  {
    id: 'activity-4',
    timestamp: '2025-11-13T08:00:00Z',
    description: 'John Doe created payment plan for Diana Prince',
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@test.com',
    },
    entity_type: 'payment_plan',
    entity_id: 'plan-123',
    action: 'created',
    metadata: {
      student_name: 'Diana Prince',
      total_amount: 5000.0,
    },
  },
  {
    id: 'activity-5',
    timestamp: '2025-11-13T07:30:00Z',
    description: 'Jane Smith enrolled student Eve Wilson at MIT',
    user: {
      id: 'user-456',
      name: 'Jane Smith',
      email: 'jane@test.com',
    },
    entity_type: 'enrollment',
    entity_id: 'enrollment-123',
    action: 'created',
    metadata: {
      student_id: 'student-789',
      student_name: 'Eve Wilson',
      college_name: 'MIT',
    },
  },
]

/**
 * Mock activities for empty state testing
 */
export const mockEmptyActivities: any[] = []

/**
 * Mock system activities (no user)
 */
export const mockSystemActivities = [
  {
    id: 'activity-sys-1',
    timestamp: '2025-11-13T10:00:00Z',
    description: 'System marked 3 installments as overdue',
    user: null,
    entity_type: 'installment',
    entity_id: 'installment-batch-1',
    action: 'marked_overdue',
    metadata: {
      count: 3,
    },
  },
  {
    id: 'activity-sys-2',
    timestamp: '2025-11-13T09:00:00Z',
    description: 'System sent 5 payment reminders',
    user: null,
    entity_type: 'payment',
    entity_id: '',
    action: 'notification_sent',
    metadata: {
      count: 5,
    },
  },
]

/**
 * Mock diverse activities for icon testing
 */
export const mockDiverseActivities = [
  {
    id: 'activity-div-1',
    timestamp: new Date().toISOString(),
    description: 'Payment created',
    user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
    entity_type: 'payment',
    entity_id: 'payment-1',
    action: 'created',
    metadata: {},
  },
  {
    id: 'activity-div-2',
    timestamp: new Date().toISOString(),
    description: 'Student enrolled',
    user: { id: 'user-2', name: 'User 2', email: 'user2@example.com' },
    entity_type: 'enrollment',
    entity_id: 'enrollment-1',
    action: 'created',
    metadata: {},
  },
  {
    id: 'activity-div-3',
    timestamp: new Date().toISOString(),
    description: 'Student created',
    user: { id: 'user-3', name: 'User 3', email: 'user3@example.com' },
    entity_type: 'student',
    entity_id: 'student-1',
    action: 'created',
    metadata: {},
  },
  {
    id: 'activity-div-4',
    timestamp: new Date().toISOString(),
    description: 'Payment plan created',
    user: { id: 'user-4', name: 'User 4', email: 'user4@example.com' },
    entity_type: 'payment_plan',
    entity_id: 'plan-1',
    action: 'created',
    metadata: {},
  },
]
