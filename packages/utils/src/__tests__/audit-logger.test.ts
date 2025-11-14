/**
 * Audit Logger Utility Tests
 *
 * Unit tests for the audit logging functionality including:
 * - Successful audit log creation
 * - Graceful failure handling
 * - Missing optional fields
 * - Query functionality
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 12: Audit Logging
 *
 * @module packages/utils/src/__tests__/audit-logger.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  logAudit,
  canLogAudit,
  getAuditLogs,
  getEnrollmentAuditHistory,
  getDocumentUploadHistory,
  type AuditLogParams,
} from '../audit-logger'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('logAudit', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock Supabase client
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }
  })

  it('should successfully insert audit log entry with all fields', async () => {
    // Arrange
    const mockInsertResponse = { data: null, error: null }
    mockSupabaseClient.insert.mockResolvedValue(mockInsertResponse)

    const auditParams: AuditLogParams = {
      userId: 'user-123',
      agencyId: 'agency-456',
      entityType: 'payment_plan',
      entityId: 'plan-789',
      action: 'create',
      newValues: {
        total_amount: 10000,
        commission_rate: 0.15,
      },
      metadata: {
        commission_calculation: {
          formula: 'total * rate',
          total: 10000,
          rate: 0.15,
        },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    }

    // Act
    await logAudit(mockSupabaseClient, auditParams)

    // Assert
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      agency_id: 'agency-456',
      entity_type: 'payment_plan',
      entity_id: 'plan-789',
      action: 'create',
      old_values: null,
      new_values: {
        total_amount: 10000,
        commission_rate: 0.15,
      },
      metadata: {
        commission_calculation: {
          formula: 'total * rate',
          total: 10000,
          rate: 0.15,
        },
      },
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0',
    })
  })

  it('should successfully insert audit log with minimal required fields', async () => {
    // Arrange
    const mockInsertResponse = { data: null, error: null }
    mockSupabaseClient.insert.mockResolvedValue(mockInsertResponse)

    const auditParams: AuditLogParams = {
      userId: 'user-123',
      agencyId: 'agency-456',
      entityType: 'payment_plan',
      entityId: 'plan-789',
      action: 'create',
    }

    // Act
    await logAudit(mockSupabaseClient, auditParams)

    // Assert
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      agency_id: 'agency-456',
      entity_type: 'payment_plan',
      entity_id: 'plan-789',
      action: 'create',
      old_values: null,
      new_values: null,
      metadata: null,
      ip_address: null,
      user_agent: null,
    })
  })

  it('should handle insert errors gracefully without throwing', async () => {
    // Arrange
    const mockError = { message: 'Database connection failed', code: 'PGRST301' }
    mockSupabaseClient.insert.mockResolvedValue({ data: null, error: mockError })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const auditParams: AuditLogParams = {
      userId: 'user-123',
      agencyId: 'agency-456',
      entityType: 'payment_plan',
      entityId: 'plan-789',
      action: 'create',
    }

    // Act - should not throw
    await expect(logAudit(mockSupabaseClient, auditParams)).resolves.not.toThrow()

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to create audit log entry:',
      expect.objectContaining({
        error: mockError,
        params: {
          entityType: 'payment_plan',
          entityId: 'plan-789',
          action: 'create',
        },
      })
    )

    consoleSpy.mockRestore()
  })

  it('should handle unexpected exceptions gracefully without throwing', async () => {
    // Arrange
    mockSupabaseClient.insert.mockRejectedValue(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const auditParams: AuditLogParams = {
      userId: 'user-123',
      agencyId: 'agency-456',
      entityType: 'payment_plan',
      entityId: 'plan-789',
      action: 'create',
    }

    // Act - should not throw
    await expect(logAudit(mockSupabaseClient, auditParams)).resolves.not.toThrow()

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      'Unexpected error during audit logging:',
      expect.any(Object)
    )

    consoleSpy.mockRestore()
  })

  it('should support different action types', async () => {
    // Arrange
    mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null })

    const actions: Array<'create' | 'update' | 'delete'> = ['create', 'update', 'delete']

    // Act & Assert
    for (const action of actions) {
      await logAudit(mockSupabaseClient, {
        userId: 'user-123',
        agencyId: 'agency-456',
        entityType: 'payment_plan',
        entityId: 'plan-789',
        action,
      })

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({ action })
      )
    }
  })
})

describe('canLogAudit', () => {
  it('should return true for valid client', () => {
    const mockClient = {} as SupabaseClient
    expect(canLogAudit(mockClient)).toBe(true)
  })

  it('should return false for null client', () => {
    expect(canLogAudit(null as any)).toBe(false)
  })

  it('should return false for undefined client', () => {
    expect(canLogAudit(undefined as any)).toBe(false)
  })
})

describe('getAuditLogs', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }
  })

  it('should fetch audit logs with default options', async () => {
    // Arrange
    const mockData = [
      {
        id: 'log-1',
        user_id: 'user-123',
        agency_id: 'agency-456',
        entity_type: 'payment_plan',
        entity_id: 'plan-789',
        action: 'create',
        old_values: null,
        new_values: { amount: 10000 },
        metadata: null,
        ip_address: null,
        user_agent: null,
        timestamp: '2025-01-01T00:00:00Z',
      },
    ]

    mockSupabaseClient.range.mockResolvedValue({ data: mockData, error: null })

    // Act
    const result = await getAuditLogs(mockSupabaseClient, 'agency-456')

    // Assert
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    expect(mockSupabaseClient.select).toHaveBeenCalledWith('*')
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('agency_id', 'agency-456')
    expect(mockSupabaseClient.order).toHaveBeenCalledWith('timestamp', { ascending: false })
    expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 49) // Default limit 50
    expect(result).toEqual(mockData)
  })

  it('should apply entity type filter', async () => {
    // Arrange
    mockSupabaseClient.range.mockResolvedValue({ data: [], error: null })

    // Act
    await getAuditLogs(mockSupabaseClient, 'agency-456', {
      entityType: 'payment_plan',
    })

    // Assert
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('entity_type', 'payment_plan')
  })

  it('should apply pagination correctly', async () => {
    // Arrange
    mockSupabaseClient.range.mockResolvedValue({ data: [], error: null })

    // Act
    await getAuditLogs(mockSupabaseClient, 'agency-456', {
      limit: 20,
      offset: 40,
    })

    // Assert
    expect(mockSupabaseClient.range).toHaveBeenCalledWith(40, 59) // offset 40, limit 20
  })

  it('should throw error on database failure', async () => {
    // Arrange
    const mockError = { message: 'Database error' }
    mockSupabaseClient.range.mockResolvedValue({ data: null, error: mockError })

    // Act & Assert
    await expect(
      getAuditLogs(mockSupabaseClient, 'agency-456')
    ).rejects.toThrow('Failed to fetch audit logs: Database error')
  })
})

describe('getEnrollmentAuditHistory', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }
  })

  it('should fetch enrollment audit history', async () => {
    // Arrange
    const mockData = [
      {
        id: 'log-1',
        entity_type: 'enrollment',
        entity_id: 'enroll-123',
        action: 'create',
        timestamp: '2025-01-01T00:00:00Z',
      },
    ]

    mockSupabaseClient.order.mockResolvedValue({ data: mockData, error: null })

    // Act
    const result = await getEnrollmentAuditHistory(
      mockSupabaseClient,
      'agency-456',
      'enroll-123'
    )

    // Assert
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('agency_id', 'agency-456')
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('entity_id', 'enroll-123')
    expect(mockSupabaseClient.in).toHaveBeenCalledWith('entity_type', [
      'enrollment',
      'enrollment_document',
    ])
    expect(result).toEqual(mockData)
  })
})

describe('getDocumentUploadHistory', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }
  })

  it('should fetch document upload history', async () => {
    // Arrange
    const mockData = [
      {
        id: 'log-1',
        entity_type: 'enrollment_document',
        action: 'create',
        timestamp: '2025-01-01T00:00:00Z',
      },
    ]

    mockSupabaseClient.range.mockResolvedValue({ data: mockData, error: null })

    // Act
    const result = await getDocumentUploadHistory(mockSupabaseClient, 'agency-456', 20)

    // Assert
    expect(result).toEqual(mockData)
  })
})
