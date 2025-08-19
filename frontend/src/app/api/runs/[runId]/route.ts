import { NextRequest, NextResponse } from 'next/server'
import { loadRun } from '@/lib/run-storage'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
  try {
    const { runId } = params

    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 })
    }

    const run = await loadRun(runId)
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    return NextResponse.json(run)
  } catch (error) {
    console.error('Run fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}