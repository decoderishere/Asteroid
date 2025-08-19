'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Document, DocumentVersion, DocumentVersionContent } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/lib/dateUtils'
import Toast from './Toast'

interface DocumentPreviewProps {
  document: Document
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export default function DocumentPreview({ 
  document: doc, 
  isOpen, 
  onClose, 
  onUpdate 
}: DocumentPreviewProps) {
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersionContent | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'edit' | 'traceability'>('preview')
  const { toasts, success, error, removeToast } = useToast()

  useEffect(() => {
    if (isOpen && doc) {
      loadDocumentContent()
    }
  }, [isOpen, doc])

  const loadDocumentContent = async () => {
    try {
      setLoading(true)
      // Use the content from the doc object
      const docContent = doc.content || 'No content available'
      setContent(docContent)
      setEditedContent(docContent)
      setOriginalContent(docContent)
      
      // Load versions for traceability
      try {
        const docVersions = await apiClient.getDocumentVersions(doc.id)
        setVersions(docVersions)
      } catch (err) {
        console.warn('Could not load doc versions:', err)
        setVersions([])
      }
    } catch (err) {
      console.error('Error loading doc content:', err)
      setContent('Error loading doc content')
      error('Failed to load doc content')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      console.log(`Downloading doc: ${doc.id} - ${doc.title}`)
      const blob = await apiClient.downloadDocument(doc.id)
      
      // Check if the blob is actually a blob and has content
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded file is empty or corrupted')
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${doc.title}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      success('Document downloaded successfully')
      
    } catch (err: any) {
      console.error('Error downloading doc:', err)
      const errorMessage = err?.response?.data?.detail || err?.message || 'Unknown error occurred'
      error(`Download failed: ${errorMessage}`)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const result = await apiClient.saveDocument(doc.id, {
        content: editedContent,
        change_summary: getChangeSummary(originalContent, editedContent),
        author_name: "User",
        author_email: undefined
      })
      
      setContent(editedContent)
      setOriginalContent(editedContent)
      setIsEditing(false)
      setActiveTab('preview')
      
      // Reload versions to show the new one
      const docVersions = await apiClient.getDocumentVersions(doc.id)
      setVersions(docVersions)
      
      success(`Changes saved at ${result.saved_at}`)
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (err: any) {
      console.error('Error saving doc:', err)
      const errorMessage = err?.response?.data?.detail || err?.message || 'Unknown error occurred'
      error(`Save failed: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    setEditedContent(content)
    setIsEditing(true)
    setActiveTab('edit')
  }

  const cancelEdit = () => {
    setEditedContent(content)
    setIsEditing(false)
    setActiveTab('preview')
  }
  
  const getChangeSummary = (originalContent: string, newContent: string): string => {
    const originalLength = originalContent.length
    const newLength = newContent.length
    
    if (Math.abs(newLength - originalLength) > originalLength * 0.1) {
      return newLength > originalLength ? 'Significant content addition' : 'Significant content reduction'
    }
    return 'Minor content modifications'
  }
  
  const hasUnsavedChanges = () => {
    return editedContent !== originalContent
  }
  
  const handleViewVersion = async (version: DocumentVersion) => {
    try {
      const versionContent = await apiClient.getDocumentVersionContent(doc.id, version.id)
      setSelectedVersion(versionContent)
    } catch (err) {
      console.error('Error loading version:', err)
      error('Failed to load version content')
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-gray-900 shadow-xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {doc.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {doc.doc_type.replace('_', ' ')} • Version {doc.version}
                    {hasUnsavedChanges() && (
                      <span className="ml-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        • Unsaved changes
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDownload}
                    className="btn-secondary flex items-center"
                    title="Download doc"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="btn-primary flex items-center"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelEdit}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || !hasUnsavedChanges()}
                        className="btn-primary flex items-center disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckIcon className="h-4 w-4 mr-2" />
                        )}
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { key: 'preview', label: 'Preview', icon: EyeIcon },
                  { key: 'edit', label: 'Edit', icon: PencilIcon },
                  { key: 'traceability', label: 'Traceability', icon: ClockIcon },
                ].map((tab) => {
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        isActive
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="h-full">
                  {activeTab === 'preview' && (
                    <div className="p-6">
                      <div className="prose dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-gray-100 leading-relaxed">
                          {content}
                        </pre>
                      </div>
                    </div>
                  )}

                  {activeTab === 'edit' && (
                    <div className="p-6">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-full min-h-[500px] p-4 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        placeholder="Edit doc content..."
                      />
                    </div>
                  )}

                  {activeTab === 'traceability' && (
                    <div className="p-6">
                      {selectedVersion ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              Version {selectedVersion.version_number}
                            </h4>
                            <button
                              onClick={() => setSelectedVersion(null)}
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
                            >
                              ← Back to versions
                            </button>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Author:</span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedVersion.author.name}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                  {formatDateTime(selectedVersion.created_at)}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Origin:</span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedVersion.origin}</span>
                              </div>
                              {selectedVersion.change_summary && (
                                <div className="col-span-2">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Changes:</span>
                                  <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedVersion.change_summary}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="prose dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-gray-100 leading-relaxed">
                              {selectedVersion.content}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Document Versions</h4>
                          {versions.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                              <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No version history available yet.</p>
                              <p className="text-sm mt-2">Versions will appear here after saving changes.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {versions.map((version) => (
                                <div 
                                  key={version.id} 
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                  onClick={() => handleViewVersion(version)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                          Version {version.version_number}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                          {version.origin}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        By {version.author_name} • {formatDateTime(version.created_at)}
                                      </div>
                                      {version.change_summary && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                          {version.change_summary}
                                        </div>
                                      )}
                                    </div>
                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  )
}