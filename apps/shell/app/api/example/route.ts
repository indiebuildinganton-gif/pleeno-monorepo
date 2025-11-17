import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  withErrorHandling
} from '@pleeno/utils/server'

/**
 * Example GET endpoint - demonstrates success response
 */
export async function GET(request: NextRequest) {
  try {
    // Example: Fetch some data
    const data = {
      message: 'Success',
      timestamp: new Date().toISOString()
    }

    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/example',
    })
  }
}

/**
 * Example POST endpoint - demonstrates validation errors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation example
    if (!body.name) {
      throw new ValidationError('Name is required', { field: 'name' })
    }

    if (!body.email) {
      throw new ValidationError('Email is required', { field: 'email' })
    }

    // Example: Create a resource
    const data = {
      id: 1,
      name: body.name,
      email: body.email,
      created_at: new Date().toISOString()
    }

    return createSuccessResponse(data, 201)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/example',
    })
  }
}

/**
 * Example PUT endpoint - demonstrates NotFoundError
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw new ValidationError('ID is required', { field: 'id' })
    }

    // Simulate resource not found
    const resourceExists = false // In real app, this would be a database check

    if (!resourceExists) {
      throw new NotFoundError(`Resource with ID ${id} not found`)
    }

    const data = {
      id,
      message: 'Updated successfully',
      updated_at: new Date().toISOString()
    }

    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/example',
    })
  }
}

/**
 * Example DELETE endpoint - demonstrates withErrorHandling wrapper
 * This approach eliminates the need for try-catch blocks
 */
export const DELETE = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('ID is required', { field: 'id' })
  }

  // Simulate authorization check
  const hasPermission = false // In real app, check user permissions

  if (!hasPermission) {
    throw new ForbiddenError('You do not have permission to delete this resource')
  }

  const data = {
    id,
    message: 'Deleted successfully',
    deleted_at: new Date().toISOString()
  }

  return createSuccessResponse(data)
})

/**
 * Example PATCH endpoint - demonstrates UnauthorizedError
 */
export const PATCH = withErrorHandling(async (request: Request) => {
  // Simulate authentication check
  const isAuthenticated = false // In real app, check auth token

  if (!isAuthenticated) {
    throw new UnauthorizedError('You must be logged in to perform this action')
  }

  const data = {
    message: 'Patched successfully',
    updated_at: new Date().toISOString()
  }

  return createSuccessResponse(data)
})
