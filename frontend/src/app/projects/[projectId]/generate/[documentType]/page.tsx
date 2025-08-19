'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Project } from '@/types'
import DocumentGenerationChat from '@/components/DocumentGenerationChat'

const DOCUMENT_TYPES: Record<string, {
  name: string
  description: string
  icon: string
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'date' | 'select' | 'textarea'
    required: boolean
    options?: string[]
  }>
}> = {
  environmental_impact_assessment: {
    name: 'Environmental Impact Assessment',
    description: 'Comprehensive environmental analysis required for BESS projects in Chile',
    icon: '🌱',
    fields: [
      { key: 'project_location_description', label: 'Project Location Description', type: 'textarea', required: true },
      { key: 'environmental_baseline', label: 'Environmental Baseline Data', type: 'textarea', required: true },
      { key: 'protected_areas_nearby', label: 'Protected Areas Nearby', type: 'text', required: false },
      { key: 'water_sources', label: 'Water Sources Information', type: 'textarea', required: false },
      { key: 'flora_fauna_species', label: 'Local Flora/Fauna Species', type: 'textarea', required: false },
      { key: 'community_impacts', label: 'Expected Community Impacts', type: 'textarea', required: false }
    ]
  },
  interconnection_request: {
    name: 'Interconnection Request',
    description: 'Formal request to connect your BESS to the national electrical grid',
    icon: '⚡',
    fields: [
      { key: 'connection_voltage', label: 'Connection Voltage Level', type: 'select', required: true, options: ['12kV', '23kV', '110kV', '220kV', '500kV'] },
      { key: 'max_injection_power', label: 'Maximum Injection Power (MW)', type: 'number', required: true },
      { key: 'max_consumption_power', label: 'Maximum Consumption Power (MW)', type: 'number', required: true },
      { key: 'connection_point_details', label: 'Connection Point Details', type: 'textarea', required: true },
      { key: 'protection_systems', label: 'Protection Systems Description', type: 'textarea', required: true },
      { key: 'communication_systems', label: 'Communication Systems', type: 'textarea', required: false },
      { key: 'expected_operation_date', label: 'Expected Operation Start Date', type: 'date', required: true }
    ]
  },
  land_use_permit: {
    name: 'Land Use Permit',
    description: 'Authorization for land use and construction of BESS infrastructure',
    icon: '🏗️',
    fields: [
      { key: 'property_title_info', label: 'Property Title Information', type: 'textarea', required: true },
      { key: 'land_area_total', label: 'Total Land Area (hectares)', type: 'number', required: true },
      { key: 'land_area_occupied', label: 'Area to be Occupied (hectares)', type: 'number', required: true },
      { key: 'current_land_use', label: 'Current Land Use', type: 'text', required: true },
      { key: 'zoning_classification', label: 'Municipal Zoning Classification', type: 'text', required: true },
      { key: 'access_roads', label: 'Access Roads Description', type: 'textarea', required: false },
      { key: 'utilities_availability', label: 'Utilities Availability', type: 'textarea', required: false }
    ]
  },
  construction_permit: {
    name: 'Construction Permit',
    description: 'Official permit for construction activities and infrastructure development',
    icon: '🏗️',
    fields: [
      { key: 'construction_timeline', label: 'Construction Timeline (months)', type: 'number', required: true },
      { key: 'construction_phases', label: 'Construction Phases Description', type: 'textarea', required: true },
      { key: 'safety_protocols', label: 'Safety Protocols', type: 'textarea', required: true },
      { key: 'equipment_specifications', label: 'Major Equipment Specifications', type: 'textarea', required: true },
      { key: 'workforce_requirements', label: 'Workforce Requirements', type: 'textarea', required: false },
      { key: 'waste_management_plan', label: 'Construction Waste Management Plan', type: 'textarea', required: false },
      { key: 'traffic_management', label: 'Traffic Management During Construction', type: 'textarea', required: false }
    ]
  },
  electrical_safety_certification: {
    name: 'Electrical Safety Certification',
    description: 'Certification ensuring electrical safety compliance for BESS systems',
    icon: '🔐',
    fields: [
      { key: 'safety_standards_compliance', label: 'Safety Standards Compliance', type: 'textarea', required: true },
      { key: 'equipment_certifications', label: 'Equipment Certifications', type: 'textarea', required: true },
      { key: 'electrical_testing_procedures', label: 'Electrical Testing Procedures', type: 'textarea', required: true },
      { key: 'maintenance_protocols', label: 'Maintenance Protocols', type: 'textarea', required: true },
      { key: 'emergency_procedures', label: 'Emergency Response Procedures', type: 'textarea', required: false },
      { key: 'personnel_training', label: 'Personnel Training Requirements', type: 'textarea', required: false }
    ]
  }
}

export default function GuidedDocumentGenerationPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const documentType = params.documentType as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [documentData, setDocumentData] = useState<Record<string, any>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const documentTypeConfig = DOCUMENT_TYPES[documentType]

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const projectData = await apiClient.getProject(projectId)
      setProject(projectData)
      
      // Pre-fill known data
      const preFilledData: Record<string, any> = {}
      if (projectData.capacity_mw) preFilledData.max_injection_power = projectData.capacity_mw
      if (projectData.capacity_mw) preFilledData.max_consumption_power = projectData.capacity_mw
      if (projectData.voltage_level) preFilledData.connection_voltage = projectData.voltage_level
      if (projectData.description) preFilledData.project_location_description = projectData.description
      
      setDocumentData(preFilledData)
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldUpdate = (key: string, value: any) => {
    setDocumentData(prev => ({ ...prev, [key]: value }))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await apiClient.generateDocument(projectId, documentType)
      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error('Error generating document:', error)
      alert('Error generating document. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    )
  }

  if (!project || !documentTypeConfig) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Document type not found</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">The requested document type is not available.</p>
        <Link href={`/projects/${projectId}`} className="btn-primary mt-4">
          Back to Project
        </Link>
      </div>
    )
  }

  // Get completion status
  const requiredFields = documentTypeConfig.fields.filter(f => f.required)
  const completedRequired = requiredFields.filter(f => documentData[f.key]).length
  const totalFields = documentTypeConfig.fields.length
  const completedTotal = documentTypeConfig.fields.filter(f => documentData[f.key]).length
  const isComplete = completedRequired === requiredFields.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/projects/${projectId}`}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to {project.name}
          </Link>
          
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">{documentTypeConfig.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{documentTypeConfig.name}</h1>
              <p className="text-gray-600 dark:text-gray-300">{documentTypeConfig.description}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress: {completedTotal}/{totalFields} fields completed
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {completedRequired}/{requiredFields.length} required
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedTotal / totalFields) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Project Info & Form */}
          <div className="space-y-6">
            {/* Project Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Project Name:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{project.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Substation:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{project.substation_name || 'Not specified'}</span>
                </div>
                {project.capacity_mw && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{project.capacity_mw} MW</span>
                  </div>
                )}
                {project.voltage_level && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Voltage Level:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{project.voltage_level}</span>
                  </div>
                )}
                {project.technology_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Technology:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{project.technology_type.replace('_', ' ')}</span>
                  </div>
                )}
                {project.project_developer && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Developer:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{project.project_developer}</span>
                  </div>
                )}
                {project.latitude && project.longitude && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{project.latitude}°, {project.longitude}°</span>
                  </div>
                )}
              </div>
            </div>

            {/* Document Fields Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Document Details</h2>
              <div className="space-y-4">
                {documentTypeConfig.fields.map((field, index) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                      {documentData[field.key] && <CheckCircleIcon className="inline h-4 w-4 text-green-600 dark:text-green-500 ml-2" />}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        value={documentData[field.key] || ''}
                        onChange={(e) => handleFieldUpdate(field.key, e.target.value)}
                        rows={3}
                        className="input w-full resize-none text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={documentData[field.key] || ''}
                        onChange={(e) => handleFieldUpdate(field.key, e.target.value)}
                        className="input w-full text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={documentData[field.key] || ''}
                        onChange={(e) => handleFieldUpdate(field.key, field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
                        className="input w-full text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Ready to Generate?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {isComplete 
                      ? "All required fields completed. Ready to generate document!" 
                      : `${requiredFields.length - completedRequired} required fields still needed`}
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!isComplete || isGenerating}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-100 mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Generate Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - AI Chat Assistant */}
          <div className="lg:h-screen lg:sticky lg:top-8">
            <DocumentGenerationChat
              projectId={projectId}
              documentType={documentType}
              documentData={documentData}
              onFieldUpdate={handleFieldUpdate}
              project={project}
            />
          </div>
        </div>
      </div>
    </div>
  )
}