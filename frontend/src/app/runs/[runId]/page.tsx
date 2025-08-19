"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Lock, Eye, History } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { RunPayload } from '@/lib/types'
import { ResultActions } from '@/components/ResultActions'
import { ResultPreview } from '@/components/ResultPreview'
import AgentResultDisplaySimple from '@/components/AgentResultDisplaySimple'

interface PasscodeGateProps {
  onSubmit: (passcode: string) => void
  loading: boolean
}

function PasscodeGate({ onSubmit, loading }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode.trim()) {
      onSubmit(passcode.trim())
    }
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Passcode Required
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This run is protected. Please enter the passcode to view it.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !passcode.trim()}>
              {loading ? 'Verifying...' : 'Access Run'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RunDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const runId = params.runId as string
  const shareToken = searchParams.get('t')
  
  const [run, setRun] = useState<RunPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresPasscode, setRequiresPasscode] = useState(false)
  const [readonly, setReadonly] = useState(false)

  const loadRun = async (passcode?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      let response: Response
      
      if (shareToken) {
        // Shared run access
        const params = new URLSearchParams({
          token: shareToken,
          ...(passcode && { passcode })
        })
        response = await fetch(`/api/runs/share?${params}`)
      } else {
        // Direct run access
        response = await fetch(`/api/runs/${runId}`)
      }

      if (!response.ok) {
        if (response.status === 401) {
          const data = await response.json()
          if (data.requiresPasscode) {
            setRequiresPasscode(true)
            return
          }
        }
        throw new Error('Failed to load run')
      }

      const data = await response.json()
      
      if (shareToken) {
        setRun(data.run)
        setReadonly(data.readonly || false)
      } else {
        setRun(data)
        setReadonly(false)
      }
      
      setRequiresPasscode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (runId) {
      loadRun()
    }
  }, [runId, shareToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading run...</p>
        </div>
      </div>
    )
  }

  if (requiresPasscode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/runs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Runs
            </Link>
          </Button>
        </div>
        <PasscodeGate onSubmit={loadRun} loading={loading} />
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/runs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Runs
            </Link>
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Run not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/runs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Runs
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{run.metadata?.title || 'Run Details'}</h1>
              <p className="text-sm text-muted-foreground">
                {run.metadata?.project_name || 'Unknown Project'}
              </p>
            </div>
          </div>
        </div>

        {readonly && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            Read-only view
          </div>
        )}
      </div>

      {/* Run Content - Reuse existing result display */}
      <AgentResultDisplaySimple 
        result={run} 
        runId={runId}
        onNewGeneration={readonly ? undefined : () => {
          // Navigate to new generation
          window.location.href = '/projects'
        }}
      />
    </div>
  )
}