"use client"

import { useState } from 'react'
import { useParams } from 'next/navigation'
import AgentDocumentGeneration from '@/components/AgentDocumentGeneration'
import AgentResultDisplaySimple from '@/components/AgentResultDisplaySimple'
import { RunPayload } from '@/lib/types'

export default function AgentGeneratePage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [result, setResult] = useState<RunPayload | null>(null)
  const [runId, setRunId] = useState<string | null>(null)

  const handleGenerationComplete = (generationResult: RunPayload) => {
    setResult(generationResult)
    setRunId(generationResult.run_id)
  }

  const handleNewGeneration = () => {
    setResult(null)
    setRunId(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          AI Agent Document Generation
        </h1>
        <p className="text-muted-foreground">
          Generate BESS permitting documents using our intelligent agent system
        </p>
      </div>

      {!result ? (
        <AgentDocumentGeneration 
          projectId={projectId}
          onComplete={handleGenerationComplete}
        />
      ) : (
        <AgentResultDisplaySimple 
          result={result}
          runId={runId!}
          onNewGeneration={handleNewGeneration}
        />
      )}
    </div>
  )
}