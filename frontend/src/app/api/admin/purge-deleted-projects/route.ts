import { NextRequest, NextResponse } from 'next/server'
import { projectDeletionService } from '@/lib/services/projectDeletion'
import { logger, createRequestContext, logRequestCompletion } from '@/lib/observability'

export const runtime = 'nodejs'

// Mock admin auth check - in real implementation, this would verify admin JWT
function isAdmin(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  const permissions = request.headers.get('x-user-permissions')?.split(',') || []
  
  return role === 'admin' || permissions.includes('admin:purge')
}

function getCurrentUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'system'
  const role = request.headers.get('x-user-role') || 'admin'
  
  return { userId, role }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  return forwarded?.split(',')[0]?.trim() || realIP || 'unknown'
}

/**
 * Hard-delete projects that have been soft-deleted beyond retention period
 * This endpoint should only be accessible by admins and typically called by a cron job
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext()
  const userContext = getCurrentUser(request)
  const clientIP = getClientIP(request)

  try {
    // Check admin permissions
    if (!isAdmin(request)) {
      const response = NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      )
      logRequestCompletion(context, 'POST', '/api/admin/purge-deleted-projects', 403)
      return response
    }

    logger.info('Starting hard-delete purge of expired projects', {
      operation: 'purge_expired_projects_api',
      requestId: context.requestId,
      userId: userContext.userId,
      metadata: { clientIP, triggeredBy: 'admin' }
    })

    // Execute the purge
    const result = await projectDeletionService.purgeExpiredProjects()

    // Log the results
    logger.info('Hard-delete purge completed', {
      operation: 'purge_expired_projects_api',
      requestId: context.requestId,
      userId: userContext.userId,
      metadata: {
        purgedCount: result.purgedCount,
        errorCount: result.errors.length,
        errors: result.errors
      }
    })

    // Audit log for the purge operation
    logger.audit(
      'expired_projects_purged',
      'system',
      'purge-operation',
      {
        requestId: context.requestId,
        userId: userContext.userId,
        metadata: {
          purgedCount: result.purgedCount,
          errorCount: result.errors.length,
          clientIP
        }
      }
    )

    const response = NextResponse.json({
      success: true,
      data: {
        purgedCount: result.purgedCount,
        errors: result.errors,
        message: `Successfully purged ${result.purgedCount} expired projects${
          result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''
        }`
      }
    })

    logRequestCompletion(context, 'POST', '/api/admin/purge-deleted-projects', 200)
    return response

  } catch (error: any) {
    logger.trackError(
      'PURGE_EXPIRED_PROJECTS_API_ERROR',
      'purge_expired_projects_api',
      error.message,
      {
        requestId: context.requestId,
        userId: userContext.userId,
        metadata: { clientIP }
      }
    )

    const response = NextResponse.json(
      { 
        error: 'Internal server error during purge operation',
        requestId: context.requestId
      },
      { status: 500 }
    )

    logRequestCompletion(context, 'POST', '/api/admin/purge-deleted-projects', 500)
    return response
  }
}

/**
 * Get information about projects eligible for hard deletion
 */
export async function GET(request: NextRequest) {
  const context = createRequestContext()
  const userContext = getCurrentUser(request)

  try {
    // Check admin permissions
    if (!isAdmin(request)) {
      const response = NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      )
      logRequestCompletion(context, 'GET', '/api/admin/purge-deleted-projects', 403)
      return response
    }

    // Get retention period from query params or use default (30 days)
    const retentionDays = parseInt(
      request.nextUrl.searchParams.get('retentionDays') || '30'
    )

    logger.info('Fetching projects eligible for hard deletion', {
      operation: 'get_purgeable_projects_api',
      requestId: context.requestId,
      userId: userContext.userId,
      metadata: { retentionDays }
    })

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    // Mock implementation - in real app, this would query the database
    const eligibleProjects = [
      // Mock data - would be real soft-deleted projects beyond retention
    ]

    const response = NextResponse.json({
      success: true,
      data: {
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        eligibleCount: eligibleProjects.length,
        projects: eligibleProjects,
        estimatedStorageSavings: '0 MB' // Would calculate actual storage impact
      }
    })

    logRequestCompletion(context, 'GET', '/api/admin/purge-deleted-projects', 200)
    return response

  } catch (error: any) {
    logger.trackError(
      'GET_PURGEABLE_PROJECTS_API_ERROR',
      'get_purgeable_projects_api',
      error.message,
      {
        requestId: context.requestId,
        userId: userContext.userId
      }
    )

    const response = NextResponse.json(
      { 
        error: 'Internal server error',
        requestId: context.requestId
      },
      { status: 500 }
    )

    logRequestCompletion(context, 'GET', '/api/admin/purge-deleted-projects', 500)
    return response
  }
}