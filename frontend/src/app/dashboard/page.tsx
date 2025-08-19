'use client'

import { useEffect, useState } from 'react'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { apiClient } from '@/lib/api'
import { Project, KPIMetric } from '@/types'
import { formatDate } from '@/lib/dateUtils'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [globalKPIs, setGlobalKPIs] = useState<KPIMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Calculate fresh KPIs first
      await apiClient.calculateGlobalKPIs()
      
      const [projectsData, kpisData] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getGlobalKPIs()
      ])
      
      setProjects(projectsData)
      setGlobalKPIs(kpisData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getKPIValue = (metricName: string): number => {
    const kpi = globalKPIs.find(k => k.metric_name === metricName)
    return kpi?.metric_value || 0
  }

  // Prepare chart data
  const projectStatusData = [
    { name: 'Borrador', value: projects.filter(p => p.status === 'draft').length },
    { name: 'En Progreso', value: projects.filter(p => p.status === 'in_progress').length },
    { name: 'Completado', value: projects.filter(p => p.status === 'completed').length },
    { name: 'Archivado', value: projects.filter(p => p.status === 'archived').length },
  ].filter(item => item.value > 0)

  const documentsStatusKPI = globalKPIs.find(k => k.metric_name === 'documents_by_status')
  const documentsStatusData = documentsStatusKPI?.metric_value ? 
    Object.entries(documentsStatusKPI.metric_value as any).map(([status, count]) => ({
      name: status === 'approved' ? 'Aprobados' : 
            status === 'needs_review' ? 'Revisión' :
            status === 'rejected' ? 'Rechazados' : status,
      value: count as number
    })) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Ejecutivo</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Vista general del rendimiento del sistema de permisos BESS
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Proyectos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('total_projects')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Documentos Generados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('total_documents')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Calidad Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('system_average_quality_score').toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Éxito IA</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('agent_success_rate_percentage').toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Distribución de Proyectos por Estado
          </h3>
          {projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No hay datos de proyectos disponibles
            </div>
          )}
        </div>

        {/* Document Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Estados de Documentos
          </h3>
          {documentsStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={documentsStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No hay datos de documentos disponibles
            </div>
          )}
        </div>
      </div>

      {/* System Performance */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Rendimiento del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CpuChipIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo Promedio de Ejecución</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {getKPIValue('agent_average_execution_time').toFixed(2)}s
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tasa de Finalización</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {getKPIValue('project_completion_rate_percentage').toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ChartBarIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Eficiencia del Proceso</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {(getKPIValue('agent_success_rate_percentage') * getKPIValue('project_completion_rate_percentage') / 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Proyectos Recientes
          </h3>
          <a href="/projects" className="text-primary-600 hover:text-primary-700 text-sm">
            Ver todos
          </a>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No hay proyectos
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Los proyectos aparecerán aquí una vez creados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proyecto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Última Actualización
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {projects.slice(0, 5).map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {project.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {project.substation_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'completed' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : project.status === 'draft'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(project.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(project.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}