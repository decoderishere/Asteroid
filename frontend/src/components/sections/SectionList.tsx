"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { SectionWithInputs, DocumentSectionsResponse } from '@/lib/types/sections'
import { getOrderedSections } from '@/lib/sectionTemplates'
import SectionCard from './SectionCard'

interface SectionListProps {
  documentId: string
  onSectionUpdate?: (sections: SectionWithInputs[]) => void
}

export default function SectionList({ documentId, onSectionUpdate }: SectionListProps) {
  const [sections, setSections] = useState<SectionWithInputs[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [summary, setSummary] = useState({
    totalSections: 0,
    completedSections: 0,
    pendingSections: 0
  })

  // Load sections on mount
  useEffect(() => {
    loadSections()
  }, [documentId])

  const loadSections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${documentId}/sections`)
      
      if (!response.ok) {
        throw new Error('Failed to load sections')
      }

      const data: DocumentSectionsResponse = await response.json()
      setSections(data.sections)
      setSummary({
        totalSections: data.totalSections,
        completedSections: data.completedSections,
        pendingSections: data.pendingSections
      })
      
      onSectionUpdate?.(data.sections)
    } catch (error) {
      console.error('Error loading sections:', error)
      toast.error('Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  const createAllSections = async () => {
    try {
      setCreating(true)
      const allTemplates = getOrderedSections()
      const sectionKeys = allTemplates.map(t => t.key)

      const response = await fetch(`/api/documents/${documentId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionKeys })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create sections')
      }

      const result = await response.json()
      toast.success(`Created ${result.sectionsCreated} sections with ${result.inputRequestsCreated} input requests`)
      
      await loadSections() // Reload to get updated data
    } catch (error) {
      console.error('Error creating sections:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create sections')
    } finally {
      setCreating(false)
    }
  }

  const refreshSectionStates = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/sections`, {
        method: 'PUT'
      })

      if (!response.ok) {
        throw new Error('Failed to refresh section states')
      }

      const result = await response.json()
      if (result.updatedSections > 0) {
        toast.success(`Updated ${result.updatedSections} section states`)
        await loadSections()
      } else {
        toast.info('All section states are up to date')
      }
    } catch (error) {
      console.error('Error refreshing sections:', error)
      toast.error('Failed to refresh section states')
    }
  }

  const handleSectionUpdate = async (sectionId: string) => {
    // Reload sections after a section is updated
    await loadSections()
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'rendered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'ready_to_render':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'pending_inputs':
      default:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
    }
  }

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'rendered':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'ready_to_render':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Ready</Badge>
      case 'pending_inputs':
      default:
        return <Badge variant="outline" className="border-orange-200 text-orange-800">Pending</Badge>
    }
  }

  const progressPercentage = summary.totalSections > 0 
    ? (summary.completedSections / summary.totalSections) * 100 
    : 0

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Document Sections
                {getStateIcon('progress')}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Build your document section by section with guided inputs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSectionStates}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {sections.length === 0 && (
                <Button
                  onClick={createAllSections}
                  disabled={creating}
                  size="sm"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create All Sections
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{summary.completedSections} of {summary.totalSections} completed</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{summary.completedSections} Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span>{summary.pendingSections} Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>{summary.totalSections - summary.completedSections - summary.pendingSections} Ready</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">No sections created yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create document sections to start building your BESS feasibility study
                </p>
              </div>
              <Button
                onClick={createAllSections}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Sections...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create All Sections
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((sectionData, index) => (
            <SectionCard
              key={sectionData.section.id}
              sectionData={sectionData}
              index={index}
              onUpdate={() => handleSectionUpdate(sectionData.section.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}