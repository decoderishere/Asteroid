import { NextRequest, NextResponse } from 'next/server'
import { projectDeletionService, checkProjectDeletionSafety } from '@/lib/services/projectDeletion'
import { logger, createRequestContext, logRequestCompletion } from '@/lib/observability'
import type { DeleteProjectRequest, UserPermissions } from '@/types'

export const runtime = 'nodejs'

// Mock auth helper - in real implementation, this would extract from JWT/session
function getCurrentUser(request: NextRequest) {
  // Mock implementation - would extract from Authorization header or session
  const userId = request.headers.get('x-user-id') || 'mock-user-id'
  const role = (request.headers.get('x-user-role') as any) || 'owner'
  const permissions = request.headers.get('x-user-permissions')?.split(',') || ['project:delete']
  
  return {
    userId,
    role,
    permissions
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddress = request.headers.get('x-remote-address')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddress || 'unknown'
}

/**
 * Check if project can be safely deleted
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const context = createRequestContext()
  const userContext = getCurrentUser(request)
  const clientIP = getClientIP(request)

  try {
    const { projectId } = params

    if (!projectId) {
      const response = NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
      logRequestCompletion(context, 'GET', `/api/projects/${projectId}/delete`, 400)
      return response
    }

    logger.info('Checking project deletion safety', {
      operation: 'check_deletion_safety_api',
      requestId: context.requestId,
      userId: userContext.userId,
      metadata: { projectId, clientIP }
    })

    // Check deletion safety
    const safetyCheck = await checkProjectDeletionSafety(projectId, userContext)

    const response = NextResponse.json({
      success: true,
      data: safetyCheck
    })

    logRequestCompletion(context, 'GET', `/api/projects/${projectId}/delete`, 200)
    return response

  } catch (error: any) {
    logger.trackError(
      'DELETION_SAFETY_API_ERROR',
      'check_deletion_safety_api',
      error.message,
      {
        requestId: context.requestId,
        userId: userContext.userId,
        metadata: { projectId: params.projectId, clientIP }
      }
    )

    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('permission') ? 403 : 500

    const response = NextResponse.json(
      { 
        error: statusCode === 500 ? 'Internal server error' : error.message,
        requestId: context.requestId
      },
      { status: statusCode }
    )

    logRequestCompletion(context, 'GET', `/api/projects/${params.projectId}/delete`, statusCode)
    return response
  }
}

/**
 * Soft-delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const context = createRequestContext()
  const userContext = getCurrentUser(request)
  const clientIP = getClientIP(request)

  try {
    const { projectId } = params

    if (!projectId) {
      const response = NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
      logRequestCompletion(context, 'DELETE', `/api/projects/${projectId}/delete`, 400)
      return response
    }

    // Parse request body for deletion reason
    let deleteReason: string | undefined
    try {
      const body = await request.json()
      deleteReason = body.reason
    } catch {
      // No body is fine, reason is optional
    }

    logger.info('Starting project deletion via API', {
      operation: 'delete_project_api',
      requestId: context.requestId,
      userId: userContext.userId,
      metadata: { projectId, reason: deleteReason, clientIP }
    })

    // Create deletion request
    const deleteRequest: DeleteProjectRequest = {
      projectId,
      actorId: userContext.userId,
      reason: deleteReason
    }

    // Execute deletion
    const result = await projectDeletionService.deleteProject(deleteRequest, userContext)

    logger.info('Project deletion completed via API', {
      operation: 'delete_project_api',
      requestId: context.requestId,
      userId: userContext.userId,
      metadata: { 
        projectId, 
        success: result.success,
        childCounts: result.childCounts 
      }
    })

    const response = NextResponse.json({
      success: true,
      data: result
    })

    logRequestCompletion(context, 'DELETE', `/api/projects/${projectId}/delete`, 200)
    return response

  } catch (error: any) {
    logger.trackError(
      'DELETE_PROJECT_API_ERROR',
      'delete_project_api',
      error.message,
      {
        requestId: context.requestId,
        userId: userContext.userId,
        metadata: { projectId: params.projectId, clientIP }
      }
    )

    // Determine appropriate status code based on error
    let statusCode = 500
    if (error.message.includes('not found')) {
      statusCode = 404
    } else if (error.message.includes('permission') || error.message.includes('Insufficient')) {
      statusCode = 403
    } else if (error.message.includes('Cannot delete')) {
      statusCode = 409 // Conflict - has blocking conditions
    }

    const response = NextResponse.json(
      { 
        error: statusCode === 500 ? 'Internal server error' : error.message,
        requestId: context.requestId,
        canRetry: statusCode !== 403 && statusCode !== 404
      },
      { status: statusCode }
    )

    logRequestCompletion(context, 'DELETE', `/api/projects/${params.projectId}/delete`, statusCode)
    return response
  }
}