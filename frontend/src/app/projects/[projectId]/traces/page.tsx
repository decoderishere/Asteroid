'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  EyeIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Project, AgentTrace, AgentTraceDetail } from '@/types'

export default function ProjectTracesPage() {
  const params = useParams()
  const projectId = params.projectId as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [traces, setTraces] = useState<AgentTrace[]>([])
  const [selectedTrace, setSelectedTrace] = useState<AgentTraceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    loadTracesData()
  }, [projectId])

  const loadTracesData = async () => {
    try {
      const [projectData, tracesData] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getProjectTraces(projectId, 100)
      ])
      
      setProject(projectData)
      setTraces(tracesData)
    } catch (error) {
      console.error('Error loading traces data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewTraceDetail = async (traceId: string) => {
    setLoadingDetail(true)
    try {
      const detail = await apiClient.getTraceDetails(traceId)
      setSelectedTrace(detail)
    } catch (error) {
      console.error('Error loading trace detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
    )
  }

  const getAgentIcon = (agentName: string) => {
    return <CpuChipIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Proyecto no encontrado</h2>
        <Link href="/projects" className="btn-primary mt-4">
          Volver a Proyectos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href={`/projects/${projectId}`}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver al Proyecto
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Trazabilidad de Agentes - {project.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Historial completo de actividad de los agentes de IA para este proyecto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Traces List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Actividad de Agentes ({traces.length})
          </h2>
          
          {traces.length === 0 ? (
            <div className="text-center py-8">
              <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No hay actividad registrada
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                La actividad de los agentes aparecerá aquí una vez que procesen documentos.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {traces.map((trace) => (
                <div 
                  key={trace.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTrace?.id === trace.id 
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20' 
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleViewTraceDetail(trace.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAgentIcon(trace.agent_name)}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {trace.agent_name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {trace.task_type}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(trace.created_at).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(trace.success)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {trace.execution_time.toFixed(2)}s
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Modelo:</span> {trace.model_used}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trace Detail */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Detalle de Ejecución
          </h2>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
          ) : selectedTrace ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedTrace.agent_name}
                  </h3>
                  {getStatusIcon(selectedTrace.success)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTrace.task_type}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(selectedTrace.created_at).toLocaleString('es-CL')}
                </p>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tiempo de Ejecución</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {selectedTrace.execution_time.toFixed(2)}s
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Modelo Utilizado</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {selectedTrace.model_used}
                  </p>
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Razonamiento del Agente
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedTrace.reasoning}
                  </p>
                </div>
              </div>

              {/* Input Data */}
              {selectedTrace.input_data && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Datos de Entrada
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
                    <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedTrace.input_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Output Data */}
              {selectedTrace.output_data && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Datos de Salida
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3">
                    <pre className="text-xs text-green-800 dark:text-green-200 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedTrace.output_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedTrace.error_message && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                    Mensaje de Error
                  </h4>
                  <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {selectedTrace.error_message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <EyeIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Seleccione una actividad
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Haga clic en una actividad de agente para ver los detalles de ejecución.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}