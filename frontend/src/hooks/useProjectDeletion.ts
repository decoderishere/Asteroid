import { useState } from 'react'
import { apiClient } from '@/lib/api'
import { useToast } from './useToast'
import type { Project, ProjectDeletionSafety, DeleteProjectResponse } from '@/types'

export interface UseProjectDeletionOptions {
  onDeleted?: (project: Project) => void
  onRestored?: (project: Project) => void
  onError?: (error: Error, operation: 'delete' | 'restore' | 'safety') => void
}

export interface UseProjectDeletionReturn {
  // State
  deleting: boolean
  restoring: boolean
  checkingSafety: boolean
  safetyCheck: ProjectDeletionSafety | null
  
  // Actions
  checkDeletionSafety: (projectId: string) => Promise<ProjectDeletionSafety | null>
  deleteProject: (project: Project, reason?: string) => Promise<DeleteProjectResponse | null>
  restoreProject: (project: Project, reason?: string) => Promise<boolean>
  
  // Utilities
  canDelete: (project: Project) => boolean
  isDeleted: (project: Project) => boolean
}

export function useProjectDeletion(options: UseProjectDeletionOptions = {}): UseProjectDeletionReturn {
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [checkingSafety, setCheckingSafety] = useState(false)
  const [safetyCheck, setSafetyCheck] = useState<ProjectDeletionSafety | null>(null)
  const { toast } = useToast()

  const checkDeletionSafety = async (projectId: string): Promise<ProjectDeletionSafety | null> => {
    setCheckingSafety(true)
    try {
      const safety = await apiClient.checkProjectDeletionSafety(projectId)
      setSafetyCheck(safety)
      return safety
    } catch (error: any) {
      console.error('Failed to check deletion safety:', error)
      
      const errorMessage = error.response?.status === 403 
        ? 'No tiene permisos para verificar este proyecto'
        : error.response?.status === 404
        ? 'Proyecto no encontrado'
        : 'Error al verificar la seguridad de eliminación'

      toast({
        title: 'Error de verificación',
        description: errorMessage,
        variant: 'destructive'
      })

      options.onError?.(error, 'safety')
      return null
    } finally {
      setCheckingSafety(false)
    }
  }

  const deleteProject = async (
    project: Project, 
    reason?: string
  ): Promise<DeleteProjectResponse | null> => {
    setDeleting(true)
    try {
      const result = await apiClient.deleteProjectSafely(project.id, reason)
      
      toast({
        title: 'Proyecto eliminado',
        description: `"${project.name}" ha sido movido a la papelera`,
        variant: 'default'
      })

      options.onDeleted?.(project)
      setSafetyCheck(null) // Clear safety check after successful deletion
      return result
    } catch (error: any) {
      console.error('Failed to delete project:', error)
      
      let errorMessage = 'Error interno del servidor'
      let shouldRetry = false

      if (error.response?.status === 403) {
        errorMessage = 'No tiene permisos para eliminar este proyecto'
      } else if (error.response?.status === 404) {
        errorMessage = 'Proyecto no encontrado'
      } else if (error.response?.status === 409) {
        errorMessage = error.response.data?.error || 'No se puede eliminar el proyecto en este momento'
        shouldRetry = true
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
        shouldRetry = error.response.data.canRetry !== false
      }

      toast({
        title: 'Error al eliminar',
        description: errorMessage,
        variant: 'destructive',
        action: shouldRetry ? {
          label: 'Reintentar',
          onClick: () => deleteProject(project, reason)
        } : undefined
      })

      options.onError?.(error, 'delete')
      
      // Re-check safety if the operation failed and might be retryable
      if (shouldRetry) {
        await checkDeletionSafety(project.id)
      }

      return null
    } finally {
      setDeleting(false)
    }
  }

  const restoreProject = async (project: Project, reason?: string): Promise<boolean> => {
    setRestoring(true)
    try {
      const result = await apiClient.restoreProject(project.id, reason)
      
      toast({
        title: 'Proyecto restaurado',
        description: result.message,
        variant: 'default'
      })

      options.onRestored?.(project)
      setSafetyCheck(null) // Clear safety check after successful restoration
      return true
    } catch (error: any) {
      console.error('Failed to restore project:', error)
      
      let errorMessage = 'Error interno del servidor'
      if (error.response?.status === 403) {
        errorMessage = 'No tiene permisos para restaurar este proyecto'
      } else if (error.response?.status === 404) {
        errorMessage = 'Proyecto no encontrado'
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }

      toast({
        title: 'Error al restaurar',
        description: errorMessage,
        variant: 'destructive'
      })

      options.onError?.(error, 'restore')
      return false
    } finally {
      setRestoring(false)
    }
  }

  // Utility functions
  const canDelete = (project: Project): boolean => {
    return !project.deleted_at && safetyCheck?.canDelete === true
  }

  const isDeleted = (project: Project): boolean => {
    return !!project.deleted_at
  }

  return {
    // State
    deleting,
    restoring,
    checkingSafety,
    safetyCheck,
    
    // Actions
    checkDeletionSafety,
    deleteProject,
    restoreProject,
    
    // Utilities
    canDelete,
    isDeleted
  }
}

// Convenience hook for simple deletion without complex safety checks
export function useSimpleProjectDeletion() {
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const deleteProject = async (projectId: string, reason?: string): Promise<boolean> => {
    setDeleting(true)
    try {
      await apiClient.deleteProjectSafely(projectId, reason)
      
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido movido a la papelera',
        variant: 'default'
      })

      return true
    } catch (error: any) {
      console.error('Failed to delete project:', error)
      
      toast({
        title: 'Error al eliminar',
        description: error.response?.data?.error || 'Error interno del servidor',
        variant: 'destructive'
      })

      return false
    } finally {
      setDeleting(false)
    }
  }

  return {
    deleting,
    deleteProject
  }
}