/**
 * Notification Validation Schemas
 *
 * Zod schemas for notification rules, templates, and user preferences.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 2: Notification Settings UI
 */

import { z } from 'zod'

// ============================================================
// ENUMS
// ============================================================

export const RecipientTypeEnum = z.enum([
  'agency_user',
  'student',
  'college',
  'sales_agent',
])

export const EventTypeEnum = z.enum(['overdue', 'due_soon', 'payment_received'])

// ============================================================
// NOTIFICATION RULE SCHEMAS
// ============================================================

/**
 * Trigger configuration for notification rules
 */
export const TriggerConfigSchema = z
  .object({
    advance_hours: z.number().min(1).max(168).optional(), // Up to 7 days
    trigger_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // 24h format HH:MM
    timezone: z.string().optional(), // IANA timezone string
  })
  .optional()
  .default({})

/**
 * Create notification rule schema
 */
export const NotificationRuleCreateSchema = z.object({
  agency_id: z.string().uuid(),
  recipient_type: RecipientTypeEnum,
  event_type: EventTypeEnum,
  is_enabled: z.boolean().default(false),
  template_id: z.string().uuid().nullable().optional(),
  trigger_config: TriggerConfigSchema,
})

/**
 * Update notification rule schema (all fields optional except is_enabled)
 */
export const NotificationRuleUpdateSchema = z.object({
  is_enabled: z.boolean().optional(),
  template_id: z.string().uuid().nullable().optional(),
  trigger_config: TriggerConfigSchema,
})

/**
 * Batch update notification rules schema
 * Used by the settings page to update multiple rules at once
 */
export const NotificationRulesBatchUpdateSchema = z.object({
  rules: z.array(
    z.object({
      recipient_type: RecipientTypeEnum,
      event_type: EventTypeEnum,
      is_enabled: z.boolean(),
    })
  ),
})

// ============================================================
// EMAIL TEMPLATE SCHEMAS
// ============================================================

/**
 * Email template variables schema
 */
export const TemplateVariablesSchema = z.record(z.string()).optional().default({})

/**
 * Create email template schema
 */
export const EmailTemplateCreateSchema = z.object({
  agency_id: z.string().uuid(),
  template_type: z.string().min(1).max(100),
  subject: z.string().min(1).max(500),
  body_html: z.string().min(1),
  variables: TemplateVariablesSchema,
})

/**
 * Update email template schema
 */
export const EmailTemplateUpdateSchema = z.object({
  template_type: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(500).optional(),
  body_html: z.string().min(1).optional(),
  variables: TemplateVariablesSchema,
})

// ============================================================
// USER PREFERENCES SCHEMA
// ============================================================

/**
 * User email notification preferences update schema
 */
export const UserEmailPreferencesSchema = z.object({
  email_notifications_enabled: z.boolean(),
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type RecipientType = z.infer<typeof RecipientTypeEnum>
export type EventType = z.infer<typeof EventTypeEnum>
export type TriggerConfig = z.infer<typeof TriggerConfigSchema>
export type NotificationRuleCreate = z.infer<typeof NotificationRuleCreateSchema>
export type NotificationRuleUpdate = z.infer<typeof NotificationRuleUpdateSchema>
export type NotificationRulesBatchUpdate = z.infer<typeof NotificationRulesBatchUpdateSchema>
export type EmailTemplateCreate = z.infer<typeof EmailTemplateCreateSchema>
export type EmailTemplateUpdate = z.infer<typeof EmailTemplateUpdateSchema>
export type UserEmailPreferences = z.infer<typeof UserEmailPreferencesSchema>

// ============================================================
// CONSTANTS
// ============================================================

export const RECIPIENT_TYPES = RecipientTypeEnum.options
export const EVENT_TYPES = EventTypeEnum.options

export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
  agency_user: 'Agency Users',
  student: 'Students',
  college: 'Colleges',
  sales_agent: 'Sales Agents',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  overdue: 'Overdue Payments',
  due_soon: 'Due Soon (36 hours before)',
  payment_received: 'Payment Received',
}

export const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  overdue: 'Send notification when a payment becomes overdue',
  due_soon: 'Send notification 36 hours before payment is due',
  payment_received: 'Send notification when a payment is recorded',
}
