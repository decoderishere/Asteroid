"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { agentApi } from '@/lib/agent-api'
import { RunPayload } from '@/lib/types'

interface AgentDocumentGenerationProps {
  projectId: string
  onComplete?: (result: RunPayload) => void
}

interface RunStatus {
  id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
  query: string
  max_docs: number
  processed_docs: number
  total_docs?: number
  current_step: string
  progress: number
  error?: string
  finished: boolean
  result?: RunPayload
}

interface AgentEvent {
  run_id: string
  agent_id: string
  event_type: string
  timestamp: string
  message: string
  data: Record<string, any>
  error?: string
}

export default function AgentDocumentGeneration({ projectId, onComplete }: AgentDocumentGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [status, setStatus] = useState<RunStatus | null>(null)
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("Chilean BESS Environmental Impact Assessment")
  const [maxDocs, setMaxDocs] = useState(10)

  // Poll for status updates
  useEffect(() => {
    if (!runId || !isGenerating) return

    const pollStatus = async () => {
      try {
        const data = await agentApi.getRunStatus(runId)
        setStatus(data)
        
        if (data.finished) {
          setIsGenerating(false)
          if (data.status === 'succeeded' && data.result && onComplete) {
            // Transform backend result to frontend format
            const backendResult = data.result
            const transformedResult = {
              run_id: data.id,
              markdown: backendResult.document_assembly?.markdown || '',
              html: backendResult.document_assembly?.html || '',
              files: backendResult.document_assembly?.files || {},
              metadata: {
                title: backendResult.document_assembly?.metadata?.title || 'Generated Document',
                project_name: backendResult.document_assembly?.metadata?.project_name || backendResult.summary?.query || 'Unknown Project',
                generated_date: backendResult.document_assembly?.metadata?.generated_date || new Date().toLocaleDateString(),
                sections_count: backendResult.summary?.sections_generated || 0,
                using_mock: backendResult.content_generation?.using_mock || false
              }
            }
            onComplete(transformedResult)
          }
        }
      } catch (err) {
        console.error('Failed to fetch status:', err)
      }
    }

    // Poll every 1 second while running
    const interval = setInterval(pollStatus, 1000)
    return () => clearInterval(interval)
  }, [runId, isGenerating, onComplete])

  const startGeneration = async () => {
    try {
      setError(null)
      setIsGenerating(true)
      setStatus(null)
      setEvents([])

      const data = await agentApi.startGeneration({
        query,
        max_docs: maxDocs
      })
      
      setRunId(data.run_id)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setIsGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'running': return 'text-blue-600'
      case 'queued': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return <CheckCircleIcon className="h-4 w-4" />
      case 'failed': return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'running': return <ClockIcon className="h-4 w-4 animate-spin" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const formatStep = (step: string) => {
    return step.charAt(0).toUpperCase() + step.slice(1).replace(/_/g, ' ')
  }

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      {!isGenerating && !status?.finished && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Agent Document Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium mb-2">
                Document Query
              </label>
              <input
                id="query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Describe the document to generate..."
              />
            </div>
            
            <div>
              <label htmlFor="maxDocs" className="block text-sm font-medium mb-2">
                Max Documents to Process
              </label>
              <input
                id="maxDocs"
                type="number"
                value={maxDocs}
                onChange={(e) => setMaxDocs(parseInt(e.target.value) || 10)}
                className="w-full p-2 border rounded-md"
                min="1"
                max="50"
              />
            </div>

            <Button onClick={startGeneration} className="w-full" size="lg">
              Generate Document with AI Agents
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Display */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(status.status)}
                Generation Progress
              </span>
              <Badge variant={status.status === 'succeeded' ? 'default' : 'secondary'}>
                {status.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(status.progress)}%</span>
              </div>
              <Progress value={status.progress} className="w-full" />
            </div>

            {/* Current Step */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-1">Current Step:</div>
              <div className={`text-sm ${getStatusColor(status.status)}`}>
                {formatStep(status.current_step)}
              </div>
            </div>

            {/* Document Processing Stats */}
            {status.total_docs && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {status.processed_docs}
                  </div>
                  <div className="text-sm text-blue-600">Processed</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-600">
                    {status.total_docs}
                  </div>
                  <div className="text-sm text-gray-600">Total Found</div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {status.error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>{status.error}</AlertDescription>
              </Alert>
            )}

            {/* Success Actions */}
            {status.status === 'succeeded' && status.result && (
              <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="font-medium">Generation Complete!</span>
                </div>
                
                <div className="text-sm text-green-600">
                  Generated {status.result.metadata.sections_count} sections for "{status.result.metadata.project_name}"
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    // Handle markdown view
                    console.log('View markdown:', status.result?.markdown)
                  }}>
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    View Markdown
                  </Button>
                  
                  <Button size="sm" variant="outline" onClick={() => {
                    // Handle HTML view
                    console.log('View HTML:', status.result?.html)
                  }}>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Export HTML
                  </Button>
                </div>
              </div>
            )}

            {/* Reset Button */}
            {status.finished && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatus(null)
                  setRunId(null)
                  setEvents([])
                  setError(null)
                }}
                className="w-full"
              >
                Generate New Document
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Activity Log (collapsed by default) */}
      {status && events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agent Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {events.slice(-10).map((event, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-blue-600">{event.agent_id}</span>
                    <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1">{event.message}</div>
                  {event.error && (
                    <div className="mt-1 text-red-600">Error: {event.error}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}