/**
 * Notification Schema Validation Tests
 *
 * Tests for notification rule and email template validation schemas
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 2: Notification Settings UI
 */

import { describe, it, expect } from 'vitest'
import {
  NotificationRuleCreateSchema,
  NotificationRuleUpdateSchema,
  NotificationRulesBatchUpdateSchema,
  EmailTemplateCreateSchema,
  EmailTemplateUpdateSchema,
  UserEmailPreferencesSchema,
  RecipientTypeEnum,
  EventTypeEnum,
} from '../notification.schema'

describe('Notification Schemas', () => {
  describe('RecipientTypeEnum', () => {
    it('should accept valid recipient types', () => {
      expect(RecipientTypeEnum.safeParse('agency_user').success).toBe(true)
      expect(RecipientTypeEnum.safeParse('student').success).toBe(true)
      expect(RecipientTypeEnum.safeParse('college').success).toBe(true)
      expect(RecipientTypeEnum.safeParse('sales_agent').success).toBe(true)
    })

    it('should reject invalid recipient types', () => {
      expect(RecipientTypeEnum.safeParse('invalid').success).toBe(false)
      expect(RecipientTypeEnum.safeParse('').success).toBe(false)
    })
  })

  describe('EventTypeEnum', () => {
    it('should accept valid event types', () => {
      expect(EventTypeEnum.safeParse('overdue').success).toBe(true)
      expect(EventTypeEnum.safeParse('due_soon').success).toBe(true)
      expect(EventTypeEnum.safeParse('payment_received').success).toBe(true)
    })

    it('should reject invalid event types', () => {
      expect(EventTypeEnum.safeParse('invalid').success).toBe(false)
      expect(EventTypeEnum.safeParse('').success).toBe(false)
    })
  })

  describe('NotificationRuleCreateSchema', () => {
    it('should validate correct notification rule', () => {
      const validRule = {
        agency_id: '123e4567-e89b-12d3-a456-426614174000',
        recipient_type: 'agency_user',
        event_type: 'overdue',
        is_enabled: true,
        template_id: '123e4567-e89b-12d3-a456-426614174001',
        trigger_config: {
          advance_hours: 36,
          trigger_time: '05:00',
          timezone: 'Australia/Brisbane',
        },
      }

      const result = NotificationRuleCreateSchema.safeParse(validRule)
      expect(result.success).toBe(true)
    })

    it('should require agency_id to be UUID', () => {
      const invalidRule = {
        agency_id: 'not-a-uuid',
        recipient_type: 'agency_user',
        event_type: 'overdue',
        is_enabled: true,
      }

      const result = NotificationRuleCreateSchema.safeParse(invalidRule)
      expect(result.success).toBe(false)
    })

    it('should default is_enabled to false', () => {
      const rule = {
        agency_id: '123e4567-e89b-12d3-a456-426614174000',
        recipient_type: 'agency_user',
        event_type: 'overdue',
      }

      const result = NotificationRuleCreateSchema.safeParse(rule)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_enabled).toBe(false)
      }
    })

    it('should validate trigger_time format', () => {
      const invalidRule = {
        agency_id: '123e4567-e89b-12d3-a456-426614174000',
        recipient_type: 'agency_user',
        event_type: 'overdue',
        is_enabled: true,
        trigger_config: {
          trigger_time: '25:00', // Invalid hour
        },
      }

      const result = NotificationRuleCreateSchema.safeParse(invalidRule)
      expect(result.success).toBe(false)
    })

    it('should validate advance_hours range', () => {
      const invalidRule = {
        agency_id: '123e4567-e89b-12d3-a456-426614174000',
        recipient_type: 'agency_user',
        event_type: 'overdue',
        is_enabled: true,
        trigger_config: {
          advance_hours: 200, // Greater than max 168 (7 days)
        },
      }

      const result = NotificationRuleCreateSchema.safeParse(invalidRule)
      expect(result.success).toBe(false)
    })
  })

  describe('NotificationRuleUpdateSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        is_enabled: true,
      }

      const result = NotificationRuleUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it('should allow null template_id', () => {
      const update = {
        template_id: null,
      }

      const result = NotificationRuleUpdateSchema.safeParse(update)
      expect(result.success).toBe(true)
    })
  })

  describe('NotificationRulesBatchUpdateSchema', () => {
    it('should validate batch update with multiple rules', () => {
      const batchUpdate = {
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'overdue',
            is_enabled: true,
          },
          {
            recipient_type: 'student',
            event_type: 'due_soon',
            is_enabled: false,
          },
        ],
      }

      const result = NotificationRulesBatchUpdateSchema.safeParse(batchUpdate)
      expect(result.success).toBe(true)
    })

    it('should accept empty rules array', () => {
      const batchUpdate = {
        rules: [],
      }

      const result = NotificationRulesBatchUpdateSchema.safeParse(batchUpdate)
      expect(result.success).toBe(true)
    })

    it('should require is_enabled for each rule', () => {
      const invalidBatch = {
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'overdue',
            // missing is_enabled
          },
        ],
      }

      const result = NotificationRulesBatchUpdateSchema.safeParse(invalidBatch)
      expect(result.success).toBe(false)
    })
  })

  describe('EmailTemplateCreateSchema', () => {
    it('should validate correct email template', () => {
      const validTemplate = {
        agency_id: '123e4567-e89b-12d3-a456-426614174000',
        template_type: 'overdue_student',
        subject: 'Payment Overdue Reminder',
        body_html: '<p>Dear {{student.name}}, your payment is overdue.</p>',
        variables: {
          student_name: '{{student.name}}',
          amount: '{{installment.amount}}',
        },
      }

      const result = EmailTemplateCreateSchema.safeParse(validTemplate)
      expect(result.success).toBe(true)
    })

    it('should require subject to be non-empty', () => {
      const invalidTemplate = {
        agency_id: '123e4567-e89b-12d3-a456-426614174000',
        template_type: 'overdue_student',
        subject: '',
        body_html: '<p>Content</p>',
      }

      const result = EmailTemplateCreateSchema.safeParse(invalidTemplate)
      expect(result.success).toBe(false)
    })

    it('should require body_html to be non-empty', () => {
      const invalidTemplate = {
        agency_id: '123e4567-e89b-12d3-a456-426614174000',
        template_type: 'overdue_student',
        subject: 'Subject',
        body_html: '',
      }

      const result = EmailTemplateCreateSchema.safeParse(invalidTemplate)
      expect(result.success).toBe(false)
    })
  })

  describe('UserEmailPreferencesSchema', () => {
    it('should validate boolean preference', () => {
      const validPreference = {
        email_notifications_enabled: true,
      }

      const result = UserEmailPreferencesSchema.safeParse(validPreference)
      expect(result.success).toBe(true)
    })

    it('should reject non-boolean values', () => {
      const invalidPreference = {
        email_notifications_enabled: 'yes',
      }

      const result = UserEmailPreferencesSchema.safeParse(invalidPreference)
      expect(result.success).toBe(false)
    })

    it('should require email_notifications_enabled field', () => {
      const invalidPreference = {}

      const result = UserEmailPreferencesSchema.safeParse(invalidPreference)
      expect(result.success).toBe(false)
    })
  })
})
