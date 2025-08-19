'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusIcon, FolderIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Project, KPIMetric } from '@/types'
import { useTranslation } from '@/contexts/LanguageContext'
import { getStatusTranslationKey } from '@/lib/utils'
import { formatDate } from '@/lib/dateUtils'

export default function HomePage() {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [globalKPIs, setGlobalKPIs] = useState<KPIMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, kpisData] = await Promise.all([
          apiClient.getProjects(),
          apiClient.getGlobalKPIs()
        ])
        setProjects(projectsData)
        setGlobalKPIs(kpisData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getKPIValue = (metricName: string): number => {
    const kpi = globalKPIs.find(k => k.metric_name === metricName)
    return kpi?.metric_value || 0
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('home.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('home.subtitle')}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          {t('home.newProject')}
        </Link>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <FolderIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('home.totalProjects')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('total_projects')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('home.documentsGenerated')}</p>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('home.averageQuality')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('system_average_quality_score').toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('home.aiSuccessRate')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('agent_success_rate_percentage').toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('home.recentProjects')}
          </h2>
          <Link href="/projects" className="text-primary-600 hover:text-primary-700">
            {t('home.viewAll')}
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('home.noProjects')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('home.noProjectsDesc')}
            </p>
            <div className="mt-6">
              <Link href="/projects/new" className="btn-primary">
                <PlusIcon className="h-5 w-5 inline mr-2" />
                {t('home.newProject')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black dark:ring-gray-600 ring-opacity-5 dark:ring-opacity-30 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('home.project')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('home.substation')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('home.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('home.created')}
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">{t('home.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {projects.slice(0, 5).map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {project.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {project.substation_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'completed' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : project.status === 'draft'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {t(getStatusTranslationKey(project.status))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(project.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/projects/${project.id}`}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {t('home.viewDetails')}
                      </Link>
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