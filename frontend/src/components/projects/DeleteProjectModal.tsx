'use client'

import { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon, 
  TrashIcon,
  ClockIcon,
  DocumentTextIcon,
  FolderIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/useToast'
import { apiClient } from '@/lib/api'
import type { Project, ProjectDeletionSafety } from '@/types'

interface DeleteProjectModalProps {
  project: Project
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
}

export function DeleteProjectModal({ 
  project, 
  isOpen, 
  onClose, 
  onDeleted 
}: DeleteProjectModalProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [safetyCheck, setSafetyCheck] = useState<ProjectDeletionSafety | null>(null)
  const [checkingSafety, setCheckingSafety] = useState(false)
  const { toast } = useToast()

  // Check deletion safety when modal opens
  useEffect(() => {
    if (isOpen && !safetyCheck) {
      checkDeletionSafety()
    }
  }, [isOpen, project.id])

  const checkDeletionSafety = async () => {
    setCheckingSafety(true)
    try {
      const safety = await apiClient.checkProjectDeletionSafety(project.id)
      setSafetyCheck(safety)
    } catch (error: any) {
      console.error('Failed to check deletion safety:', error)
      toast({
        title: 'Error',
        description: 'No se pudo verificar la seguridad de eliminación. Inténtelo más tarde.',
        variant: 'destructive'
      })
      onClose()
    } finally {
      setCheckingSafety(false)
    }
  }

  const handleDelete = async () => {
    if (confirmationText.trim() !== project.name) {
      toast({
        title: 'Confirmación incorrecta',
        description: 'Debe escribir exactamente el nombre del proyecto para confirmar.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const result = await apiClient.deleteProjectSafely(
        project.id, 
        deleteReason.trim() || undefined
      )

      toast({
        title: 'Proyecto eliminado',
        description: result.message,
        variant: 'default'
      })

      onDeleted()
      onClose()
    } catch (error: any) {
      console.error('Failed to delete project:', error)
      
      let errorMessage = 'Error interno del servidor'
      if (error.response?.status === 403) {
        errorMessage = 'No tiene permisos para eliminar este proyecto'
      } else if (error.response?.status === 409) {
        errorMessage = error.response.data?.error || 'No se puede eliminar el proyecto en este momento'
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }

      toast({
        title: 'Error al eliminar',
        description: errorMessage,
        variant: 'destructive'
      })

      // Re-check safety in case conditions changed
      await checkDeletionSafety()
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmationText('')
    setDeleteReason('')
    setSafetyCheck(null)
    onClose()
  }

  const isConfirmationValid = confirmationText.trim() === project.name
  const canProceed = safetyCheck?.canDelete && isConfirmationValid

  if (!isOpen) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Eliminar Proyecto
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Esta acción moverá el proyecto a la papelera. Los datos se conservarán durante 30 días.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Proyecto a eliminar:
            </h4>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Nombre:</span> {project.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Subestación:</span> {project.substation_id}
              </p>
              <p className="text-sm">
                <span className="font-medium">Estado:</span> {project.status}
              </p>
            </div>
          </div>

          {/* Safety Check Loading */}
          {checkingSafety && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                Verificando seguridad de eliminación...
              </span>
            </div>
          )}

          {/* Safety Check Results */}
          {safetyCheck && (
            <div className="space-y-4">
              {/* Blocking Reasons */}
              {safetyCheck.blockingReasons.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        No se puede eliminar ahora
                      </h4>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {safetyCheck.blockingReasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* In-Flight Jobs */}
              {safetyCheck.inFlightJobs.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Trabajos en curso
                      </h4>
                      <div className="space-y-2">
                        {safetyCheck.inFlightJobs.map((job) => (
                          <div key={job.id} className="text-sm text-yellow-700 dark:text-yellow-300">
                            <div className="flex items-center space-x-2">
                              <CpuChipIcon className="h-4 w-4" />
                              <span className="font-medium">{job.type}</span>
                              <span className="px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-xs rounded">
                                {job.status}
                              </span>
                            </div>
                            {job.estimatedCompletion && (
                              <p className="text-xs mt-1 ml-6">
                                Finalización estimada: {new Date(job.estimatedCompletion).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {safetyCheck.warnings.length > 0 && safetyCheck.canDelete && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Elementos que se eliminarán
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        {safetyCheck.warnings.map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirmation Input */}
          {safetyCheck?.canDelete && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Escriba el nombre del proyecto para confirmar:
                </Label>
                <Input
                  id="confirmation"
                  type="text"
                  placeholder={project.name}
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="mt-1"
                />
                {confirmationText && !isConfirmationValid && (
                  <p className="text-xs text-red-600 mt-1">
                    El texto no coincide con el nombre del proyecto
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="reason" className="text-sm font-medium">
                  Motivo de eliminación (opcional):
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Describa por qué está eliminando este proyecto..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          
          {safetyCheck?.canDelete && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!canProceed || loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Eliminar Proyecto
                </>
              )}
            </AlertDialogAction>
          )}
          
          {!safetyCheck?.canDelete && safetyCheck && (
            <Button
              onClick={checkDeletionSafety}
              disabled={checkingSafety}
              variant="outline"
            >
              {checkingSafety ? 'Verificando...' : 'Verificar de nuevo'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}