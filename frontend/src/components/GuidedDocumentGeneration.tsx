'use client'

import { useState } from 'react'
import { 
  DocumentPlusIcon, 
  ChevronDownIcon, 
  EyeIcon, 
  SparklesIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline'
import { useTranslation } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/api'

interface DocumentGenerationOption {
  id: string
  name: string
  description: string
  icon: string
  requiredFields: string[]
  estimatedTime: string
}

interface GuidedDocumentGenerationProps {
  projectId: string
  onDocumentGenerated: () => void
}

const DOCUMENT_OPTIONS: DocumentGenerationOption[] = [
  {
    id: 'environmental_impact_assessment',
    name: 'Environmental Impact Assessment',
    description: 'Comprehensive environmental analysis required for BESS projects in Chile',
    icon: '🌱',
    requiredFields: ['Project location', 'Capacity details', 'Environmental baseline data'],
    estimatedTime: '5-8 minutes'
  },
  {
    id: 'interconnection_request',
    name: 'Interconnection Request',
    description: 'Formal request to connect your BESS to the national electrical grid',
    icon: '⚡',
    requiredFields: ['Substation details', 'Technical specifications', 'Grid connection point'],
    estimatedTime: '3-5 minutes'
  },
  {
    id: 'land_use_permit',
    name: 'Land Use Permit',
    description: 'Authorization for land use and construction of BESS infrastructure',
    icon: '🏗️',
    requiredFields: ['Property details', 'Construction plans', 'Local authority information'],
    estimatedTime: '4-6 minutes'
  },
  {
    id: 'construction_permit',
    name: 'Construction Permit',
    description: 'Official permit for construction activities and infrastructure development',
    icon: '🏗️',
    requiredFields: ['Technical drawings', 'Safety protocols', 'Construction timeline'],
    estimatedTime: '6-8 minutes'
  },
  {
    id: 'electrical_safety_certification',
    name: 'Electrical Safety Certification',
    description: 'Certification ensuring electrical safety compliance for BESS systems',
    icon: '🔐',
    requiredFields: ['Equipment specifications', 'Safety measures', 'Compliance standards'],
    estimatedTime: '3-4 minutes'
  }
]

export default function GuidedDocumentGeneration({ projectId, onDocumentGenerated }: GuidedDocumentGenerationProps) {
  const { t } = useTranslation()
  const [selectedDocument, setSelectedDocument] = useState<DocumentGenerationOption | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [missingInfo, setMissingInfo] = useState<string[]>([])

  const handleDocumentSelect = (option: DocumentGenerationOption) => {
    setSelectedDocument(option)
    setIsDropdownOpen(false)
    setShowPreview(false)
    // Simulate checking for missing information
    const randomMissing = option.requiredFields.filter(() => Math.random() > 0.6)
    setMissingInfo(randomMissing)
  }

  const handlePreview = async () => {
    if (!selectedDocument) return
    
    setShowPreview(true)
    // Here you would typically call the backend to generate a preview
    // For now, we'll simulate the preview functionality
  }

  const handleGenerate = async () => {
    if (!selectedDocument) return
    
    // Navigate to the guided generation page
    window.location.href = `/projects/${projectId}/generate/${selectedDocument.id}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('generation.guided_title') || 'Guided Document Generation'}
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {t('generation.guided_description') || 'Select a document type to generate with AI assistance. We\'ll guide you through any missing information.'}
      </p>

      {/* Document Type Selector */}
      <div className="relative mb-6">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
        >
          <div className="flex items-center">
            {selectedDocument ? (
              <>
                <span className="text-lg mr-3">{selectedDocument.icon}</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedDocument.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDocument.description}</p>
                </div>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {t('generation.select_document_type') || 'Select a document type to generate'}
              </span>
            )}
          </div>
          <ChevronDownIcon className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {DOCUMENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleDocumentSelect(option)}
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <div className="flex items-start">
                  <span className="text-lg mr-3 mt-1">{option.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{option.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.description}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ⏱️ {option.estimatedTime}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        📋 {option.requiredFields.length} required fields
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Missing Information Alert */}
      {selectedDocument && missingInfo.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                {t('generation.missing_info') || 'Some information is missing'}
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                {t('generation.missing_info_desc') || 'The AI will ask you for the following information during generation:'}
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                {missingInfo.map((info, index) => (
                  <li key={index}>• {info}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {selectedDocument && showPreview && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            {t('generation.preview') || 'Document Preview'}
          </h4>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-4 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">{selectedDocument.name}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Este documento será generado utilizando la información disponible del proyecto y las mejores prácticas para proyectos BESS en Chile...
            </p>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>1. DESCRIPCIÓN DEL PROYECTO</p>
              <p>2. ESPECIFICACIONES TÉCNICAS</p>
              <p>3. ANÁLISIS DE CUMPLIMIENTO</p>
              <p>4. CONCLUSIONES Y RECOMENDACIONES</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedDocument && (
        <div className="flex space-x-3">
          <button
            onClick={handlePreview}
            disabled={showPreview}
            className="flex-1 btn-secondary flex items-center justify-center disabled:opacity-50"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            {t('generation.preview') || 'Preview'}
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-300 mr-2"></div>
                {t('generation.generating') || 'Generating...'}
              </>
            ) : (
              <>
                <DocumentPlusIcon className="h-4 w-4 mr-2" />
                {t('generation.generate') || 'Generate Document'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Help Text */}
      {!selectedDocument && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                {t('generation.help_title') || 'Need help choosing?'}
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t('generation.help_description') || 'Start with Environmental Impact Assessment for new projects, or Interconnection Request if you have technical specifications ready.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}