'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import ProjectSetupWizard from '@/components/ProjectSetupWizard'
import { useTranslation } from '@/contexts/LanguageContext'

interface SetupData {
  name: string
  substation_id: string
  substation_name: string
  latitude: number | null
  longitude: number | null
  voltage_level: string
  capacity_mw: number | null
  technology_type: string
  grid_connection_type: string
  project_developer: string
  description: string
  language: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleWizardComplete = async (setupData: SetupData) => {
    setLoading(true)

    try {
      // Create project with all the wizard data
      const project = await apiClient.createProject({
        name: setupData.name,
        substation_id: setupData.substation_id,
        substation_name: setupData.substation_name,
        description: setupData.description,
        language: setupData.language,
        latitude: setupData.latitude,
        longitude: setupData.longitude,
        voltage_level: setupData.voltage_level,
        capacity_mw: setupData.capacity_mw,
        technology_type: setupData.technology_type,
        grid_connection_type: setupData.grid_connection_type,
        project_developer: setupData.project_developer
      })
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error al crear el proyecto. Inténtelo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/projects')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Creando proyecto...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ProjectSetupWizard
        onComplete={handleWizardComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}