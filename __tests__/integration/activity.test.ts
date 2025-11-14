/**
 * Integration Tests: Student Activity Feed API
 *
 * Tests for the GET /api/students/[id]/activity endpoint
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getActivity } from '@entities/app/api/students/[id]/activity/route'
import { testAgencies, testUsers, testStudents, testActivityLogs } from '../fixtures/students'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockSingle = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe('GET /api/students/[id]/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: {
        user: testUsers.agencyAAdmin,
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
    })

    mockOrder.mockReturnValue({
      limit: mockLimit,
    })

    mockLimit.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  it('returns activity log for a student', async () => {
    const mockActivities = [
      {
        ...testActivityLogs.studentUpdated,
        users: {
          id: testUsers.agencyAAdmin.id,
          full_name: 'Admin User',
          email: testUsers.agencyAAdmin.email,
        },
      },
      {
        ...testActivityLogs.studentCreated,
        users: {
          id: testUsers.agencyAAdmin.id,
          full_name: 'Admin User',
          email: testUsers.agencyAAdmin.email,
        },
      },
    ]

    // Mock student verification
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    // Mock activity fetch
    mockLimit.mockResolvedValueOnce({
      data: mockActivities,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/activity`)
    const response = await getActivity(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].action).toBe('updated')
    expect(data.data[1].action).toBe('created')
  })

  it('returns empty array when student has no activity', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockLimit.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/activity`)
    const response = await getActivity(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('includes user attribution with each activity', async () => {
    const mockActivity = {
      ...testActivityLogs.studentCreated,
      users: {
        id: testUsers.agencyAAdmin.id,
        full_name: 'Admin User',
        email: 'admin@agency.com',
      },
    }

    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockLimit.mockResolvedValueOnce({
      data: [mockActivity],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/activity`)
    const response = await getActivity(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data[0]).toHaveProperty('user')
    expect(data.data[0].user.full_name).toBe('Admin User')
    expect(data.data[0].user.email).toBe('admin@agency.com')
  })

  it('orders activities by created_at descending (newest first)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockLimit.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/activity`)
    await getActivity(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })

    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('limits results to 50 activities', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockLimit.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/activity`)
    await getActivity(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })

    expect(mockLimit).toHaveBeenCalledWith(50)
  })

  it('filters activities by student entity_id', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockLimit.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/activity`)
    await getActivity(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })

    expect(mockEq).toHaveBeenCalledWith('entity_type', 'student')
    expect(mockEq).toHaveBeenCalledWith('entity_id', testStudents.johnDoe.id)
  })

  it('returns 400 if student not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/students/non-existent-id/activity')
    const response = await getActivity(request, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('respects RLS - cannot access activity from different agency', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(`http://localhost/api/students/${testStudents.bobSmith.id}/activity`)
    const response = await getActivity(request, {
      params: Promise.resolve({ id: testStudents.bobSmith.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('includes metadata with activity logs', async () => {
    const mockActivity = {
      ...testActivityLogs.studentUpdated,
      metadata: {
        student_name: 'John Doe',
        changed_fields: ['visa_status'],
        old_value: 'in_process',
        new_value: 'approved',
      },
      users: {
        id: testUsers.agencyAAdmin.id,
        full_name: 'Admin User',
        email: 'admin@agency.com',
      },
    }

    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockLimit.mockResolvedValueOnce({
      data: [mockActivity],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/activity`)
    const response = await getActivity(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data[0].metadata).toEqual({
      student_name: 'John Doe',
      changed_fields: ['visa_status'],
      old_value: 'in_process',
      new_value: 'approved',
    })
  })

  it('handles various action types', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'created',
        description: 'added new student',
        entity_type: 'student',
        entity_id: testStudents.johnDoe.id,
        agency_id: testAgencies.agencyA.id,
        user_id: testUsers.agencyAAdmin.id,
        created_at: '2025-01-01T00:00:00Z',
        users: { id: testUsers.agencyAAdmin.id, full_name: 'Admin', email: 'admin@agency.com' },
      },
      {
        id: '2',
        action: 'updated',
        description: 'updated student visa status',
        entity_type: 'student',
        entity_id: testStudents.johnDoe.id,
        agency_id: testAgencies.agencyA.id,
        user_id: testUsers.agencyAAdmin.id,
        created_at: '2025-01-02T00:00:00Z',
        users: { id: testUsers.agencyAAdmin.id, full_name: 'Admin', email: 'admin@agency.com' },
      },
      {
        id: '3',
        action: 'note_added',
        description: 'added a note',
        entity_type: 'student',
        entity_id: testStudents.johnDoe.id,
        agency_id: testAgencies.agencyA.id,
        user_id: testUsers.agencyAAdmin.id,
        created_at: '2025-01-03T00:00:00Z',
        users: { id: testUsers.agencyAAdmin.id, full_name: 'Admin', email: 'admin@agency.com' },
      },
      {
        id: '4',
        action: 'document_uploaded',
        description: 'uploaded passport document',
        entity_type: 'student',
        entity_id: testStudents.johnDoe.id,
        agency_id: testAgencies.agencyA.id,
        user_id: testUsers.agencyAAdmin.id,
        created_at: '2025-01-04T00:00:00Z',
        users: { id: testUsers.agencyAAdmin.id, full_name: 'Admin', email: 'admin@agency.com' },
      },
    ]

    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockLimit.mockResolvedValueOnce({
      data: mockActivities,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/activity`)
    const response = await getActivity(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(4)
    expect(data.data.map((a: any) => a.action)).toEqual([
      'created',
      'updated',
      'note_added',
      'document_uploaded',
    ])
  })
})
