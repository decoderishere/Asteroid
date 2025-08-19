"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Calendar, FileText, Hash, Beaker, ExternalLink, Share2 } from 'lucide-react'
import type { DocRun } from '@/types/run'
import { ResultActions } from './ResultActions'
import { ResultPreview } from './ResultPreview'
import { toast } from 'sonner'
import Link from 'next/link'

interface AgentResultDisplayProps {
  run: DocRun
  onNewGeneration?: () => void
}

export default function AgentResultDisplaySimple({ run, onNewGeneration }: AgentResultDisplayProps) {
  const saveToHistory = async () => {
    try {
      const response = await fetch('/api/runs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: run.id, runData: run }),
      })

      if (!response.ok) throw new Error('Failed to save run')
      toast.success('Run saved to history')
    } catch (error) {
      toast.error('Failed to save run to history')
    }
  }

  const copyShareLink = async () => {
    try {
      const response = await fetch('/api/runs/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: run.id }),
      })

      if (!response.ok) throw new Error('Failed to create share link')

      const data = await response.json()
      await navigator.clipboard.writeText(data.shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      toast.error('Failed to create share link')
    }
  }
  if (!run) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No result data available</p>
        </CardContent>
      </Card>
    )
  }

  // Debug mode for invalid results
  if (!run.title) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-600">Debug Mode - Invalid Result Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <details className="border rounded-lg p-4">
            <summary className="font-semibold cursor-pointer mb-2">
              Raw Result Data (click to expand)
            </summary>
            <pre className="text-xs overflow-auto bg-muted p-4 rounded max-h-96">
              {JSON.stringify(run, null, 2)}
            </pre>
          </details>
          
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              onClick={() => console.log('Full raw result:', run)}
            >
              Log to Console
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                const dataStr = JSON.stringify(run, null, 2)
                const blob = new Blob([dataStr], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `agent-result-${run.id}.txt`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
            >
              Download as Text
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Success Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-2xl text-foreground">Generation Complete</h2>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Your document has been successfully generated
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Title</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {run.title || 'Untitled Document'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Project</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {run.project || 'Unknown Project'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Generated</p>
                    <p className="text-sm text-muted-foreground">
                      {run.generatedAt || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Sections</p>
                    <p className="text-sm text-muted-foreground">
                      {run.sections.length || 0} sections generated
                    </p>
                  </div>
                </div>

                {run && run.mockMode && (
                  <div className="flex items-center gap-2 pt-2">
                    <Beaker className="h-4 w-4 text-orange-500" />
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Mock Mode
                    </Badge>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Run ID</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {run.id}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: Actions & Raw Data */}
        <div className="xl:col-span-1 space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultActions run={run} />
              
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={saveToHistory}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Runs
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyShareLink}
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy share link
                  </Button>
                </div>
                
                {onNewGeneration && (
                  <Button 
                    variant="outline" 
                    onClick={onNewGeneration}
                    className="w-full"
                  >
                    Generate New Document
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collapsible Raw Data */}
          <Card>
            <CardContent className="p-4">
              <details>
                <summary className="font-medium cursor-pointer text-sm mb-3">
                  Raw Result Data
                </summary>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">
                  {JSON.stringify(run, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview (Sticky) */}
        <div className="xl:col-span-1">
          <ResultPreview run={run} />
        </div>
      </div>
    </div>
  )
}