/**
 * Notification Type Definitions
 *
 * Shared types for the notifications feature.
 * Used by API routes, frontend components, and database queries.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 1
 */

/**
 * Notification type enum
 * Defines the different categories of notifications in the system
 */
export type NotificationType =
  | 'overdue_payment' // Payment installment is overdue
  | 'due_soon' // Payment is due within threshold days
  | 'payment_received' // Payment has been received
  | 'system' // System-level notifications

/**
 * Core notification interface
 * Represents a single notification record from the database
 */
export interface Notification {
  id: string
  agency_id: string
  user_id: string | null // NULL = agency-wide notification
  type: NotificationType
  message: string
  link: string | null // Deep link to relevant page
  is_read: boolean
  created_at: string // ISO 8601 timestamp
  read_at: string | null // ISO 8601 timestamp
  updated_at: string // ISO 8601 timestamp
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Response for GET /api/notifications
 * Returns paginated list of notifications
 */
export interface NotificationListResponse {
  data: Notification[]
  pagination: PaginationMeta
}

/**
 * Response for PATCH /api/notifications/[id]/mark-read
 * Returns the updated notification
 */
export interface NotificationUpdateResponse {
  success: boolean
  notification: Notification
}

/**
 * Query parameters for GET /api/notifications
 */
export interface NotificationListParams {
  page?: number // Default: 1
  limit?: number // Default: 20
  is_read?: 'true' | 'false' // Filter by read status
}

/**
 * Database insert type for notifications
 * Used when creating new notifications (typically by backend jobs)
 */
export interface NotificationInsert {
  agency_id: string
  user_id?: string | null
  type: NotificationType
  message: string
  link?: string | null
  is_read?: boolean
}

/**
 * Error response type for API routes
 */
export interface NotificationErrorResponse {
  error: string
  details?: any
}
