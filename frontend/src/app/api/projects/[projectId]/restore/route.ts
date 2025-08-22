import { NextRequest, NextResponse } from 'next/server'
import { projectDeletionService } from '@/lib/services/projectDeletion'
import { logger, createRequestContext, logRequestCompletion } from '@/lib/observability'
import type { RestoreProjectRequest } from '@/types'

export const runtime = 'nodejs'

// Mock auth helper - same as delete route
function getCurrentUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'mock-user-id'
  const role = (request.headers.get('x-user-role') as any) || 'admin'
  const permissions = request.headers.get('x-user-permissions')?.split(',') || ['project:restore']
  
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
 * Restore a soft-deleted project
 */
export async function POST(
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
      logRequestCompletion(context, 'POST', `/api/projects/${projectId}/restore`, 400)
      return response
    }

    // Parse request body for restore reason
    let restoreReason: string | undefined
    try {
      const body = await request.json()
      restoreReason = body.reason
    } catch {
      // No body is fine, reason is optional
    }

    logger.info('Starting project restoration via API', {
      operation: 'restore_project_api',
      requestId: context.requestId,
      userId: userContext.userId,
      metadata: { projectId, reason: restoreReason, clientIP }
    })

    // Create restoration request
    const restoreRequest: RestoreProjectRequest = {
      projectId,
      actorId: userContext.userId,
      reason: restoreReason
    }

    // Execute restoration
    const result = await projectDeletionService.restoreProject(restoreRequest, userContext)

    logger.info('Project restoration completed via API', {
      operation: 'restore_project_api',
      requestId: context.requestId,
      userId: userContext.userId,
      metadata: { 
        projectId, 
        success: result.success
      }
    })

    const response = NextResponse.json({
      success: true,
      data: result
    })

    logRequestCompletion(context, 'POST', `/api/projects/${projectId}/restore`, 200)
    return response

  } catch (error: any) {
    logger.trackError(
      'RESTORE_PROJECT_API_ERROR',
      'restore_project_api',
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
    }

    const response = NextResponse.json(
      { 
        error: statusCode === 500 ? 'Internal server error' : error.message,
        requestId: context.requestId
      },
      { status: statusCode }
    )

    logRequestCompletion(context, 'POST', `/api/projects/${params.projectId}/restore`, statusCode)
    return response
  }
}