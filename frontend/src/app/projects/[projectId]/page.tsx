'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon,
  ChartBarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Project, Document, KPIMetric } from '@/types'
import FileUpload from '@/components/FileUpload'
import ProjectChat from '@/components/ProjectChat'
import GuidedDocumentGeneration from '@/components/GuidedDocumentGeneration'
import DocumentPreview from '@/components/DocumentPreview'
import { getDocTypeTranslationKey } from '@/lib/utils'
import { useTranslation } from '@/contexts/LanguageContext'

export default function ProjectDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const projectId = params.projectId as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [kpis, setKPIs] = useState<KPIMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const [projectData, documentsData, kpisData] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getProjectDocuments(projectId),
        apiClient.getProjectKPIs(projectId)
      ])
      
      setProject(projectData)
      setDocuments(documentsData)
      setKPIs(kpisData)
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      await apiClient.uploadFile(projectId, file)
      // Reload data after successful upload
      await loadProjectData()
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error al subir el archivo. Inténtelo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadDocument = async (documentId: string, title: string) => {
    try {
      console.log(`Attempting to download document: ${documentId} with title: ${title}`)
      const blob = await apiClient.downloadDocument(documentId)
      
      // Check if the blob is actually a blob and has content
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded file is empty or corrupted')
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${title}.md` // Fixed to use .md extension for markdown files
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log(`Successfully downloaded document: ${title}`)
      
      // Show success feedback
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      successDiv.textContent = `Documento "${title}" descargado exitosamente`
      document.body.appendChild(successDiv)
      setTimeout(() => document.body.removeChild(successDiv), 3000)
      
    } catch (error: any) {
      console.error('Error downloading document:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred'
      console.error('Error details:', {
        status: error?.response?.status,
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/documents/${documentId}/download`,
        documentId,
        title
      })
      
      // Show detailed error feedback
      const errorDiv = document.createElement('div')
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50 max-w-sm'
      errorDiv.innerHTML = `
        <div class="font-semibold">Error al descargar documento</div>
        <div class="text-sm mt-1">${errorMessage}</div>
        <div class="text-xs mt-1 opacity-75">ID: ${documentId.substring(0, 8)}...</div>
      `
      document.body.appendChild(errorDiv)
      setTimeout(() => document.body.removeChild(errorDiv), 5000)
    }
  }

  const handlePreviewDocument = (document: Document) => {
    setSelectedDocument(document)
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setSelectedDocument(null)
  }

  const getKPIValue = (metricName: string): number => {
    const kpi = kpis.find(k => k.metric_name === metricName)
    return kpi?.metric_value || 0
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'needs_review':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOriginIcon = (origin: string) => {
    switch (origin) {
      case 'ai_generated':
        return '🤖'
      case 'coordinator_provided':
        return '👤'
      default:
        return '📁'
    }
  }

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case 'ai_generated':
        return 'AI Generated'
      case 'coordinator_provided':
        return 'Coordinator Provided'
      default:
        return 'User Uploaded'
    }
  }

  // Group documents by type
  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.doc_type]) {
      acc[doc.doc_type] = []
    }
    acc[doc.doc_type].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  // Sort document types logically
  const documentTypeOrder: Record<string, number> = {
    'environmental_impact_assessment': 1,
    'interconnection_request': 2,
    'land_use_permit': 3,
    'construction_permit': 4,
    'electrical_safety_certification': 5,
    'environmental_compliance_report': 6,
    'substation_connection_study': 7,
    'grid_impact_analysis': 8
  }
  
  const documentTypes = Object.keys(groupedDocuments).sort((a, b) => {
    const orderA = documentTypeOrder[a] || 999
    const orderB = documentTypeOrder[b] || 999
    return orderA - orderB
  })

  const getDocTypeDisplayName = (docType: string) => {
    const displayNames: Record<string, string> = {
      'environmental_impact_assessment': 'Environmental Impact Assessment',
      'interconnection_request': 'Interconnection Request',
      'land_use_permit': 'Land Use Permit',
      'construction_permit': 'Construction Permit',
      'electrical_safety_certification': 'Electrical Safety Certification',
      'environmental_compliance_report': 'Environmental Compliance Report',
      'substation_connection_study': 'Substation Connection Study',
      'grid_impact_analysis': 'Grid Impact Analysis'
    }
    return displayNames[docType] || docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Proyecto no encontrado</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">El proyecto que busca no existe o ha sido eliminado.</p>
        <Link href="/projects" className="btn-primary mt-4">
          Volver a Proyectos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link 
          href="/projects" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver a Proyectos
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              <strong>Subestación:</strong> {project.substation_id}
            </p>
            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description}</p>
            )}
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Documentos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{documents.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completitud</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('document_completion_percentage').toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Calidad Prom.</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getKPIValue('average_quality_score').toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aprobados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Documents */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('project.documents') || 'Documentos Generados'}</h2>
              <Link
                href={`/projects/${projectId}/traces`}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                {t('project.view_traceability') || 'Ver trazabilidad'}
              </Link>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('project.no_documents') || 'No hay documentos generados'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('project.upload_files_hint') || 'Suba archivos técnicos para que los agentes generen documentos de permisos.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {documentTypes.map((docType) => (
                  <div key={docType} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        {getDocTypeDisplayName(docType)}
                        <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                          {groupedDocuments[docType].length}
                        </span>
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {groupedDocuments[docType].map((doc) => (
                        <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getStatusIcon(doc.status)}
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {doc.title}
                                </h4>
                                <div className="flex items-center space-x-4 mt-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('project.version') || 'Versión'}: {doc.version}
                                  </p>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs">{getOriginIcon(doc.origin || 'user_uploaded')}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {getOriginLabel(doc.origin || 'user_uploaded')}
                                    </span>
                                  </div>
                                  {doc.quality_score && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {t('project.quality') || 'Calidad'}: {doc.quality_score}/100
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                                {doc.status}
                              </span>
                              <button
                                onClick={() => handleDownloadDocument(doc.id, doc.title)}
                                className="text-primary-600 hover:text-primary-700 p-1"
                                title={t('project.download_document') || 'Descargar documento'}
                              >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handlePreviewDocument(doc)}
                                className="text-primary-600 hover:text-primary-700 p-1"
                                title={t('view') || 'Preview documento'}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {doc.placeholders && doc.placeholders.length > 0 && (
                            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                {t('project.pending_information') || 'Información pendiente'}:
                              </p>
                              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                                {doc.placeholders.slice(0, 3).map((placeholder, index) => (
                                  <li key={index}>• {placeholder}</li>
                                ))}
                                {doc.placeholders.length > 3 && (
                                  <li>• {t('project.and_more') || 'Y'} {doc.placeholders.length - 3} {t('project.more') || 'más'}...</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="space-y-6">
          {/* File Upload */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('project.upload_documents') || 'Subir Documentos'}
            </h2>
            <FileUpload
              onFileUpload={handleFileUpload}
              uploading={uploading}
            />
          </div>
          
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('project.quick_actions') || 'Acciones Rápidas'}
            </h3>
            <div className="space-y-3">
              <Link
                href={`/projects/${projectId}/agent-generate`}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <DocumentTextIcon className="h-4 w-4" />
                🤖 AI Agent Generation
              </Link>
              <Link
                href={`/projects/${projectId}/review`}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <EyeIcon className="h-4 w-4" />
                {t('project.review_documents') || 'Revisar Documentos'}
              </Link>
              <Link
                href={`/projects/${projectId}/report`}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                {t('project.generate_report') || 'Generar Reporte'}
              </Link>
            </div>
          </div>
          
          {/* Guided Document Generation */}
          <GuidedDocumentGeneration 
            projectId={projectId}
            onDocumentGenerated={loadProjectData}
          />
          
          {/* Project Chat */}
          <div className="h-96">
            <ProjectChat 
              projectId={projectId} 
              projectName={project?.name || 'Project'}
            />
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentPreview
          document={selectedDocument}
          isOpen={previewOpen}
          onClose={handleClosePreview}
          onUpdate={loadProjectData}
        />
      )}
    </div>
  )
}