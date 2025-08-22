"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Play,
  Eye,
  RefreshCw
} from 'lucide-react'
import { SectionWithInputs } from '@/lib/types/sections'
import InputRequestChip from './InputRequestChip'
import SectionPreview from './SectionPreview'
import { toast } from 'sonner'

interface SectionCardProps {
  sectionData: SectionWithInputs
  index: number
  onUpdate: () => void
}

export default function SectionCard({ sectionData, index, onUpdate }: SectionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [rendering, setRendering] = useState(false)
  const { section, inputRequests, unresolvedCount, template } = sectionData

  const getStateInfo = (state: string) => {
    switch (state) {
      case 'rendered':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          badge: <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>,
          color: 'border-green-200 bg-green-50/50'
        }
      case 'ready_to_render':
        return {
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          badge: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Ready to Render</Badge>,
          color: 'border-blue-200 bg-blue-50/50'
        }
      case 'pending_inputs':
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
          badge: <Badge variant="outline" className="border-orange-200 text-orange-800">Pending Inputs</Badge>,
          color: 'border-orange-200 bg-orange-50/50'
        }
    }
  }

  const stateInfo = getStateInfo(section.state)

  const handleRenderSection = async () => {
    if (section.state !== 'ready_to_render' && section.state !== 'rendered') {
      toast.error('Section is not ready to render. Please complete all required inputs first.')
      return
    }

    try {
      setRendering(true)
      const response = await fetch(`/api/sections/${section.id}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: section.state === 'rendered' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to render section')
      }

      const result = await response.json()
      toast.success(
        section.state === 'rendered' 
          ? 'Section re-rendered successfully' 
          : 'Section rendered successfully'
      )
      
      onUpdate() // Refresh parent data
    } catch (error) {
      console.error('Error rendering section:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to render section')
    } finally {
      setRendering(false)
    }
  }

  const handleInputUpdate = () => {
    onUpdate() // Refresh parent data when an input is updated
  }

  const canRender = section.state === 'ready_to_render' || section.state === 'rendered'
  const isCompleted = section.state === 'rendered'

  return (
    <Card className={`transition-all duration-200 ${stateInfo.color}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-muted text-sm font-medium">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {stateInfo.icon}
                <CardTitle className="text-lg">{template.title}</CardTitle>
                {stateInfo.badge}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            
            {canRender && (
              <Button
                onClick={handleRenderSection}
                disabled={rendering}
                size="sm"
                variant={isCompleted ? "outline" : "default"}
              >
                {rendering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {isCompleted ? 'Re-render' : 'Render'}
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Section Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Category:</span>
                <p className="capitalize">{template.category}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Required Inputs:</span>
                <p>{inputRequests.length}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Missing:</span>
                <p className={unresolvedCount > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                  {unresolvedCount}
                </p>
              </div>
            </div>

            {/* Dependencies */}
            {template.dependencies && template.dependencies.length > 0 && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Dependencies:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {template.dependencies.map(dep => (
                    <Badge key={dep} variant="outline" className="text-xs">
                      {dep.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Input Requests */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Required Inputs</h4>
              <div className="space-y-3">
                {inputRequests.map(inputRequest => (
                  <InputRequestChip
                    key={inputRequest.id}
                    inputRequest={inputRequest}
                    sectionKey={section.sectionKey}
                    onUpdate={handleInputUpdate}
                  />
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span>
                <p>{new Date(section.createdAt).toLocaleDateString()}</p>
              </div>
              {section.renderedAt && (
                <div>
                  <span className="font-medium">Last Rendered:</span>
                  <p>{new Date(section.renderedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}

      {/* Preview Modal/Section */}
      {showPreview && isCompleted && (
        <SectionPreview
          section={section}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Card>
  )
}