import { NextRequest, NextResponse } from 'next/server'
import { saveRun } from '@/lib/run-storage'
import { RunPayload } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { runId, runData }: { runId: string, runData: RunPayload } = await request.json()

    if (!runId || !runData) {
      return NextResponse.json({ error: 'runId and runData are required' }, { status: 400 })
    }

    await saveRun(runId, runData)

    return NextResponse.json({ 
      success: true, 
      message: 'Run saved successfully',
      runId 
    })
  } catch (error) {
    console.error('Run save error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}